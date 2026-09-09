// The RapidAPI upstream is on a rate-limited plan and occasionally slow, so
// a live failure (429, timeout) shouldn't mean an empty page for the buyer.
// This stores the last successful normalized search result per keyword in
// Firebase Realtime Database (already used everywhere else in this app) so
// search.js and trending.js can fall back to it instead of showing nothing.
// Best-effort throughout: a cache read/write failure must never break the
// actual request.

import { adminDb } from './firebaseAdmin.js'

const MAX_AGE_MS = 48 * 60 * 60 * 1000 // don't serve a fallback older than this

function keyFor(keyword) {
  // RTDB keys can't contain . $ # [ ] / - hex-encode the raw (possibly
  // Chinese) keyword so any input is a safe key.
  return Buffer.from(keyword, 'utf8').toString('hex')
}

export async function getCachedSearch(keyword) {
  try {
    const snap = await adminDb.ref(`apiCache/search/${keyFor(keyword)}`).get()
    if (!snap.exists()) return null
    const val = snap.val()
    if (!val || !Array.isArray(val.items) || !val.items.length) return null
    if (Date.now() - (val.savedAt || 0) > MAX_AGE_MS) return null
    return val
  } catch {
    return null
  }
}

export async function setCachedSearch(keyword, data) {
  try {
    await adminDb.ref(`apiCache/search/${keyFor(keyword)}`).set({ ...data, savedAt: Date.now() })
  } catch {
    // Cache writes are a nice-to-have - never let a write failure surface.
  }
}
