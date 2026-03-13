// api/proxy.js — M3U Proxy (URL + File upload)

const { parseM3U } = require('./_parseM3U');

// Désactiver le body parser automatique de Vercel
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) {
      data += chunk;
      if (data.length > 6 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Fichier trop volumineux (max 6 Mo).'));
      }
    });
    req.on('end', function() { resolve(data); });
    req.on('error', reject);
  });
}

function fetchWithTimeout(url, options, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
    fetch(url, options)
      .then(function(res) { clearTimeout(timer); resolve(res); })
      .catch(function(err) { clearTimeout(timer); reject(err); });
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST : fichier M3U uploadé
  if (req.method === 'POST') {
    try {
      const raw = await readBody(req);

      if (!raw || !raw.trim()) {
        return res.status(400).json({ error: 'Corps de requête vide.' });
      }

      let body;
      try {
        body = JSON.parse(raw);
      } catch (e) {
        return res.status(400).json({ error: 'Corps JSON invalide.' });
      }

      const text = body && body.content;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Contenu M3U manquant (champ "content").' });
      }
      if (!text.trim().startsWith('#EXTM3U')) {
        return res.status(422).json({ error: "Le fichier fourni n'est pas un M3U valide." });
      }

      const channels = parseM3U(text);
      return res.status(200).json({ total: channels.length, channels: channels });

    } catch (err) {
      return res.status(500).json({ error: 'Erreur serveur : ' + (err.message || 'inconnue') });
    }
  }

  // GET : URL M3U distante
  if (req.method === 'GET') {
    const url = req.query && req.query.url;

    if (!url) {
      return res.status(400).json({ error: 'Paramètre "url" manquant.' });
    }
    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: 'URL invalide. Elle doit commencer par http:// ou https://' });
    }

    try {
      const response = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IPTV-Player/1.0)',
          'Accept': '*/*',
        },
      }, 20000);

      if (!response.ok) {
        return res.status(502).json({
          error: 'Impossible de récupérer le fichier M3U : HTTP ' + response.status,
        });
      }

      const text = await response.text();

      if (!text.trim().startsWith('#EXTM3U')) {
        return res.status(422).json({ error: "Le fichier récupéré n'est pas un M3U valide." });
      }

      const channels = parseM3U(text);
      return res.status(200).json({ total: channels.length, channels: channels });

    } catch (err) {
      if (err.message === 'TIMEOUT') {
        return res.status(504).json({ error: "Délai dépassé : l'URL M3U n'a pas répondu (20s)." });
      }
      return res.status(500).json({ error: 'Erreur serveur : ' + (err.message || 'inconnue') });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
};
