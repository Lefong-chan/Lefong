// api/proxy.js — M3U Proxy (URL + File upload)
// Fix: body parsing manuel pour Vercel, gestion timeout compatible, réponse JSON garantie

import { parseM3U } from './_parseM3U.js';

// Vercel: désactiver le body parser automatique pour gérer les gros fichiers
export const config = {
  api: {
    bodyParser: false,
  },
};

// Lire le body brut de la requête
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      data += chunk;
      // Limite 6MB pour éviter les abus
      if (data.length > 6 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Fichier trop volumineux (max 6 Mo).'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// Fetch avec timeout compatible tous environnements
function fetchWithTimeout(url, options, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
    fetch(url, options)
      .then(res => { clearTimeout(timer); resolve(res); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}

export default async function handler(req, res) {
  // Headers CORS toujours présents
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── POST : import fichier M3U ─────────────────────────────────
  if (req.method === 'POST') {
    try {
      const raw = await readBody(req);

      if (!raw || !raw.trim()) {
        return res.status(400).json({ error: 'Corps de requête vide.' });
      }

      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return res.status(400).json({ error: 'Corps JSON invalide.' });
      }

      const text = body?.content;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Contenu M3U manquant (champ "content").' });
      }
      if (!text.trim().startsWith('#EXTM3U')) {
        return res.status(422).json({ error: "Le fichier fourni n'est pas un M3U valide." });
      }

      const channels = parseM3U(text);
      return res.status(200).json({ total: channels.length, channels });

    } catch (err) {
      return res.status(500).json({ error: 'Erreur serveur : ' + (err.message || 'inconnue') });
    }
  }

  // ── GET : import URL M3U ──────────────────────────────────────
  if (req.method === 'GET') {
    const url = req.query?.url;

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
          error: `Impossible de récupérer le fichier M3U : HTTP ${response.status}`,
        });
      }

      const text = await response.text();

      if (!text.trim().startsWith('#EXTM3U')) {
        return res.status(422).json({ error: "Le fichier récupéré n'est pas un M3U valide." });
      }

      const channels = parseM3U(text);
      return res.status(200).json({ total: channels.length, channels });

    } catch (err) {
      if (err.message === 'TIMEOUT') {
        return res.status(504).json({ error: "Délai dépassé : l'URL M3U n'a pas répondu (20s)." });
      }
      return res.status(500).json({ error: 'Erreur serveur : ' + (err.message || 'inconnue') });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}
