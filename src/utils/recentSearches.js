// Tracks the buyer's most recent search keywords in localStorage so the
// homepage's trending grid can lean toward what they're actually
// interested in, instead of only a generic fixed rotation.
const KEY = 'sinolog_recent_searches'
const MAX = 6

export function getRecentSearches() {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function addRecentSearch(keyword) {
  const term = keyword.trim()
  if (!term) return
  try {
    const list = getRecentSearches().filter((k) => k.toLowerCase() !== term.toLowerCase())
    list.unshift(term)
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
  } catch {
    // localStorage can be unavailable (private mode, quota) - not worth surfacing an error for.
  }
}
