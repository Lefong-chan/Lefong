// CJ Dropshipping (developers.cjdropshipping.com) requires a login step to
// get an access token - it isn't a static key used directly like the
// previous RapidAPI provider. The login endpoint (getAccessToken) is
// throttled to a low queries-per-second rate, and the token it returns is
// valid for a long time (documented as ~15 days, refreshToken ~180 days),
// so the token is cached in Firebase Realtime Database and shared across
// every serverless invocation instead of re-logging in on every cold
// start. Two more things keep the throttle from ever surfacing to a
// buyer: a short retry-with-backoff on a 429/"Too Many Requests" response,
// and an in-memory single-flight guard so several concurrent requests on
// the same warm instance (e.g. a burst right after the cache goes cold)
// share one login call instead of firing one each.

import { adminDb } from './firebaseAdmin.js'

const BASE = process.env.CJ_API_BASE_URL || 'https://developers.cjdropshipping.com/api2.0/v1'
const TOKEN_PATH = 'apiCache/cjAuth'
const EXPIRY_SAFETY_MARGIN_MS = 24 * 60 * 60 * 1000 // renew a day before actual expiry

function getCredentials() {
  const apiKey = process.env.CJ_API_KEY
  const email = process.env.CJ_API_EMAIL || process.env.ADMIN_EMAIL || 'fongchaneric1@gmail.com'
  if (!apiKey) {
    throw new Error('CJ_API_KEY is not configured on the server')
  }
  return { apiKey, email }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isTooManyRequests(res, json) {
  return res.status === 429 || /too many requests|qps limit/i.test(json?.message || '')
}

async function postJson(path, body, attempt = 0) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`CJ Dropshipping returned a non-JSON response (status ${res.status}): ${text.slice(0, 200)}`)
  }

  if (isTooManyRequests(res, json) && attempt < 3) {
    await sleep(1200 * (attempt + 1))
    return postJson(path, body, attempt + 1)
  }

  if (!res.ok || json.result === false) {
    throw new Error(`CJ Dropshipping auth failed: ${json.message || res.status}`)
  }
  return json.data
}

function login() {
  const { apiKey, email } = getCredentials()
  return postJson('/authentication/getAccessToken', { email, password: apiKey })
}

function refresh(refreshToken) {
  return postJson('/authentication/refreshAccessToken', { refreshToken })
}

async function readCachedToken() {
  try {
    const snap = await adminDb.ref(TOKEN_PATH).get()
    return snap.exists() ? snap.val() : null
  } catch {
    return null
  }
}

async function writeCachedToken(data) {
  try {
    await adminDb.ref(TOKEN_PATH).set(data)
  } catch {
    // Best-effort - a failed cache write just means the next call logs in again.
  }
}

async function fetchFreshToken() {
  const cached = await readCachedToken()
  const now = Date.now()

  if (cached?.accessToken && new Date(cached.accessTokenExpiryDate).getTime() - now > EXPIRY_SAFETY_MARGIN_MS) {
    return cached.accessToken
  }

  if (cached?.refreshToken && new Date(cached.refreshTokenExpiryDate).getTime() - now > EXPIRY_SAFETY_MARGIN_MS) {
    try {
      const data = await refresh(cached.refreshToken)
      await writeCachedToken(data)
      return data.accessToken
    } catch {
      // Fall through to a fresh login if the refresh token turned out invalid.
    }
  }

  const data = await login()
  await writeCachedToken(data)
  return data.accessToken
}

let inFlight = null

export function getAccessToken() {
  if (!inFlight) {
    inFlight = fetchFreshToken().finally(() => {
      inFlight = null
    })
  }
  return inFlight
}
