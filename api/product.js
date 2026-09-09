import { getItemDetail } from './_lib/cjdropshipping.js'
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
    const raw = await getItemDetail(itemId)

    // Same temporary diagnostic escape hatch as api/search.js - see there.
    if (req.query.raw === '1') {
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
    if (err.rateLimited) {
      res.status(429).json({ error: err.message })
      return
    }
    if (err.upstreamBusinessError) {
      res.status(503).json({ error: 'Purchase unavailable right now - contact the administrator', detail: err.message })
      return
    }
    res.status(502).json({ error: 'Could not fetch the product details', detail: err.message })
  }
}
