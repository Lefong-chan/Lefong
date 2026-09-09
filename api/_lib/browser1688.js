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
    // install doesn't need to download its (Linux-only) binary too.
    const { default: sparticuzChromium } = await import('@sparticuz/chromium')
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

// One throwaway context+page per scrape call, closed by the caller - keeps
// concurrent requests (trending.js fires several in parallel) from sharing
// cookies/state, without paying the full browser launch cost each time.
export async function withPage(fn) {
  const browser = await getBrowser()
  const context = await browser.newContext({
    userAgent: MOBILE_UA,
    viewport: { width: 390, height: 844 },
    locale: 'zh-CN'
  })
  try {
    const page = await context.newPage()
    return await fn(page)
  } finally {
    await context.close().catch(() => {})
  }
}
