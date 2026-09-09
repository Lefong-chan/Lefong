import { getCategories } from './_lib/cjdropshipping.js'
import { normalizeCategories } from './_lib/normalize.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const raw = await getCategories()

    // Same temporary diagnostic escape hatch as api/search.js - see there.
    if (req.query.raw === '1') {
      res.setHeader('Cache-Control', 'no-store')
      res.status(200).json(raw)
      return
    }

    const categories = normalizeCategories(raw)
    // Categories change rarely, unlike product listings - safe to cache longer.
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    res.status(200).json({ categories })
  } catch (err) {
    console.error('categories error', err)
    res.status(502).json({ error: 'Could not fetch categories', detail: err.message })
  }
}
