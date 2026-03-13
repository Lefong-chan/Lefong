// api/channels.js
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

function fetchText(url, timeoutMs, redirectCount) {
  if ((redirectCount || 0) > 5) return Promise.reject(new Error('Trop de redirections'));
  return new Promise(function(resolve, reject) {
    var client = url.startsWith('https') ? https : http;
    var timer  = setTimeout(function() { reject(new Error('TIMEOUT')); }, timeoutMs);
    var req = client.get(url, { headers: { 'User-Agent': 'IPTV-Player/1.0', 'Accept': '*/*' } }, function(res) {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        clearTimeout(timer);
        fetchText(res.headers.location, timeoutMs, (redirectCount || 0) + 1).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { clearTimeout(timer); reject(new Error('HTTP ' + res.statusCode)); return; }
      res.setEncoding('utf8');
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end',  function() { clearTimeout(timer); resolve(data); });
      res.on('error', function(e) { clearTimeout(timer); reject(e); });
    });
    req.on('error', function(e) { clearTimeout(timer); reject(e); });
  });
}

function parseM3U(text) {
  var lines = text.split('\n');
  var channels = [];
  var current = null;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith('#EXTINF:')) {
      current = parseExtinf(line);
    } else if (line.startsWith('#')) {
      continue;
    } else if (/^https?:\/\//i.test(line)) {
      if (current) { current.url = line; channels.push(current); current = null; }
    }
  }
  return channels;
}

function parseExtinf(line) {
  var ch = { name: '', group: '', logo: '', url: '' };
  var ci = line.lastIndexOf(',');
  if (ci !== -1) ch.name = line.slice(ci + 1).trim();
  ch.logo  = extractAttr(line, 'tvg-logo');
  ch.group = extractAttr(line, 'group-title');
  if (!ch.name) ch.name = extractAttr(line, 'tvg-name') || 'Chaîne inconnue';
  return ch;
}

function extractAttr(line, attr) {
  var re = new RegExp(attr + '=["\']([^"\']*)["\']', 'i');
  var m  = line.match(re);
  return m ? m[1].trim() : '';
}

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET')     { res.status(405).json({ error: 'Méthode non autorisée.' }); return; }

  var id = req.query ? req.query.id : undefined;

  if (!id) {
    res.status(200).json({
      regions: REGIONS.map(function(r) { return { id: r.id, name: r.name, icon: r.icon }; })
    });
    return;
  }

  if (!VALID_ID.test(id)) { res.status(400).json({ error: 'ID région invalide.' }); return; }

  var region = null;
  for (var i = 0; i < REGIONS.length; i++) { if (REGIONS[i].id === id) { region = REGIONS[i]; break; } }
  if (!region) { res.status(404).json({ error: 'Région introuvable : ' + id }); return; }

  fetchText(region.url, 20000)
    .then(function(text) {
      if (!text.trim().startsWith('#EXTM3U')) {
        res.status(422).json({ error: "Fichier M3U invalide." });
        return;
      }
      var channels = parseM3U(text);
      res.status(200).json({ region: { id: region.id, name: region.name, icon: region.icon }, total: channels.length, channels: channels });
    })
    .catch(function(err) {
      if (err.message === 'TIMEOUT') { res.status(504).json({ error: 'Délai dépassé (20s).' }); return; }
      res.status(500).json({ error: 'Erreur : ' + (err.message || 'inconnue') });
    });
};
