import { getCachedSearch } from './_lib/searchCache.js'
import { DEFAULT_KEYWORDS, HOME_FEED_KEYWORD } from './_lib/scrapeTargets.js'

// The homepage "trending" grid draws only from what the scraper bot has
// already indexed (see _lib/searchCache.js) - there's no live fallback
// left, so this just reads a handful of cached keywords and merges them
// into one deduplicated batch. A ?keyword= override tries one of the
// buyer's own recent searches first (if the scraper happens to have
// indexed it); a ?categoryId= override reads that category's own cached
// entry directly instead of mixing in unrelated keywords, since the buyer
// picked it specifically to see only that.
const ITEMS_LIMIT = 24
const POOL_SIZE = 4

// HOME_FEED_KEYWORD (whatever the bookmarklet last captured off 1688's own
// homepage) is mixed in here alongside the fixed keyword list, so the
// site's own Home page gets some variety beyond just those keywords once
// that's been captured at least once.
function pickKeywords(requested) {
  const pool = requested ? [requested] : []
  const shuffled = [...DEFAULT_KEYWORDS, HOME_FEED_KEYWORD].sort(() => Math.random() - 0.5)
  for (const kw of shuffled) {
    if (pool.length >= POOL_SIZE) break
    if (!pool.includes(kw)) pool.push(kw)
  }
  return pool
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  res.setHeader('Cache-Control', 'no-store')

  const categoryId = (req.query.categoryId || '').toString().trim()
  const requested = (req.query.keyword || '').toString().trim()

  if (categoryId) {
    const cached = await getCachedSearch(categoryId)
    res.status(200).json({ items: cached ? cached.items.slice(0, ITEMS_LIMIT) : [] })
    return
  }

  const keywords = pickKeywords(requested)
  const results = await Promise.all(keywords.map((kw) => getCachedSearch(kw)))

  const collected = []
  const seen = new Set()
  for (const cached of results) {
    if (!cached) continue
    for (const item of cached.items) {
      if (!seen.has(item.itemId)) {
        seen.add(item.itemId)
        collected.push(item)
      }
    }
  }

  res.status(200).json({ items: collected.slice(0, ITEMS_LIMIT) })
}
