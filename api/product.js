import { getItemDetail } from './_lib/scraper1688.js'
import { normalizeDetailResponse } from './_lib/normalize.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const itemId = (req.query.itemId || '').toString().trim()
  if (!itemId) {
    res.status(400).json({ error: 'itemId is required' })
    return
  }

  try {
    // Same ?debug=1 diagnostic hatch as api/search.js - see there.
    const debug = req.query.debug === '1'
    const raw = await getItemDetail(itemId, { timeoutMs: 12000, debug })

    if (debug) {
      res.setHeader('Cache-Control', 'no-store')
      res.status(200).json(raw)
      return
    }

    const normalized = normalizeDetailResponse(raw)
    if (!normalized) {
      res.status(404).json({ error: 'Product not found' })
      return
    }
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600')
    res.status(200).json(normalized)
  } catch (err) {
    console.error('product detail error', err)
    if (err.blocked) {
      res.status(503).json({ error: '1688 is temporarily blocking automated browsing - try again shortly', detail: err.message })
      return
    }
    if (err.timedOut) {
      res.status(504).json({ error: 'Timed out fetching this product from 1688', detail: err.message })
      return
    }
    res.status(502).json({ error: 'Could not fetch the product details', detail: err.message })
  }
}
