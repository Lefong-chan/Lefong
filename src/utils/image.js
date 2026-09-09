// alicdn.com (Alibaba's CDN, which hosts every 1688 product image) blocks
// hotlinking from other domains, so it's routed through our own /api/image
// proxy instead of being loaded directly in <img> tags.
export function proxyImage(url) {
  if (!url) return url
  try {
    const u = new URL(url)
    if (u.hostname.endsWith('.alicdn.com')) {
      return `/api/image?url=${encodeURIComponent(url)}`
    }
  } catch {
    // not a valid absolute URL - leave as-is
  }
  return url
}
