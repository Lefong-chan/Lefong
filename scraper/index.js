// The 1688 scraper bot - run this on your own machine (a home PC, a phone
// via Termux, a Raspberry Pi, ...), not on Vercel. See README.md for why.
//
// Usage:
//   npm install && npx playwright install chromium   (one-time setup)
//   node index.js            run one full pass over every keyword, then exit
//   node index.js --loop     run forever, sleeping INTERVAL_HOURS between passes

import 'dotenv/config'
import { CATEGORIES, DEFAULT_KEYWORDS } from '../api/_lib/scrapeTargets.js'
import { normalizeSearchResponse, normalizeDetailResponse } from '../api/_lib/normalize.js'
import { setCachedSearch } from '../api/_lib/searchCache.js'
import { setCachedProduct } from '../api/_lib/productCache.js'
import { scrapeSearch, scrapeDetail } from './lib/scrape1688.js'
import { closeBrowser } from './browser.js'

const INTERVAL_HOURS = Number(process.env.SCRAPER_INTERVAL_HOURS || 6)
const KEYWORDS = [...DEFAULT_KEYWORDS, ...CATEGORIES.map((c) => c.id)]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Random delay between requests so the bot doesn't hammer 1688 at a
// suspiciously constant rate - both out of courtesy and because a burst
// of identical, evenly-spaced requests is itself a bot signal.
function randomDelay(minMs, maxMs) {
  return sleep(minMs + Math.random() * (maxMs - minMs))
}

async function indexKeyword(keyword) {
  process.stdout.write(`search "${keyword}"... `)
  let raw
  try {
    raw = await scrapeSearch(keyword)
  } catch (err) {
    console.log(`FAILED (${err.message})`)
    return []
  }
  const normalized = normalizeSearchResponse({ items: raw }, keyword, 1)
  if (!normalized.items.length) {
    console.log('0 items')
    return []
  }
  await setCachedSearch(keyword, normalized)
  console.log(`${normalized.items.length} items`)
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
  }
}

async function runOnce() {
  const startedAt = Date.now()
  const seenItemIds = new Set()

  for (const keyword of KEYWORDS) {
    const items = await indexKeyword(keyword)
    await randomDelay(3000, 8000)

    for (const item of items) {
      if (seenItemIds.has(item.itemId)) continue
      seenItemIds.add(item.itemId)
      await indexProductDetail(item.itemId)
      await randomDelay(2000, 5000)
    }
  }

  const minutes = ((Date.now() - startedAt) / 60000).toFixed(1)
  console.log(`\nDone - indexed ${seenItemIds.size} products across ${KEYWORDS.length} keywords in ${minutes} min.`)
}

async function main() {
  const loop = process.argv.includes('--loop')

  try {
    do {
      await runOnce()
      if (loop) {
        console.log(`Sleeping ${INTERVAL_HOURS}h before the next pass...\n`)
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
