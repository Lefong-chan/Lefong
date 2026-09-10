// Product data no longer comes from a live scrape inside the Vercel
// function (1688's anti-bot system flatly blocked requests from Vercel's
// shared serverless IPs - see scraper/README.md for the full story).
// Instead, a bot the site owner runs on their own machine (scraper/index.js)
// periodically searches 1688 and writes normalized results here, in
// Firebase Realtime Database (already used everywhere else in this app).
// api/search.js and api/trending.js only ever read from this cache now -
// there's no live fallback path left, so a keyword nobody has scraped yet
// (or one whose entry has aged out) genuinely comes back empty until the
// next scraper run covers it.

import { adminDb } from './firebaseAdmin.js'

// The scraper bot runs on demand rather than as an always-on server, so an
// entry can legitimately be a day or more old - this just needs to be long
// enough that a normal gap between runs doesn't make a keyword vanish.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

function keyFor(keyword) {
  // Case-insensitive: "Telephone" typed into the site's own search box
  // must hit the same cache entry the bookmarklet saved under "telephone"
  // while browsing 1688, regardless of which casing either side used.
  // RTDB keys can't contain . $ # [ ] / - hex-encode the (possibly
  // Chinese) keyword so any input is a safe key.
  return Buffer.from(keyword.toLowerCase(), 'utf8').toString('hex')
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
