// Scrapes m.1688.com directly instead of calling a paid product API. The
// card markup below (goods-container / goods-title / current-money / ...)
// comes from a real inspector capture the site owner took of m.1688.com's
// *homepage* recommendation feed - confirmed to work, see the extraction
// selectors' broad fallbacks below. The actual keyword search results page
// (m.1688.com/offer/search.htm) could not be captured or tested live from
// this sandbox (outbound access to 1688.com is blocked here), so its exact
// markup is not confirmed. Selectors are therefore intentionally generic
// (attribute-contains matches, several candidates per field) so small
// template differences between the two pages don't break extraction
// outright, and every exported function accepts a `debug` option (see
// api/search.js's ?debug=1) that reports what was actually found on the
// page instead of just failing silently - use that to correct any selector
// here once this runs against the real search results page.
//
// One important, *confirmed* finding from that same capture: the homepage
// feed's card links go through dj.1688.com/ci_bb?a=...&e=... - an ad click
// tracker, not the product itself, and the `a=` id is NOT a reliable
// product id (several unrelated cards on the same page shared one `a=`
// value). Cards are only kept if a real numeric offer id can be recovered
// from a direct detail.1688.com/m.1688.com "/offer/<id>" URL; anything
// only reachable through an opaque redirect is dropped rather than kept
// with a made-up id.

import { withPage } from './browser1688.js'

const BLOCK_TEXT_PATTERNS = [/验证码/, /人机验证/, /访问(过于|太过)频繁/, /captcha/i, /security check/i]

function isBlockedPage(title, bodyText) {
  const sample = `${title} ${bodyText}`.slice(0, 2000)
  return BLOCK_TEXT_PATTERNS.some((re) => re.test(sample))
}

function withTimeout(promise, ms, label) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(`${label} timed out`), { timedOut: true })), ms)
  })
  // If the timeout wins the race, `promise` (the in-flight page navigation)
  // is still running in the background and will eventually settle on its
  // own - swallow that so it doesn't surface as an unhandled rejection.
  promise.catch(() => {})
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

// Runs in the browser page - keep this self-contained (no closures over
// outer scope) since Playwright serializes it to run inside the page.
function extractCards() {
  function firstNumber(text) {
    if (!text) return null
    const m = String(text).replace(/,/g, '').match(/[\d.]+/)
    return m ? parseFloat(m[0]) : null
  }

  function offerIdFromHref(href) {
    if (!href) return null
    const m = href.match(/\/offer\/(\d+)\.html/)
    return m ? m[1] : null
  }

  function text(el) {
    return el ? el.textContent.trim() : ''
  }

  const anchors = Array.from(document.querySelectorAll('a[href*="/offer/"]'))
  const seen = new Set()
  const cards = []

  for (const a of anchors) {
    const itemId = offerIdFromHref(a.getAttribute('href') || a.href || '')
    if (!itemId || seen.has(itemId)) continue

    // The offer link can be on the whole card or just its image/title -
    // walk up a little to a container likely to hold price/title/image
    // together, without assuming an exact class name.
    const card = a.closest('[class*="goods"], [class*="offer"], [class*="item"], [class*="card"]') || a

    const titleEl = card.querySelector('[class*="title"]') || a
    const imgEl = card.querySelector('img')
    const priceEl = card.querySelector('[class*="price"] [class*="money"], [class*="current-money"], [class*="price"]')
    const soldEl = card.querySelector('[class*="sold"], [class*="sale"]')
    const shopEl = card.querySelector('[class*="shop"], [class*="company"], [class*="seller"]')

    const title = text(titleEl) || a.getAttribute('title') || imgEl?.getAttribute('alt') || ''
    const price = firstNumber(priceEl?.textContent)
    if (!title || price === null) continue

    seen.add(itemId)
    cards.push({
      itemId,
      title,
      image: imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '',
      price,
      sales: firstNumber(soldEl?.textContent),
      shopName: text(shopEl),
      link: `https://detail.1688.com/offer/${itemId}.html`
    })
  }

  return cards
}

function extractDetail() {
  function firstNumber(text) {
    if (!text) return null
    const m = String(text).replace(/,/g, '').match(/[\d.]+/)
    return m ? parseFloat(m[0]) : null
  }

  const ogTitle = document.querySelector('meta[property="og:title"]')?.content
  const ogImage = document.querySelector('meta[property="og:image"]')?.content
  const titleEl = document.querySelector('[class*="title"]')
  const priceEl = document.querySelector('[class*="price"] [class*="money"], [class*="current-money"], [class*="price"]')
  const shopEl = document.querySelector('[class*="shop"], [class*="company"], [class*="seller"]')
  const descEl = document.querySelector('[class*="description"], [class*="detail-content"], [class*="rich-text"]')

  const images = Array.from(document.querySelectorAll('[class*="thumb"] img, [class*="gallery"] img, [class*="main-img"] img'))
    .map((img) => img.getAttribute('src') || img.getAttribute('data-src'))
    .filter(Boolean)

  return {
    title: (titleEl?.textContent || ogTitle || '').trim(),
    image: ogImage || images[0] || '',
    images,
    price: firstNumber(priceEl?.textContent),
    shopName: (shopEl?.textContent || '').trim(),
    description: descEl?.innerHTML || ''
  }
}

