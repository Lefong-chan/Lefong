// Proxies 1688 product images through our own server. cbu01.alicdn.com and
// friends enforce Referer-based hotlink protection (403 for requests whose
// Referer isn't 1688/taobao/tmall), so loading them directly from the
// browser on our own domain fails silently (broken image). Fetching them
// server-side with a 1688 Referer works, and we stream the bytes back.

const ALLOWED_SUFFIXES = ['.alicdn.com']

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const raw = req.query.url
  if (!raw || typeof raw !== 'string') {
    res.status(400).json({ error: 'url is required' })
    return
  }

  let target
  try {
    target = new URL(raw)
  } catch {
    res.status(400).json({ error: 'invalid url' })
    return
  }

  const allowed = target.protocol === 'https:' && ALLOWED_SUFFIXES.some((s) => target.hostname.endsWith(s))
  if (!allowed) {
    res.status(400).json({ error: 'host not allowed' })
    return
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        Referer: 'https://www.1688.com/',
        'User-Agent': 'Mozilla/5.0 (compatible; SinologImageProxy/1.0)'
      }
    })
    if (!upstream.ok) {
      res.status(upstream.status).end()
      return
    }
    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    const buffer = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000')
    res.status(200).send(buffer)
  } catch (err) {
    console.error('image proxy error', err)
    res.status(502).end()
  }
}
