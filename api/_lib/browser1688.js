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
      args: sparticuzChromium.args,
      executablePath: await sparticuzChromium.executablePath(),
      headless: true
    })
  }

  return chromium.launch({ headless: true })
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

const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'

function isClosedBrowserError(err) {
  return /has been closed|Target closed|Browser closed/i.test(err?.message || '')
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
      viewport: { width: 390, height: 844 },
      locale: 'zh-CN'
    })
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
