// api/proxy.js
const https = require('https');
const http  = require('http');

function readBody(req) {
  return new Promise(function(resolve, reject) {
    var data = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) {
      data += chunk;
      if (data.length > 6 * 1024 * 1024) { req.destroy(); reject(new Error('Fichier trop volumineux (max 6 Mo).')); }
    });
    req.on('end',   function() { resolve(data); });
    req.on('error', reject);
  });
}

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // POST : fichier M3U
  if (req.method === 'POST') {
    readBody(req)
      .then(function(raw) {
        if (!raw || !raw.trim()) { res.status(400).json({ error: 'Corps vide.' }); return; }
        var body;
        try { body = JSON.parse(raw); } catch(e) { res.status(400).json({ error: 'JSON invalide.' }); return; }
        var text = body && body.content;
        if (!text || typeof text !== 'string') { res.status(400).json({ error: 'Champ "content" manquant.' }); return; }
        if (!text.trim().startsWith('#EXTM3U')) { res.status(422).json({ error: 'Fichier M3U invalide.' }); return; }
        var channels = parseM3U(text);
        res.status(200).json({ total: channels.length, channels: channels });
      })
      .catch(function(err) {
        res.status(500).json({ error: 'Erreur : ' + (err.message || 'inconnue') });
      });
    return;
  }

  // GET : URL M3U
  if (req.method === 'GET') {
    var url = req.query && req.query.url;
    if (!url) { res.status(400).json({ error: 'Paramètre "url" manquant.' }); return; }
    if (!/^https?:\/\//i.test(url)) { res.status(400).json({ error: 'URL invalide.' }); return; }

    fetchText(url, 20000)
      .then(function(text) {
        if (!text.trim().startsWith('#EXTM3U')) { res.status(422).json({ error: 'Fichier M3U invalide.' }); return; }
        var channels = parseM3U(text);
        res.status(200).json({ total: channels.length, channels: channels });
      })
      .catch(function(err) {
        if (err.message === 'TIMEOUT') { res.status(504).json({ error: 'Délai dépassé (20s).' }); return; }
        res.status(500).json({ error: 'Erreur : ' + (err.message || 'inconnue') });
      });
    return;
  }

  res.status(405).json({ error: 'Méthode non autorisée.' });
};

module.exports.config = { api: { bodyParser: false } };
