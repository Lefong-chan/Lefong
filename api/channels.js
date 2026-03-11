// api/channels.js — Chaînes intégrées par région

export const REGIONS = [
  {
    id: 'fr',
    name: 'France',
    icon: '🇫🇷',
    url: 'https://iptv-org.github.io/iptv/countries/fr.m3u',
  },
  {
    id: 'pf',
    name: 'Polynésie française',
    icon: '🇵🇫',
    url: 'https://iptv-org.github.io/iptv/countries/pf.m3u',
  },
  {
    id: 'ga',
    name: 'Gabon',
    icon: '🇬🇦',
    url: 'https://iptv-org.github.io/iptv/countries/ga.m3u',
  },
  {
    id: 'gm',
    name: 'Gambie',
    icon: '🇬🇲',
    url: 'https://iptv-org.github.io/iptv/countries/gm.m3u',
  },
  {
    id: 'ge',
    name: 'Géorgie',
    icon: '🇬🇪',
    url: 'https://iptv-org.github.io/iptv/countries/ge.m3u',
  },
  {
    id: 'de',
    name: 'Allemagne',
    icon: '🇩🇪',
    url: 'https://iptv-org.github.io/iptv/countries/de.m3u',
  },
  {
    id: 'gh',
    name: 'Ghana',
    icon: '🇬🇭',
    url: 'https://iptv-org.github.io/iptv/countries/gh.m3u',
  },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;

  if (!id) {
    return res.status(200).json({
      regions: REGIONS.map(r => ({ id: r.id, name: r.name, icon: r.icon })),
    });
  }

  const region = REGIONS.find(r => r.id === id);
  if (!region) {
    return res.status(404).json({ error: `Région introuvable : ${id}` });
  }

  try {
    const response = await fetch(region.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IPTV-Player/1.0)',
        'Accept': '*/*',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return res.status(502).json({
        error: `Impossible de récupérer les chaînes de ${region.name} : HTTP ${response.status}`,
      });
    }

    const text = await response.text();

    if (!text.trim().startsWith('#EXTM3U')) {
      return res.status(422).json({ error: "Le fichier récupéré n'est pas un M3U valide." });
    }

    const channels = parseM3U(text);

    return res.status(200).json({
      region: { id: region.id, name: region.name, icon: region.icon },
      total: channels.length,
      channels,
    });

  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return res.status(504).json({ error: `Délai dépassé pour ${region.name} (20s).` });
    }
    return res.status(500).json({ error: 'Erreur serveur : ' + err.message });
  }
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

  ch.id    = extractAttr(line, 'tvg-id');
  ch.logo  = extractAttr(line, 'tvg-logo');
  ch.group = extractAttr(line, 'group-title');

  if (!ch.name) {
    ch.name = extractAttr(line, 'tvg-name') || 'Chaîne inconnue';
  }

  return ch;
}

function extractAttr(line, attr) {
  const re = new RegExp(attr + '=["\']([^"\']*)["\']', 'i');
  const m  = line.match(re);
  return m ? m[1].trim() : '';
}