// 1688's mobile site often tries to bounce visitors to an "open in app"
// interstitial via a client-side redirect right after the page loads -
// waiting for "domcontentloaded" can catch that redirect mid-flight and
// surface it as a net::ERR_ABORTED failure on the original navigation.
// "commit" resolves as soon as the response starts arriving, before any
// of that redirect JS has had a chance to run, and the waitForSelector
// call right after gives the (possibly-redirected) page time to settle.
async function navigateAndCheck(page, url, timeoutMs) {
  await page.goto(url, { waitUntil: 'commit', timeout: timeoutMs })
  // Best-effort settle for the client-side XHR that fills in the product
  // grid - not a hard requirement, some content may already be there.
  await page.waitForSelector('a[href*="/offer/"]', { timeout: Math.min(timeoutMs, 8000) }).catch(() => {})

  const title = await page.title()
  const bodyText = await page.evaluate(() => document.body?.innerText || '').catch(() => '')
  if (isBlockedPage(title, bodyText)) {
    const err = new Error('1688 is showing an anti-bot check right now')
    err.blocked = true
    throw err
  }
  return { title, bodyText }
}

function isNavigationError(err) {
  return err?.timedOut || /net::ERR_|ERR_ABORTED/.test(err?.message || '')
}

// A single navigation failure (net::ERR_ABORTED from 1688's own app-download
// interstitial redirect, a timeout on a slow route, etc.) is retried once
// with a fresh page/context rather than failing outright - `retry: false`
// is used by trending.js, which already tries several keywords/pages in a
// row and can't afford doubling its per-attempt time budget on top of that.
async function withNavigationRetry(run, retry) {
  try {
    return await run()
  } catch (err) {
    if (retry && isNavigationError(err)) return run()
    throw err
  }
}

async function scrapeSearch(keyword, page, { timeoutMs = 12000, debug = false, retry = true } = {}) {
  const run = () =>
    withTimeout(
      withPage(async (browserPage) => {
        const url = `https://m.1688.com/offer/search.htm?keywords=${encodeURIComponent(keyword)}&beginPage=${page}`
        const { title, bodyText } = await navigateAndCheck(browserPage, url, timeoutMs)
        const items = await browserPage.evaluate(extractCards)

        if (debug) {
          return { url, pageTitle: title, bodySample: bodyText.slice(0, 1000), matchedCards: items.length, items }
        }
        return { items }
      }),
      timeoutMs + 4000,
      '1688 search'
    )
  return withNavigationRetry(run, retry)
}

export function searchItems(keyword, page = 1, opts) {
  return scrapeSearch(keyword, page, opts)
}

// categoryId in this app is just an opaque browsing bucket the site itself
// defines (see api/categories.js) rather than a real 1688 category id, so
// browsing "by category" is really just searching its underlying keyword.
export function listByCategory(categoryId, page = 1, opts) {
  return scrapeSearch(categoryId, page, opts)
}

export function getItemDetail(itemId, { timeoutMs = 12000, debug = false, retry = true } = {}) {
  const run = () =>
    withTimeout(
      withPage(async (browserPage) => {
        const url = `https://m.1688.com/offer/${encodeURIComponent(itemId)}.html`
        const { title, bodyText } = await navigateAndCheck(browserPage, url, timeoutMs)
        const detail = await browserPage.evaluate(extractDetail)

        if (debug) {
          return { url, pageTitle: title, bodySample: bodyText.slice(0, 1000), detail }
        }
        return { itemId, ...detail }
      }),
      timeoutMs + 4000,
      '1688 product detail'
    )
  return withNavigationRetry(run, retry)
}

// 1688 has no simple public "category tree" page reachable from the mobile
// site - scraping one would mean navigating and parsing yet another
// unconfirmed page. Since the app only ever uses a category as a fixed
// search keyword behind a chip (see src/views/Home.vue), a small curated
// list serves the same purpose without that extra scrape.
const CATEGORIES = [
  { id: '手机配件', name: 'Phone Accessories' },
  { id: '数码配件', name: 'Digital Accessories' },
  { id: '钥匙扣', name: 'Keychain' },
  { id: '数据线', name: 'USB Cable' },
  { id: '蓝牙耳机', name: 'Bluetooth Earphone' },
  { id: '充电宝', name: 'Power Bank' },
  { id: '手表', name: 'Watch' },
  { id: '太阳镜', name: 'Sunglasses' },
  { id: '背包', name: 'Backpack' },
  { id: '玩具', name: 'Toy' }
]

export function getCategories() {
  return Promise.resolve(CATEGORIES)
}
