import { searchItems } from './_lib/cjdropshipping.js'
import { normalizeSearchResponse } from './_lib/normalize.js'
import { getCachedSearch, setCachedSearch } from './_lib/searchCache.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const keyword = (req.query.keyword || '').toString().trim()
  const page = (req.query.page || '1').toString()

  if (!keyword) {
    res.status(400).json({ error: 'keyword is required' })
    return
  }

  try {
    const raw = await searchItems(keyword, page, { timeoutMs: 8000, maxRetries: 1 })

    // Temporary diagnostic escape hatch: ?raw=1 returns CJ Dropshipping's
    // untouched response so the field-name mapping in _lib/normalize.js
    // can be corrected against the real payload shape. Safe to keep - it
    // never touches the token, only what CJ already sent back.
    if (req.query.raw === '1') {
      res.setHeader('Cache-Control', 'no-store')
      res.status(200).json(raw)
      return
    }

    const normalized = normalizeSearchResponse(raw, keyword, page)
    if (page === '1' && normalized.items.length) {
      await setCachedSearch(keyword, normalized)
    }
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600')
    res.status(200).json(normalized)
  } catch (err) {
    console.error('search error', err)

    // A live failure shouldn't leave the buyer looking at an empty page -
    // fall back to the last successful result for this exact keyword.
    if (page === '1') {
      const cached = await getCachedSearch(keyword)
      if (cached) {
        res.setHeader('Cache-Control', 'no-store')
        res.status(200).json({ ...cached, stale: true })
        return
      }
    }

    if (err.rateLimited) {
      res.status(429).json({ error: err.message })
      return
    }
    if (err.upstreamBusinessError) {
      res.status(503).json({ error: 'Purchase unavailable right now - contact the administrator', detail: err.message })
      return
    }
    res.status(502).json({ error: 'Could not fetch the product list', detail: err.message })
  }
}
