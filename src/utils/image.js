// alicdn.com (Alibaba's CDN) blocks hotlinking from other domains, so any
// image still hosted there is routed through our own /api/image proxy
// instead of being loaded directly in <img> tags. CJ Dropshipping's own
// image CDN isn't known to need this, so its URLs pass through unchanged.
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
