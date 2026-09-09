// Launches the headless Chromium used to scrape m.1688.com. 1688's mobile
// site is a client-hydrated app (product data arrives via XHR after load,
// not in the raw HTML), so a plain fetch() can't see the product grid - a
// real browser has to run the page's JS first. Two runtimes are supported:
//
// - On Vercel (serverless, no system Chromium installed) @sparticuz/chromium
//   ships a Lambda-compatible Chromium binary sized for that environment.
// - Locally (`vercel dev`, or any machine with Playwright's own browsers
//   downloaded) the regular playwright-core Chromium download is used
//   instead, since @sparticuz/chromium's binary is Linux/Lambda-only.
//
// The browser is kept as a module-level singleton so a warm serverless
// instance reuses it across requests instead of paying the ~2-4s launch
// cost every time; launchBrowser() re-launches if the cached one died.

import { chromium } from 'playwright-core'

let browserPromise = null

// 1688 flatly refused a request with a "访问被拒绝" (access denied) anti-bot
// page even with a correct URL - most likely fingerprinting the browser as
// automated rather than (or in addition to) blocking the IP outright.
// Dropping --enable-automation and adding --disable-blink-features=
// AutomationControlled are what make navigator.webdriver read back false
// instead of true; combined with the addInitScript patches in withPage()
// below, this is the standard free/no-proxy mitigation for that kind of
// detection. It's not guaranteed to get past Alibaba's WAF specifically -
// if requests still come back "访问被拒绝" after this, the block is more
// likely IP-reputation-based (Vercel's serverless IPs are shared,
// datacenter-range addresses), which no in-browser change can fix - only
// routing through a different (e.g. residential) IP would.
const STEALTH_ARGS = ['--disable-blink-features=AutomationControlled']

async function launchBrowser() {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)

  if (isServerless) {
    // @sparticuz/chromium is only imported on serverless so a local dev
    // install doesn't need to download its (Linux-only) binary too. Needs
    // to be recent enough to detect Vercel's runtime itself (it checks
    // process.env.VERCEL internally) - older releases don't recognize it
    // as an Amazon-Linux-2023-compatible environment and load a Chromium
    // build that's missing shared libraries (dies with an "error while
    // loading shared libraries: libnss3.so" launch failure).
    const { default: sparticuzChromium } = await import('@sparticuz/chromium')
    sparticuzChromium.setGraphicsMode = false // no WebGL needed for scraping - fewer libs required
    return chromium.launch({
      args: [...STEALTH_ARGS, ...sparticuzChromium.args.filter((a) => a !== '--enable-automation')],
      executablePath: await sparticuzChromium.executablePath(),
      headless: true
    })
  }

  return chromium.launch({ headless: true, args: STEALTH_ARGS })
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = launchBrowser().catch((err) => {
      browserPromise = null
      throw err
    })
  }
  const browser = await browserPromise
  if (!browser.isConnected()) {
    browserPromise = null
    return getBrowser()
  }
  return browser
}

// A real Android Chrome UA rather than a spoofed iPhone Safari one - the
// browser is actually Chromium, and Chromium always sends its own
// sec-ch-ua/sec-ch-ua-mobile/sec-ch-ua-platform Client Hints headers
// regardless of what the UA string claims. Real Safari never sends those
// headers at all, so an iPhone UA paired with Chromium's Client Hints is
// an inconsistency anti-bot systems can check for directly; an Android
// Chrome UA matches what the browser actually is.
const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'

function isClosedBrowserError(err) {
  return /has been closed|Target closed|Browser closed/i.test(err?.message || '')
}

// Patches the handful of properties puppeteer-extra-plugin-stealth-style
// checks look at to tell a headless/automated Chromium apart from a real
// one. Runs before any of the page's own scripts (addInitScript), so code
// on the page sees these as if they were the browser's real values from
// the start - it can still be detected in other ways (Alibaba's WAF is one
// of the more sophisticated ones), but this is the standard free mitigation
// for the common checks.
function stealthInitScript() {
  Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => undefined })
  window.chrome = { runtime: {} }
  Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
  Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en-US', 'en'] })
  const originalQuery = window.navigator.permissions.query
  window.navigator.permissions.query = (parameters) =>
    parameters.name === 'notifications' ? Promise.resolve({ state: Notification.permission }) : originalQuery(parameters)
}

// One throwaway context+page per scrape call, closed by the caller when
// done - keeps separate requests from sharing cookies/state without paying
// the full browser launch cost each time. @sparticuz/chromium runs in
// --single-process mode (needed to fit serverless memory limits), so a
// renderer crash can take the whole browser down instead of just one page;
// callers of this module never run scrapes concurrently against each other
// for that reason (see api/trending.js), but a crash can still happen
// mid-request - retried once against a freshly launched browser rather
// than failing the request outright.
export async function withPage(fn, { retrying = false } = {}) {
  const browser = await getBrowser()
  let context
  try {
    context = await browser.newContext({
      userAgent: MOBILE_UA,
      viewport: { width: 412, height: 915 }, // matches the Pixel 7 in MOBILE_UA
      locale: 'zh-CN'
    })
    await context.addInitScript(stealthInitScript)
    const page = await context.newPage()
    return await fn(page)
  } catch (err) {
    if (!retrying && isClosedBrowserError(err)) {
      browserPromise = null
      return withPage(fn, { retrying: true })
    }
    throw err
  } finally {
    if (context) await context.close().catch(() => {})
  }
}
