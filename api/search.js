import { getCachedSearch } from './_lib/searchCache.js'

// One bookmarklet/scraper capture stores everything it found for a
// keyword as a single batch (see _lib/searchCache.js) - there's no
// separately-stored "page 2" from the source. SearchResults.vue's
// infinite scroll asks for page, page+1, page+2... expecting each call
// to return a *different* slice and an eventual empty one to know when
// to stop; returning the same full batch for every page (as this used
// to) made every scroll re-append the entire list as "new" items.
// Slicing the one cached batch here is what actually gives each page
// its own products and a real end.
const PAGE_SIZE = 24

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const keyword = (req.query.keyword || '').toString().trim()
  const page = Number(req.query.page) || 1

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
      res.status(200).json({ keyword, page, total: 0, items: [] })
      return
    }
    const start = (page - 1) * PAGE_SIZE
    const items = cached.items.slice(start, start + PAGE_SIZE)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
    res.status(200).json({ ...cached, page, items })
  } catch (err) {
    console.error('search error', err)
    res.status(502).json({ error: 'Could not fetch the product list', detail: err.message })
  }
}
