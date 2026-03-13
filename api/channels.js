// api/channels.js — Chaînes intégrées par région

const { parseM3U } = require('./_parseM3U.js');
const https = require('https');
const http  = require('http');

const REGIONS = [
  { id: 'fr', name: 'France',              icon: '🇫🇷', url: 'https://iptv-org.github.io/iptv/countries/fr.m3u' },
  { id: 'pf', name: 'Polynésie française', icon: '🇵🇫', url: 'https://iptv-org.github.io/iptv/countries/pf.m3u' },
  { id: 'mg', name: 'Madagascar',          icon: '🇲🇬', url: 'https://iptv-org.github.io/iptv/countries/mg.m3u' },
  { id: 're', name: 'La Réunion',          icon: '🇷🇪', url: 'https://iptv-org.github.io/iptv/countries/re.m3u' },
  { id: 'gb', name: 'Royaume-Uni',         icon: '🇬🇧', url: 'https://iptv-org.github.io/iptv/countries/gb.m3u' },
  { id: 'us', name: 'États-Unis',          icon: '🇺🇸', url: 'https://iptv-org.github.io/iptv/countries/us.m3u' },
  { id: 'de', name: 'Allemagne',           icon: '🇩🇪', url: 'https://iptv-org.github.io/iptv/countries/de.m3u' },
  { id: 'es', name: 'Espagne',             icon: '🇪🇸', url: 'https://iptv-org.github.io/iptv/countries/es.m3u' },
  { id: 'it', name: 'Italie',              icon: '🇮🇹', url: 'https://iptv-org.github.io/iptv/countries/it.m3u' },
  { id: 'br', name: 'Brésil',              icon: '🇧🇷', url: 'https://iptv-org.github.io/iptv/countries/br.m3u' },
];

const VALID_ID = /^[a-z]{2,5}$/;

// Fetch HTTP/HTTPS compatible Node.js 14+
function fetchText(url, timeoutMs) {
  return new Promise(function(resolve, reject) {
    const client = url.startsWith('https') ? https : http;
    const timer  = setTimeout(function() { reject(new Error('TIMEOUT')); }, timeoutMs);

    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IPTV-Player/1.0)',
        'Accept': '*/*',
      }
    }, function(res) {
      // Suivre les redirections (301/302)
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        clearTimeout(timer);
        fetchText(res.headers.location, timeoutMs).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        clearTimeout(timer);
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      res.setEncoding('utf8');
      let data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end',  function() { clearTimeout(timer); resolve(data); });
      res.on('error', function(err) { clearTimeout(timer); reject(err); });
    });

    req.on('error', function(err) { clearTimeout(timer); reject(err); });
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée.' });

  const id = (req.query || {}).id;

  // Sans id : liste des régions
  if (!id) {
    return res.status(200).json({
      regions: REGIONS.map(function(r) { return { id: r.id, name: r.name, icon: r.icon }; }),
    });
  }

  // Validation id
  if (!VALID_ID.test(id)) {
    return res.status(400).json({ error: 'Identifiant de région invalide.' });
  }

  const region = REGIONS.find(function(r) { return r.id === id; });
  if (!region) {
    return res.status(404).json({ error: 'Région introuvable : ' + id });
  }

  try {
    const text = await fetchText(region.url, 20000);

    if (!text.trim().startsWith('#EXTM3U')) {
      return res.status(422).json({ error: "Le fichier récupéré n'est pas un M3U valide." });
    }

    const channels = parseM3U(text);

    return res.status(200).json({
      region:   { id: region.id, name: region.name, icon: region.icon },
      total:    channels.length,
      channels: channels,
    });

  } catch (err) {
    if (err.message === 'TIMEOUT') {
      return res.status(504).json({ error: 'Délai dépassé pour ' + region.name + ' (20s).' });
    }
    return res.status(500).json({ error: 'Erreur serveur : ' + (err.message || 'inconnue') });
  }
};
