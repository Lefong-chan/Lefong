// Fills in the flat item/detail shape the rest of the app expects (see
// src/components/ProductCard.vue, src/views/ProductDetail.vue) from what
// scraper/index.js pulled off the page before writing it to Firebase.
// The scraper already returns fields under roughly the right names - this
// just applies defaults for anything a given page didn't have and
// normalizes value formats (protocol-relative image URLs, price as a
// number, etc.) so the rest of the app never has to special-case a
// missing field. Used by the scraper bot only - the api/ handlers just
// read back whatever it already wrote out in this shape.

function absoluteImage(url) {
  if (!url) return ''
  if (url.startsWith('//')) return `https:${url}`
  return url
}

export function normalizeItem(entry) {
  if (!entry || typeof entry !== 'object') return null
  if (!entry.itemId || !entry.title) return null

  return {
    itemId: String(entry.itemId),
    title: entry.title,
    image: absoluteImage(entry.image),
    price: entry.price ?? null,
    priceMax: entry.priceMax && entry.priceMax !== entry.price ? entry.priceMax : null,
    sales: entry.sales ?? null,
    rating: null,
    shopName: entry.shopName || '1688 Supplier',
    link: entry.link || (entry.itemId ? `https://detail.1688.com/offer/${entry.itemId}.html` : ''),
    moq: entry.moq || 1,
    unit: entry.unit || 'pcs'
  }
}

export function normalizeSearchResponse(raw, keyword, page) {
  const list = Array.isArray(raw?.items) ? raw.items : []
  const items = list.map(normalizeItem).filter(Boolean)
  return {
    keyword,
    page: Number(page) || 1,
    total: items.length,
    items
  }
}

export function normalizeDetailResponse(raw) {
  const base = normalizeItem(raw)
  if (!base) return null

  const images = Array.isArray(raw.images) && raw.images.length ? raw.images.map(absoluteImage) : [base.image].filter(Boolean)

  return {
    ...base,
    images,
    description: raw.description || '',
    video: '',
    priceTiers: [],
    propGroups: [],
    skus: []
  }
}
