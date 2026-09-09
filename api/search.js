import { searchItems } from './_lib/scraper1688.js'
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
    // ?debug=1 reports what the scraper actually saw on the page (title,
    // a body text sample, how many product cards matched) instead of the
    // normalized result - use it to fix selectors in _lib/scraper1688.js
    // if 1688 changes its markup or the search results page turns out to
    // differ from the homepage feed the current selectors were built from.
    const debug = req.query.debug === '1'
    const raw = await searchItems(keyword, page, { timeoutMs: 12000, debug })

    if (debug) {
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

    if (err.blocked) {
      res.status(503).json({ error: '1688 is temporarily blocking automated browsing - try again shortly', detail: err.message })
      return
    }
    if (err.timedOut) {
      res.status(504).json({ error: 'Timed out fetching results from 1688', detail: err.message })
      return
    }
    res.status(502).json({ error: 'Could not fetch the product list', detail: err.message })
  }
}
