// Navigates m.1688.com and pulls product data off the page. Selectors are
// based on a real inspector capture of m.1688.com's card markup
// (goods-container / goods-title / current-money / ...), with generic
// fallbacks (attribute-contains matches) so small template differences
// don't break extraction outright.
//
// One important, confirmed finding: some of 1688's own card links (its
// homepage recommendation feed in particular) go through dj.1688.com/
// ci_bb?a=...&e=... - an ad click tracker, not the product itself, and
// the `a=` id there is NOT a reliable product id (several unrelated
// cards on the same page shared one `a=` value). Cards are only kept if
// a real numeric offer id can be recovered from a direct
// detail.1688.com/m.1688.com "/offer/<id>" URL; anything only reachable
// through an opaque redirect is dropped rather than kept with a made-up id.
//
// The search URL (m.1688.com/offer_search/-6D7033.html?keywords=...) was
// confirmed against a real search the site owner ran on their own phone -
// an earlier guess (.../offer/search.htm?keywords=...) turned out wrong
// (1688 read it as a single-product "offer" page, not a search).

import { withPage } from '../browser.js'

const BLOCK_TEXT_PATTERNS = [/验证码/, /人机验证/, /访问被拒绝/, /访问(过于|太过)频繁/, /captcha/i, /security check/i, /access denied/i]

export function isBlockedPage(title, bodyText) {
  const sample = `${title} ${bodyText}`.slice(0, 2000)
  return BLOCK_TEXT_PATTERNS.some((re) => re.test(sample))
}

// See the module comment above - kept constant rather than derived per
// keyword since it looks like a fixed route id for the search mini-page.
const SEARCH_PATH = '/offer_search/-6D7033.html'

// Runs inside the browser page - keep self-contained (no closures over
// outer scope), Playwright serializes it to execute in the page.
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

  // Mobile 1688 lazy-loads card images: `src` often holds a blank
  // placeholder (or a data: URI) until the image scrolls into view, which
  // never happens in a headless browser that doesn't scroll - the real
  // URL is already present in one of these data-* attributes from the
  // start, so those are checked first.
  function realImageSrc(imgEl) {
    if (!imgEl) return ''
    for (const attr of ['data-src', 'data-original', 'data-lazy-src', 'data-ks-lazyload', 'data-echo']) {
      const val = imgEl.getAttribute(attr)
      if (val && !val.startsWith('data:')) return val
    }
    const src = imgEl.getAttribute('src') || ''
    return src.startsWith('data:') ? '' : src
  }

  const anchors = Array.from(document.querySelectorAll('a[href*="/offer/"]'))
  const seen = new Set()
  const cards = []

  for (const a of anchors) {
    const itemId = offerIdFromHref(a.getAttribute('href') || a.href || '')
    if (!itemId || seen.has(itemId)) continue

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
      image: realImageSrc(imgEl),
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

  // Same lazy-load reasoning as extractCards() above - duplicated rather
  // than shared since both functions run standalone inside the page.
  function realImageSrc(imgEl) {
    if (!imgEl) return ''
    for (const attr of ['data-src', 'data-original', 'data-lazy-src', 'data-ks-lazyload', 'data-echo']) {
      const val = imgEl.getAttribute(attr)
      if (val && !val.startsWith('data:')) return val
    }
    const src = imgEl.getAttribute('src') || ''
    return src.startsWith('data:') ? '' : src
  }

  const ogTitle = document.querySelector('meta[property="og:title"]')?.content
  const ogImage = document.querySelector('meta[property="og:image"]')?.content
  const titleEl = document.querySelector('[class*="title"]')
  const priceEl = document.querySelector('[class*="price"] [class*="money"], [class*="current-money"], [class*="price"]')
  const shopEl = document.querySelector('[class*="shop"], [class*="company"], [class*="seller"]')
  const descEl = document.querySelector('[class*="description"], [class*="detail-content"], [class*="rich-text"]')

  const images = Array.from(document.querySelectorAll('[class*="thumb"] img, [class*="gallery"] img, [class*="main-img"] img'))
    .map(realImageSrc)
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

// 1688's mobile site sometimes tries to bounce visitors to an "open in
// app" interstitial via a client-side redirect right as the page loads -
// waiting for "commit" (resolves as soon as the response starts arriving)
// rather than "domcontentloaded" avoids catching that redirect mid-flight.
async function navigateAndCheck(page, url, timeoutMs) {
  await page.goto(url, { waitUntil: 'commit', timeout: timeoutMs })
  await page.waitForSelector('a[href*="/offer/"]', { timeout: Math.min(timeoutMs, 8000) }).catch(() => {})

  const title = await page.title()
  const bodyText = await page.evaluate(() => document.body?.innerText || '').catch(() => '')
  if (isBlockedPage(title, bodyText)) {
    const err = new Error(`1688 blocked this request (page title: "${title}")`)
    err.blocked = true
    throw err
  }
  return { title, bodyText }
}

export async function scrapeSearch(keyword, page = 1, { timeoutMs = 20000 } = {}) {
  return withPage(async (browserPage) => {
    const pageParam = Number(page) > 1 ? `&page=${page}` : ''
    const url = `https://m.1688.com${SEARCH_PATH}?keywords=${encodeURIComponent(keyword)}${pageParam}`
    await navigateAndCheck(browserPage, url, timeoutMs)
    return browserPage.evaluate(extractCards)
  })
}

export async function scrapeDetail(itemId, { timeoutMs = 20000 } = {}) {
  return withPage(async (browserPage) => {
    const url = `https://m.1688.com/offer/${encodeURIComponent(itemId)}.html`
    await navigateAndCheck(browserPage, url, timeoutMs)
    const detail = await browserPage.evaluate(extractDetail)
    return { itemId, ...detail }
  })
}
