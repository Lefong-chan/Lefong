import { getCachedProduct } from './_lib/productCache.js'

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
    const cached = await getCachedProduct(itemId)
    if (!cached) {
      // The scraper bot (see scraper/index.js) hasn't indexed this item's
      // own detail page yet - it writes one for every item it finds while
      // indexing a search, so this should be rare once it's run at least
      // once broadly.
      res.status(404).json({ error: 'Product not found' })
      return
    }
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
    res.status(200).json(cached)
  } catch (err) {
    console.error('product detail error', err)
    res.status(502).json({ error: 'Could not fetch the product details', detail: err.message })
  }
}
