// api/proxy.js — M3U Proxy (URL + File upload)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // ── POST : import fichier M3U ──────────────────────────────
  if (req.method === 'POST') {
    try {
      let body = req.body;
      
      // Si le body n'est pas encore parsé (raw stream)
      if (typeof body !== 'object' || body === null) {
        body = await new Promise((resolve, reject) => {
          let data = '';
          req.on('data', chunk => { data += chunk; });
          req.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch { reject(new Error('Corps JSON invalide.')); }
          });
          req.on('error', reject);
        });
      }
      
      const text = body?.content;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Contenu M3U manquant dans le corps de la requête.' });
      }
      
      if (!text.trim().startsWith('#EXTM3U')) {
        return res.status(422).json({ error: "Le fichier fourni n'est pas un M3U valide." });
      }
      
      const channels = parseM3U(text);
      
      return res.status(200).json({
        total: channels.length,
        channels,
      });
      
    } catch (err) {
      return res.status(500).json({ error: 'Erreur serveur : ' + err.message });
    }
  }
  
  // ── GET : import URL M3U ───────────────────────────────────
  if (req.method === 'GET') {
    const url = req.query.url;
    
    if (!url) {
      return res.status(400).json({ error: 'URL M3U manquante.' });
    }
    
    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: 'URL invalide. Elle doit commencer par http:// ou https://' });
    }
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IPTV-Player/1.0)',
          'Accept': '*/*',
        },
        signal: AbortSignal.timeout(20000),
      });
      
      if (!response.ok) {
        return res.status(502).json({
          error: `Impossible de récupérer le fichier M3U : HTTP ${response.status}`,
        });
      }
      
      const text = await response.text();
      
      if (!text.trim().startsWith('#EXTM3U')) {
        return res.status(422).json({ error: "Le fichier récupéré n'est pas un M3U valide." });
      }
      
      const channels = parseM3U(text);
      
      return res.status(200).json({
        total: channels.length,
        channels,
      });
      
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return res.status(504).json({ error: "Délai dépassé : l'URL M3U n'a pas répondu (20s)." });
      }
      return res.status(500).json({ error: 'Erreur serveur : ' + err.message });
    }
  }
  
  return res.status(405).json({ error: 'Méthode non autorisée.' });
}

// ── Parser M3U ───────────────────────────────────────────────
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
