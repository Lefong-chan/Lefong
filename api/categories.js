import { getCategories } from './_lib/scraper1688.js'
import { normalizeCategories } from './_lib/normalize.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const raw = await getCategories()
    const categories = normalizeCategories(raw)
    // A fixed curated list (see _lib/scraper1688.js) - safe to cache long.
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    res.status(200).json({ categories })
  } catch (err) {
    console.error('categories error', err)
    res.status(502).json({ error: 'Could not fetch categories', detail: err.message })
  }
}
