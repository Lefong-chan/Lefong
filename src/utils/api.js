async function request(path) {
  const res = await fetch(path)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Error (${res.status})`)
  }
  return data
}

export function searchProducts(keyword, page = 1) {
  return request(`/api/search?keyword=${encodeURIComponent(keyword)}&page=${page}`)
}

export function getProductDetail(itemId) {
  return request(`/api/product?itemId=${encodeURIComponent(itemId)}`)
}

export function getTrendingProducts({ keyword, categoryId } = {}) {
  const params = new URLSearchParams()
  if (categoryId) params.set('categoryId', categoryId)
  else if (keyword) params.set('keyword', keyword)
  const qs = params.toString()
  return request(`/api/trending${qs ? `?${qs}` : ''}`)
}

export function getCategories() {
  return request('/api/categories')
}

export async function updateOrderStatus(idToken, { orderId, status, adminNote }) {
  const res = await fetch('/api/orders/update-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({ orderId, status, adminNote })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error (${res.status})`)
  return data
}
