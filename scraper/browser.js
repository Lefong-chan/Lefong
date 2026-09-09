// Launches a local headless Chromium for the scraper bot. This runs on
// whatever machine the site owner keeps it on (a home PC, a phone via
// Termux, a Raspberry Pi, ...) rather than on Vercel - see README.md for
// why: 1688's anti-bot system outright refused every request coming from
// Vercel's shared serverless IPs ("访问被拒绝"), which no in-browser fix
// could get around. A residential/home internet connection's IP is far
// less likely to already be on that kind of blocklist.
//
// Uses the full `playwright` package (not `playwright-core`) so
// `npx playwright install chromium` downloads a real browser to run
// locally - there's no Lambda-style binary to fetch like the old Vercel
// setup needed.

import { chromium } from 'playwright'

// Same free/no-cost anti-automation mitigations the Vercel version tried
// before this pivot - kept here since they can't hurt, even though the
// real blocker turned out to be IP-based rather than fingerprint-based.
const STEALTH_ARGS = ['--disable-blink-features=AutomationControlled']

// A real Android Chrome UA rather than a spoofed iPhone Safari one - the
// browser is actually Chromium, and Chromium always sends its own
// sec-ch-ua Client Hints headers regardless of what the UA string claims;
// real Safari never sends those, so an iPhone UA is a detectable mismatch.
export const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'

function stealthInitScript() {
  Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => undefined })
  window.chrome = { runtime: {} }
  Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
  Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en-US', 'en'] })
  const originalQuery = window.navigator.permissions.query
  window.navigator.permissions.query = (parameters) =>
    parameters.name === 'notifications' ? Promise.resolve({ state: Notification.permission }) : originalQuery(parameters)
}

let browserPromise = null

function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true, args: STEALTH_ARGS })
  }
  return browserPromise
}

export async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise
    await browser.close().catch(() => {})
    browserPromise = null
  }
}

// One throwaway context+page per call - keeps consecutive scrapes from
// sharing cookies/state, without relaunching the browser each time.
export async function withPage(fn) {
  const browser = await getBrowser()
  const context = await browser.newContext({
    userAgent: MOBILE_UA,
    viewport: { width: 412, height: 915 }, // matches the Pixel 7 in MOBILE_UA
    locale: 'zh-CN'
  })
  try {
    await context.addInitScript(stealthInitScript)
    const page = await context.newPage()
    return await fn(page)
  } finally {
    await context.close().catch(() => {})
  }
}
