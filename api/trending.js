import { searchItems, listByCategory } from './_lib/scraper1688.js'
import { normalizeSearchResponse } from './_lib/normalize.js'
import { getCachedSearch, setCachedSearch } from './_lib/searchCache.js'

// The homepage "trending" grid must always come back with a full batch of
// ITEMS_LIMIT items (a single keyword can come up short), and the same
// keyword should look different across reloads - both handled by trying
// several keyword/page combinations and merging the (deduplicated)
// results until the batch is full or attempts run out. A ?keyword=
// override lets the client ask for one of the buyer's own recent
// searches first; if that alone doesn't fill the batch, generic defaults
// top it up rather than leaving the grid short. A ?categoryId= override
// instead browses a single category (e.g. the homepage's category
// chips) - that stays pure to the category across attempts (deeper
// pages of the same category) rather than topping up with unrelated
// keywords, since the buyer picked it specifically to see only that.
//
// Each attempt is a real browser navigation (see _lib/scraper1688.js),
// far slower than the old API's JSON calls, so attempts run concurrently
// rather than one after another - MAX_ATTEMPTS is kept modest to bound
// how many browser tabs a single request opens at once.
const DEFAULT_KEYWORDS = ['phone case', 'keychain', 'usb cable', 'bluetooth earphone', 'power bank', 'memory card', 'watch', 'sunglasses', 'backpack', 'toy']
const ITEMS_LIMIT = 24
const MAX_ATTEMPTS = 3

function randomPage() {
  return Math.floor(Math.random() * 3) + 1 // 1-3, so a reload of the same keyword/category surfaces different items
}

function randomDefaultKeyword() {
  return DEFAULT_KEYWORDS[Math.floor(Math.random() * DEFAULT_KEYWORDS.length)]
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const categoryId = (req.query.categoryId || '').toString().trim()
  const requested = (req.query.keyword || '').toString().trim()
  const cacheKey = categoryId ? `category:${categoryId}` : requested || null

  const attempts = Array.from({ length: MAX_ATTEMPTS }, (_, attempt) =>
    categoryId
      ? { term: categoryId, page: attempt + 1, isCategory: true }
      : { term: attempt === 0 && requested ? requested : randomDefaultKeyword(), page: randomPage(), isCategory: false }
  )

  const results = await Promise.allSettled(
    attempts.map(({ term, page, isCategory }) =>
      (isCategory ? listByCategory(term, page, { timeoutMs: 12000 }) : searchItems(term, page, { timeoutMs: 12000 })).then((raw) => ({
        term,
        normalized: normalizeSearchResponse(raw, term, 1)
      }))
    )
  )

  const collected = []
  const seen = new Set()
  let anyFailed = false

  for (const result of results) {
    if (result.status !== 'fulfilled') {
      anyFailed = true
      console.error(`trending: ${categoryId ? `category "${categoryId}"` : `keyword "${requested}"`} failed`, result.reason?.message)
      continue
    }
    const { normalized } = result.value
    for (const item of normalized.items) {
      if (!seen.has(item.itemId)) {
        seen.add(item.itemId)
        collected.push(item)
      }
    }
    if (normalized.items.length && cacheKey) {
      await setCachedSearch(cacheKey, normalized)
    }
  }

  res.setHeader('Cache-Control', 'no-store')

  if (collected.length) {
    res.status(200).json({ items: collected.slice(0, ITEMS_LIMIT) })
    return
  }

  // Every live attempt failed (or returned nothing) - fall back to a
  // previously cached batch instead of leaving the grid empty.
  if (anyFailed && cacheKey) {
    const cached = await getCachedSearch(cacheKey)
    if (cached) {
      res.status(200).json({ items: cached.items.slice(0, ITEMS_LIMIT) })
      return
    }
  }

  res.status(200).json({ items: [] })
}
