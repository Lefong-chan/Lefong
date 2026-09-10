// The 1688 scraper bot - see README.md for where to run this and why.
//
// Usage:
//   npm install && npx playwright install chromium   (one-time setup)
//   node index.js            one batch of keywords, then exits
//   node index.js --loop     runs forever, sleeping INTERVAL_HOURS between batches
//
// 1688 tolerates only a handful of requests from one IP/session before
// throwing up a CAPTCHA wall ("验证码拦截") - a real run showed the very
// first search and first detail page succeed, then everything after
// blocked. So each invocation only works a small BATCH_SIZE of keywords
// (prioritizing ones never indexed before) and stops at the first sign of
// a block instead of burning through the rest of the list uselessly.
// Coverage of the full keyword list builds up gradually across many
// separate runs instead of one long one - each GitHub Actions run gets a
// fresh VM (and likely a fresh IP), so running this frequently in small
// batches works around the per-session limit better than a single big
// sweep would.

import 'dotenv/config'
import { CATEGORIES, DEFAULT_KEYWORDS } from '../api/_lib/scrapeTargets.js'
import { normalizeSearchResponse, normalizeDetailResponse, mergeProductSummary } from '../api/_lib/normalize.js'
import { getCachedSearch, setCachedSearch } from '../api/_lib/searchCache.js'
import { getCachedProduct, setCachedProduct } from '../api/_lib/productCache.js'
import { scrapeSearch, scrapeDetail } from './lib/scrape1688.js'
import { closeBrowser } from './browser.js'

const INTERVAL_HOURS = Number(process.env.SCRAPER_INTERVAL_HOURS || 6)
const BATCH_SIZE = Number(process.env.SCRAPER_BATCH_SIZE || 3)
const DETAILS_PER_KEYWORD = Number(process.env.SCRAPER_DETAILS_PER_KEYWORD || 2)
const KEYWORDS = [...DEFAULT_KEYWORDS, ...CATEGORIES.map((c) => c.id)]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Long, randomized gaps between requests - both out of courtesy and
// because a burst of identical, evenly-spaced requests is itself a bot
// signal. Doesn't fully avoid the block seen in practice, but every bit
// of extra caution helps stretch how much a session can do before it
// trips 1688's threshold.
function randomDelay(minMs, maxMs) {
  return sleep(minMs + Math.random() * (maxMs - minMs))
}

class Blocked extends Error {}

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

async function pickBatch() {
  // Mostly prioritizes keywords with no cache entry at all (never
  // successfully indexed) so a run makes forward progress instead of
  // re-rolling ones already covered - but always reserves one slot (when
  // there's more than one keyword to pick and something already indexed
  // to refresh) for revisiting an already-known keyword. Otherwise an
  // already-covered keyword would never get re-scraped again once every
  // *other* keyword has at least something cached, which would mean an
  // extraction fix (or a stale price) never reaches it either.
  const statuses = await Promise.all(KEYWORDS.map(async (kw) => ({ kw, cached: await getCachedSearch(kw) })))
  const neverIndexed = statuses.filter((s) => !s.cached).map((s) => s.kw)
  const alreadyIndexed = statuses.filter((s) => s.cached).map((s) => s.kw)

  if (!alreadyIndexed.length) return shuffled(neverIndexed).slice(0, BATCH_SIZE)
  if (!neverIndexed.length) return shuffled(alreadyIndexed).slice(0, BATCH_SIZE)

  const fresh = shuffled(neverIndexed).slice(0, Math.max(0, BATCH_SIZE - 1))
  const refresh = shuffled(alreadyIndexed).slice(0, BATCH_SIZE - fresh.length)
  return shuffled([...fresh, ...refresh])
}

async function indexKeyword(keyword) {
  process.stdout.write(`search "${keyword}"... `)
  let raw
  try {
    raw = await scrapeSearch(keyword)
  } catch (err) {
    console.log(`FAILED (${err.message})`)
    if (err.blocked) throw new Blocked(err.message)
    return []
  }
  const normalized = normalizeSearchResponse({ items: raw }, keyword, 1)
  if (!normalized.items.length) {
    console.log('0 items')
    return []
  }
  await setCachedSearch(keyword, normalized)
  console.log(`${normalized.items.length} items`)

  // Every item's product-detail entry gets refreshed from this search-
  // result summary (price, title, sold count, ...) - a brand-new item
  // gets an immediate placeholder so it's viewable before its own detail
  // page is ever scraped, and an already-known one picks up whatever
  // changed since the last time this keyword was indexed. Merged rather
  // than replaced outright - see mergeProductSummary for why (keeps
  // richer photos/description a dedicated detail-page capture may have
  // already added).
  for (const item of normalized.items) {
    const existing = await getCachedProduct(item.itemId)
    await setCachedProduct(item.itemId, mergeProductSummary(existing, item))
  }

  return normalized.items
}

async function indexProductDetail(itemId) {
  process.stdout.write(`  detail ${itemId}... `)
  try {
    const raw = await scrapeDetail(itemId)
    const normalized = normalizeDetailResponse(raw)
    if (!normalized) {
      console.log('skipped (no title)')
      return
    }
    await setCachedProduct(itemId, normalized)
    console.log('ok')
  } catch (err) {
    console.log(`FAILED (${err.message})`)
    if (err.blocked) throw new Blocked(err.message)
  }
}

// Only items still on just their search-result placeholder (no
// description yet) are worth spending a detail request on - re-fetching
// an already-enriched item wastes a request for no benefit.
async function pickDetailTargets(items) {
  const candidates = []
  for (const item of items) {
    const cached = await getCachedProduct(item.itemId)
    if (!cached?.description) candidates.push(item.itemId)
    if (candidates.length >= DETAILS_PER_KEYWORD) break
  }
  return candidates
}

async function runOnce() {
  const startedAt = Date.now()
  const batch = await pickBatch()
  console.log(`Batch: ${batch.join(', ')}`)
  let indexed = 0

  try {
    for (const keyword of batch) {
      const items = await indexKeyword(keyword)
      indexed += items.length
      await randomDelay(15000, 30000)

      for (const itemId of await pickDetailTargets(items)) {
        await indexProductDetail(itemId)
        await randomDelay(10000, 20000)
      }
    }
  } catch (err) {
    if (err instanceof Blocked) {
      console.log(`\n1688 blocked this session - stopping the batch early (${err.message}).`)
    } else {
      throw err
    }
  }

  const minutes = ((Date.now() - startedAt) / 60000).toFixed(1)
  console.log(`\nDone - touched ${indexed} items across ${batch.length} keyword(s) in ${minutes} min.`)
}

async function main() {
  const loop = process.argv.includes('--loop')

  try {
    do {
      await runOnce()
      if (loop) {
        console.log(`Sleeping ${INTERVAL_HOURS}h before the next batch...\n`)
        await sleep(INTERVAL_HOURS * 60 * 60 * 1000)
      }
    } while (loop)
  } finally {
    await closeBrowser()
  }
}

main().catch((err) => {
  console.error('Scraper crashed:', err)
  process.exitCode = 1
})
