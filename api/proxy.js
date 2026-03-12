// api/proxy.js — M3U Proxy + Xtream Codes

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Parse query params safely
  let qs;
  try { qs = new URL('http://x' + req.url).searchParams; } catch { qs = new URLSearchParams(); }

  // ── ROUTE: Xtream Codes (?type=xtream) ────────────────────
  if (qs.get('type') === 'xtream' || req.url?.includes('/xtream')) {
    return handleXtream(req, res);
  }

  // ── ROUTE: Stream proxy (?type=stream&url=...) ─────────────
  if (qs.get('type') === 'stream') {
    return handleStream(req, res, qs);
  }
  
  // ── POST: import fichier M3U ───────────────────────────────
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body !== 'object' || body === null) {
        body = await readJSON(req);
      }
      const text = body?.content;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'M3U content missing.' });
      }
      if (!text.trim().startsWith('#EXTM3U')) {
        return res.status(422).json({ error: 'Invalid M3U file.' });
      }
      const channels = parseM3U(text);
      return res.status(200).json({ total: channels.length, channels });
    } catch (err) {
      return res.status(500).json({ error: 'Server error: ' + err.message });
    }
  }
  
  // ── GET: import URL M3U ────────────────────────────────────
  if (req.method === 'GET') {
    const url = req.query?.url || qs.get('url');
    if (!url) return res.status(400).json({ error: 'Missing M3U URL.' });
    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: 'Invalid URL. Must start with http:// or https://' });
    }
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IPTV-Player/1.0)', 'Accept': '*/*' },
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) {
        return res.status(502).json({ error: `Failed to fetch M3U: HTTP ${response.status}` });
      }
      const text = await response.text();
      if (!text.trim().startsWith('#EXTM3U')) {
        return res.status(422).json({ error: 'Retrieved file is not a valid M3U.' });
      }
      const channels = parseM3U(text);
      return res.status(200).json({ total: channels.length, channels });
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return res.status(504).json({ error: 'Timeout: M3U URL did not respond within 20s.' });
      }
      return res.status(500).json({ error: 'Server error: ' + err.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed.' });
}

// ══════════════════════════════════════════════════════════════
// STREAM PROXY HANDLER — proxies .m3u8 manifests and .ts segments
// to bypass CORS restrictions on IPTV servers
// ══════════════════════════════════════════════════════════════
async function handleStream(req, res, qs) {
  const targetUrl = qs.get('url');

  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    return res.status(400).json({ error: 'Missing or invalid stream URL.' });
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IPTV-Player/1.0)',
        'Accept':     '*/*',
        'Connection': 'keep-alive',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Stream server returned ${upstream.status}.` });
    }

    const ct = upstream.headers.get('content-type') || 'application/octet-stream';

    // For .m3u8 manifests: rewrite all URLs inside to go through our proxy
    if (
      ct.includes('mpegurl') ||
      ct.includes('m3u') ||
      targetUrl.endsWith('.m3u8') ||
      targetUrl.includes('.m3u8?')
    ) {
      const text = await upstream.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      const proxyBase = req.url.split('?')[0]; // /api/proxy

      // Rewrite each line: relative URLs → absolute → proxied
      const rewritten = text.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        // Build absolute URL
        let absUrl;
        if (/^https?:\/\//i.test(trimmed)) {
          absUrl = trimmed;
        } else if (trimmed.startsWith('/')) {
          const origin = new URL(targetUrl).origin;
          absUrl = origin + trimmed;
        } else {
          absUrl = baseUrl + trimmed;
        }
        return `${proxyBase}?type=stream&url=${encodeURIComponent(absUrl)}`;
      }).join('\n');

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).send(rewritten);
    }

    // For .ts segments and other binary: pipe through
    const buffer = await upstream.arrayBuffer();
    res.setHeader('Content-Type', ct);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).send(Buffer.from(buffer));

  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return res.status(504).json({ error: 'Stream timeout (15s).' });
    }
    return res.status(500).json({ error: 'Stream proxy error: ' + err.message });
  }
}

// ══════════════════════════════════════════════════════════════
// XTREAM CODES HANDLER
// ══════════════════════════════════════════════════════════════
async function handleXtream(req, res) {
  try {
    let params;
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body !== 'object' || body === null) body = await readJSON(req);
      params = body;
    } else {
      const qs = new URL('http://x' + req.url).searchParams;
      params = {
        server: qs.get('server'),
        username: qs.get('username'),
        password: qs.get('password'),
        action: qs.get('action') || 'channels',
      };
    }
    
    const { server, username, password, action } = params || {};
    
    if (!server || !username || !password) {
      return res.status(400).json({
        error: 'Missing credentials: server, username and password are required.',
      });
    }
    
    const base = normalizeServer(server);
    
    // ── Action: info (authenticate + server info) ─────────────
    if (action === 'info') {
      const infoRes = await xtreamRequest(base, username, password, 'get_server_info');
      if (!infoRes.ok) return res.status(infoRes.status).json({ error: infoRes.error });
      return res.status(200).json({
        server_info: infoRes.data?.server_info || {},
        user_info: infoRes.data?.user_info || {},
      });
    }
    
    // ── Action: channels (fetch all live channels) ────────────
    if (action === 'channels' || !action) {
      
      // Step 1: Authenticate and check credentials
      const authRes = await xtreamRequest(base, username, password, 'get_server_info');
      if (!authRes.ok) return res.status(authRes.status).json({ error: authRes.error });
      
      // Step 2: Fetch categories for group names
      const catRes = await xtreamRequest(base, username, password, 'get_live_categories');
      const categories = catRes.ok ? (catRes.data || []) : [];
      
      // Step 3: Fetch all live streams
      const streamsRes = await xtreamRequest(base, username, password, 'get_live_streams');
      if (!streamsRes.ok) {
        return res.status(streamsRes.status).json({ error: streamsRes.error });
      }
      
      const streams = Array.isArray(streamsRes.data) ? streamsRes.data : [];
      
      if (!streams.length) {
        return res.status(200).json({
          total: 0,
          channels: [],
          message: 'No live channels found on this server.',
        });
      }
      
      // Build category_id → name map
      const catMap = {};
      for (const c of categories) {
        if (c.category_id != null) {
          catMap[String(c.category_id)] = String(c.category_name || '').trim();
        }
      }
      
      // Map streams → unified channel format
      const channels = streams.map(s => {
        const streamUrl = `${base}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${s.stream_id}.m3u8`;
        const groupName = catMap[String(s.category_id)] || String(s.category_name || '').trim();
        return {
          name: String(s.name || 'Unknown').trim(),
          group: groupName,
          logo: String(s.stream_icon || s.logo || '').trim(),
          id: String(s.stream_id || ''),
          url: streamUrl,
        };
      });
      
      // Sort: category A→Z, then channel name A→Z
      channels.sort((a, b) => {
        const gc = a.group.localeCompare(b.group, undefined, { sensitivity: 'base' });
        return gc !== 0 ? gc : a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
      
      return res.status(200).json({ total: channels.length, channels });
    }
    
    return res.status(400).json({ error: `Unknown action: "${action}".` });
    
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}

// ── Low-level Xtream API request ──────────────────────────────
async function xtreamRequest(base, username, password, action) {
  const url = `${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=${action}`;
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IPTV-Player/1.0)',
        'Accept': 'application/json, */*',
      },
      signal: AbortSignal.timeout(25000),
    });
    
    const ct = r.headers.get('content-type') || '';
    const txt = await r.text();
    
    // Auth failure patterns
    if (txt.trim() === '0' || txt.trim().toLowerCase() === 'false') {
      return { ok: false, status: 401, error: 'Invalid credentials. Check your username and password.' };
    }
    
    if (!r.ok) {
      const preview = txt.slice(0, 120);
      return { ok: false, status: r.status === 401 ? 401 : 502, error: `Server returned ${r.status}: ${preview}` };
    }
    
    if (!ct.includes('json') && !txt.trim().startsWith('[') && !txt.trim().startsWith('{')) {
      return { ok: false, status: 502, error: 'Server did not return valid JSON. Check your server URL.' };
    }
    
    let data;
    try {
      data = JSON.parse(txt);
    } catch {
      return { ok: false, status: 502, error: 'Invalid JSON response from server.' };
    }
    
    // Explicit auth=0 check
    if (data?.user_info?.auth === 0) {
      return { ok: false, status: 401, error: 'Invalid credentials.' };
    }
    
    return { ok: true, data };
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return { ok: false, status: 504, error: `Request timeout (25s). Check your server URL.` };
    }
    return { ok: false, status: 500, error: err.message };
  }
}

// ── Normalize server URL ──────────────────────────────────────
function normalizeServer(server) {
  let s = String(server).trim();
  if (!/^https?:\/\//i.test(s)) s = 'http://' + s;
  return s.replace(/\/+$/, '');
}

// ── Read raw JSON body ────────────────────────────────────────
function readJSON(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { reject(new Error('Invalid JSON body.')); }
    });
    req.on('error', reject);
  });
}

// ══════════════════════════════════════════════════════════════
// M3U PARSER
// ══════════════════════════════════════════════════════════════
function parseM3U(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const channels = [];
  let current = null;
  
  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      current = parseExtinf(line);
    } else if (line.startsWith('#')) {
      continue;
    } else if (/^https?:\/\//i.test(line)) {
      if (current) {
        current.url = line;
        channels.push(current);
        current = null;
      }
    }
  }
  return channels;
}

function parseExtinf(line) {
  const ch = { name: '', group: '', logo: '', id: '', url: '' };
  const ci = line.lastIndexOf(',');
  if (ci !== -1) ch.name = line.slice(ci + 1).trim();
  ch.id = extractAttr(line, 'tvg-id');
  ch.logo = extractAttr(line, 'tvg-logo');
  ch.group = extractAttr(line, 'group-title');
  if (!ch.name) ch.name = extractAttr(line, 'tvg-name') || 'Unknown channel';
  return ch;
}

function extractAttr(line, attr) {
  const re = new RegExp(attr + '=["\']([^"\']*)["\']', 'i');
  const m = line.match(re);
  return m ? m[1].trim() : '';
}
