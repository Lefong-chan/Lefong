// Normalizes CJ Dropshipping (developers.cjdropshipping.com) API responses
// into the flat item/detail shape the rest of the app expects. Field names
// here follow CJ's documented v2 API shape as best recalled, not a
// confirmed live payload - api/search.js and api/product.js keep a ?raw=1
// escape hatch to inspect the real response and correct anything that
// turns out different after deploy.

function pick(obj, candidates) {
  if (!obj || typeof obj !== 'object') return undefined
  for (const key of candidates) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key]
  }
  return undefined
}

function toNumber(value) {
  if (value === undefined || value === null) return null
  if (typeof value === 'number') return value
  const match = String(value).match(/[\d.]+/)
  return match ? parseFloat(match[0]) : null
}

function stripHtml(value) {
  if (!value) return ''
  return String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// CJ quotes prices in USD; the rest of the app (formatYuan/formatUsd/
// formatMga in src/utils/currency.js) is built around a CNY base price, so
// convert once here rather than reworking every component. 7.2 keeps the
// round trip back through formatUsd's own CNY->USD factor (0.14) close to
// the original USD amount.
const CJ_USD_TO_CNY = 7.2
function usdToCny(usd) {
  return usd === null || usd === undefined ? null : usd * CJ_USD_TO_CNY
}

// A variant/sell price is often a range like "5.20--8.90", sometimes a
// single value like "5.20".
function parsePriceRange(text) {
  if (!text) return { min: null, max: null }
  const parts = String(text).split('--').map((s) => parseFloat(s))
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return { min: parts[0], max: parts[1] }
  }
  const single = toNumber(text)
  return { min: single, max: single }
}

export function normalizeItem(entry) {
  if (!entry || typeof entry !== 'object') return null

  const itemId = pick(entry, ['pid', 'productId', 'id'])
  const title = stripHtml(pick(entry, ['productNameEn', 'productName', 'nameEn', 'name']))
  const image = pick(entry, ['productImage', 'bigImage', 'image'])
  const { min, max } = parsePriceRange(pick(entry, ['sellPrice', 'price']))
  const shopName = pick(entry, ['supplierName', 'categoryName']) || 'CJ Dropshipping'
  const link = pick(entry, ['productUrl', 'sourceUrl', 'link'])
  const unit = pick(entry, ['productUnit', 'unit']) || 'pcs'

  if (!itemId && !title) return null

  return {
    itemId: itemId ? String(itemId) : null,
    title: title || '(unknown name)',
    image: image || '',
    price: usdToCny(min),
    priceMax: max !== null && max !== min ? usdToCny(max) : null,
    sales: toNumber(pick(entry, ['listedNum', 'sales'])),
    rating: null,
    shopName,
    link: link || '',
    moq: toNumber(pick(entry, ['moq', 'minOrderQty'])) || 1,
    unit
  }
}

export function normalizeSearchResponse(raw, keyword, page) {
  const container = raw?.data && typeof raw.data === 'object' ? raw.data : raw
  const list = container?.list
  const items = Array.isArray(list) ? list.map(normalizeItem).filter(Boolean) : []
  const total = toNumber(pick(container || {}, ['total']))
  return {
    keyword,
    page: Number(page) || 1,
    total: total ?? items.length,
    items
  }
}

function normalizeVariants(container) {
  const variants = pick(container, ['variants', 'variantList'])
  if (!Array.isArray(variants) || !variants.length) return { propGroups: [], skus: [] }

  const values = variants
    .map((v) => ({
      name: stripHtml(pick(v, ['variantNameEn', 'variantName', 'name'])),
      image: pick(v, ['variantImage', 'image']) || ''
    }))
    .filter((v) => v.name)

  // CJ variants are usually a single combined label (e.g. "Black-M") rather
  // than separate color/size axes, so they're grouped under one selector.
  const propGroups = values.length ? [{ name: 'Options', values }] : []

  const skus = variants.map((v) => ({
    skuId: String(pick(v, ['vid', 'variantSku', 'sku']) || ''),
    specs: stripHtml(pick(v, ['variantNameEn', 'variantName', 'name'])),
    price: usdToCny(toNumber(pick(v, ['variantSellPrice', 'sellPrice', 'price']))),
    image: pick(v, ['variantImage', 'image']) || '',
    stock: toNumber(pick(v, ['variantStock', 'stock', 'inventoryNum'])) ?? 99999
  }))

  return { propGroups, skus }
}

// CJ's category tree (from /product/getCategory) is nested: an array of
// wrapper entries, each holding a categoryFirstList of top-level
// categories, which in turn hold second/third-level lists. Only the
// first-level categories are used here (a simple homepage filter row),
// with defensive field-name candidates since the exact shape isn't
// confirmed - see api/categories.js's ?raw=1 escape hatch.
export function normalizeCategories(raw) {
  const container = raw?.data && typeof raw.data === 'object' ? raw.data : raw
  const topLevel = Array.isArray(container) ? container : pick(container || {}, ['list', 'categories'])
  if (!Array.isArray(topLevel)) return []

  const firstLevel = []
  for (const entry of topLevel) {
    const nested = pick(entry, ['categoryFirstList'])
    if (Array.isArray(nested)) {
      firstLevel.push(...nested)
    } else {
      firstLevel.push(entry)
    }
  }

  return firstLevel
    .map((c) => ({
      id: pick(c, ['categoryFirstId', 'categoryId', 'id']),
      name: pick(c, ['categoryFirstName', 'categoryName', 'name'])
    }))
    .filter((c) => c.id && c.name)
    .map((c) => ({ id: String(c.id), name: String(c.name) }))
}

export function normalizeDetailResponse(rawEntry) {
  const container = rawEntry?.data && typeof rawEntry.data === 'object' ? rawEntry.data : rawEntry
  const base = normalizeItem(container)
  if (!base) return null

  const imagesRaw = pick(container, ['productImageSet', 'images'])
  let images = Array.isArray(imagesRaw) && imagesRaw.length ? imagesRaw.filter(Boolean) : []
  if (!images.length && base.image) images = [base.image]

  const description = pick(container, ['description', 'desc']) || ''
  const { propGroups, skus } = normalizeVariants(container)

  return {
    ...base,
    images,
    description,
    video: '',
    priceTiers: [],
    propGroups,
    skus
  }
}
