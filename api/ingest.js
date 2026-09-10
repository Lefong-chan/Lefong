// Receives product data captured by bookmarklet/extract.js while the site
// owner browses m.1688.com normally in their own phone/browser - see
// bookmarklet/README.md. This is the one path that isn't a bot: it's the
// owner's own real browsing session, so there's nothing for 1688's
// anti-bot system to block.

import { normalizeSearchResponse, normalizeDetailResponse } from './_lib/normalize.js'
import { setCachedSearch } from './_lib/searchCache.js'
import { getCachedProduct, setCachedProduct } from './_lib/productCache.js'

function setCorsHeaders(res) {
  // The bookmarklet runs on m.1688.com's origin, calling this endpoint
  // cross-origin - it's a bookmarklet the owner runs themselves, not a
  // public form, so a wide-open origin is fine; INGEST_SECRET below is
  // what actually protects the endpoint from randoms.
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Ingest-Secret')
}

export default async function handler(req, res) {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const expectedSecret = process.env.INGEST_SECRET
  if (expectedSecret && req.headers['x-ingest-secret'] !== expectedSecret) {
    res.status(401).json({ error: 'Invalid or missing secret' })
    return
  }

  const body = req.body || {}

  try {
    if (body.type === 'search') {
      const keyword = (body.keyword || '').toString().trim()
      if (!keyword || !Array.isArray(body.items)) {
        res.status(400).json({ error: 'keyword and items[] are required' })
        return
      }
      const normalized = normalizeSearchResponse({ items: body.items }, keyword, 1)
      await setCachedSearch(keyword, normalized)

      // Same as the scraper bot: a brand-new item gets an immediate
      // placeholder detail entry from its search-card summary, never
      // overwriting one that already has real detail data.
      for (const item of normalized.items) {
        if (!(await getCachedProduct(item.itemId))) {
          await setCachedProduct(item.itemId, normalizeDetailResponse(item))
        }
      }

      res.status(200).json({ ok: true, saved: normalized.items.length })
      return
    }

    if (body.type === 'product') {
      const normalized = normalizeDetailResponse(body.detail)
      if (!normalized) {
        res.status(400).json({ error: 'invalid detail payload' })
        return
      }
      await setCachedProduct(normalized.itemId, normalized)
      res.status(200).json({ ok: true })
      return
    }

    res.status(400).json({ error: 'type must be "search" or "product"' })
  } catch (err) {
    console.error('ingest error', err)
    res.status(502).json({ error: 'Could not save', detail: err.message })
  }
}
