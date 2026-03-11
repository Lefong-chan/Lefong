// api/proxy.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const url = req.query.url || (req.body && req.body.url);
  
  if (!url) {
    return res.status(400).json({ error: 'URL M3U tsy nomena.' });
  }
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IPTV-Player/1.0)',
        'Accept': '*/*',
      },
      signal: AbortSignal.timeout(15000), // 15s timeout
    });
    
    if (!response.ok) {
      return res.status(502).json({
        error: `Tsy azo nalaina ny M3U: HTTP ${response.status}`,
      });
    }
    
    const text = await response.text();
    
    if (!text.trim().startsWith('#EXTM3U')) {
      return res.status(422).json({ error: 'Tsy fichier M3U marina izy.' });
    }
    
    const channels = parseM3U(text);
    
    return res.status(200).json({
      total: channels.length,
      channels,
    });
    
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return res.status(504).json({ error: 'Timeout: M3U URL tsy namaly.' });
    }
    return res.status(500).json({ error: 'Fahadisoana: ' + err.message });
  }
}

// ── Parser M3U ──────────────────────────────────────────────
function parseM3U(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const channels = [];
  let current = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('#EXTINF:')) {
      current = parseExtinf(line);
      
    } else if (line.startsWith('#')) {
      continue;
      
    } else if (line.startsWith('http') || line.startsWith('rtmp') || line.startsWith('rtsp')) {
      // URL ny stream
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
  const ch = {
    name: '',
    group: '',
    logo: '',
    id: '',
    url: '',
  };
  
  const commaIdx = line.lastIndexOf(',');
  if (commaIdx !== -1) {
    ch.name = line.slice(commaIdx + 1).trim();
  }
  
  ch.id = extractAttr(line, 'tvg-id');
  ch.logo = extractAttr(line, 'tvg-logo');
  ch.group = extractAttr(line, 'group-title');
  
  if (!ch.name) {
    ch.name = extractAttr(line, 'tvg-name') || 'Chaîne inconnue';
  }
  
  return ch;
}

function extractAttr(line, attr) {
  const re = new RegExp(attr + '=["\']([^"\']*)["\']', 'i');
  const m = line.match(re);
  return m ? m[1].trim() : '';
}
