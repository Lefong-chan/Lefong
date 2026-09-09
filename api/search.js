import { getCachedSearch } from './_lib/searchCache.js'

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
    const cached = await getCachedSearch(keyword)
    if (!cached) {
      // Nobody has scraped this exact keyword yet (see _lib/searchCache.js) -
      // an empty result, not an error, so the buyer just sees "no products".
      res.setHeader('Cache-Control', 'no-store')
      res.status(200).json({ keyword, page: Number(page) || 1, total: 0, items: [] })
      return
    }
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
    res.status(200).json(cached)
  } catch (err) {
    console.error('search error', err)
    res.status(502).json({ error: 'Could not fetch the product list', detail: err.message })
  }
}
