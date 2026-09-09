import { CATEGORIES } from './_lib/scrapeTargets.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
  res.status(200).json({ categories: CATEGORIES.map((c) => ({ id: c.id, name: c.name })) })
}
