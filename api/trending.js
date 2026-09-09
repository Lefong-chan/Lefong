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
// Attempts run one at a time, not concurrently: @sparticuz/chromium runs
// in --single-process mode to fit serverless memory limits, which means
// several pages navigating at once inside that one process can crash the
// whole browser instead of just the one tab - taking every in-flight
// attempt down with it (that's what "Target page, context or browser has
// been closed" errors on every attempt of the same request meant). One
// page at a time avoids that at the cost of latency.
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
  const collected = []
  const seen = new Set()
  let anyFailed = false
  const cacheKey = categoryId ? `category:${categoryId}` : requested || null

  for (let attempt = 0; attempt < MAX_ATTEMPTS && collected.length < ITEMS_LIMIT; attempt++) {
    try {
      let term
      let raw
      if (categoryId) {
        term = categoryId
        raw = await listByCategory(categoryId, attempt + 1, { timeoutMs: 12000 })
      } else {
        term = attempt === 0 && requested ? requested : randomDefaultKeyword()
        raw = await searchItems(term, randomPage(), { timeoutMs: 12000 })
      }
      const normalized = normalizeSearchResponse(raw, term, 1)
      for (const item of normalized.items) {
        if (!seen.has(item.itemId)) {
          seen.add(item.itemId)
          collected.push(item)
        }
      }
      if (normalized.items.length && cacheKey) {
        await setCachedSearch(cacheKey, normalized)
      }
      // A category with fewer than ITEMS_LIMIT products would otherwise
      // spin through all MAX_ATTEMPTS pages for nothing once exhausted.
      if (categoryId && !normalized.items.length) break
    } catch (err) {
      anyFailed = true
      console.error(`trending: ${categoryId ? `category "${categoryId}"` : `keyword "${requested}"`} failed`, err.message)
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
