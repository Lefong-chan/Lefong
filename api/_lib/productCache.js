// Per-item detail written by the scraper bot (scraper/index.js) whenever
// it visits a product's page while indexing a search - see
// _lib/searchCache.js for why this exists instead of a live scrape.

import { adminDb } from './firebaseAdmin.js'

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export async function getCachedProduct(itemId) {
  try {
    const snap = await adminDb.ref(`apiCache/products/${itemId}`).get()
    if (!snap.exists()) return null
    const val = snap.val()
    if (!val) return null
    if (Date.now() - (val.savedAt || 0) > MAX_AGE_MS) return null
    return val
  } catch {
    return null
  }
}

export async function setCachedProduct(itemId, data) {
  try {
    await adminDb.ref(`apiCache/products/${itemId}`).set({ ...data, savedAt: Date.now() })
  } catch {
    // Cache writes are a nice-to-have - never let a write failure surface.
  }
}
