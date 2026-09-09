// Thin wrapper around the CJ Dropshipping v2 API (developers.cjdropshipping.com).
// The endpoint paths/params here follow CJ's documented v2 API shape as
// best recalled, not a confirmed cURL snippet (unlike the RapidAPI provider
// this replaces) - api/search.js and api/product.js keep a ?raw=1 escape
// hatch to inspect the real payload and correct anything that turns out
// different once deployed.

import { getAccessToken } from './cjAuth.js'

const BASE = process.env.CJ_API_BASE_URL || 'https://developers.cjdropshipping.com/api2.0/v1'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callCj(path, params, { timeoutMs = 8000, maxRetries = 1, attempt = 0 } = {}) {
  const token = await getAccessToken()
  const url = new URL(`${BASE}${path}`)
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  let res
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { 'CJ-Access-Token': token }
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      if (attempt < maxRetries) {
        return callCj(path, params, { timeoutMs: Math.max(2500, timeoutMs - 3000), maxRetries, attempt: attempt + 1 })
      }
      throw new Error('CJ Dropshipping timed out')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }

  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`CJ Dropshipping returned a non-JSON response (status ${res.status}): ${text.slice(0, 200)}`)
  }

  if (res.status === 429 && attempt < maxRetries) {
    await sleep(1000 * (attempt + 1))
    return callCj(path, params, { timeoutMs, maxRetries, attempt: attempt + 1 })
  }
  if (res.status === 429) {
    const err = new Error('Too many requests right now, please try again shortly')
    err.rateLimited = true
    throw err
  }

  if (!res.ok || json.result === false) {
    throw new Error(`CJ Dropshipping request failed: ${json.message || res.status}`)
  }

  return json
}

export function searchItems(keyword, page = 1, opts) {
  return callCj('/product/list', { productNameEn: keyword, pageNum: page, pageSize: 24 }, opts)
}

export function listByCategory(categoryId, page = 1, opts) {
  return callCj('/product/list', { categoryId, pageNum: page, pageSize: 24 }, opts)
}

export function getItemDetail(itemId, opts) {
  return callCj('/product/query', { pid: itemId }, opts)
}

export function getCategories(opts) {
  return callCj('/product/getCategory', {}, opts)
}
