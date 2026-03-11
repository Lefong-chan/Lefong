/**
 * api/stream.js — Proxy stream IPTV
 *
 * Résout le problème "Mixed Content Block" :
 * Le site est en HTTPS (lefong.vercel.app) mais les streams IPTV sont en HTTP.
 * Chrome Android bloque HTTP depuis une page HTTPS.
 *
 * Solution : Ce proxy récupère le stream HTTP côté serveur (Vercel = HTTPS)
 * et le retransmet au navigateur via HTTPS.
 *
 * Usage : GET /api/stream?url=http://serveur:port/live/user/pass/123.ts
 */

const axios = require('axios');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Paramètre url manquant' });
  }

  // Sécurité : n'accepter que les URLs IPTV valides
  let targetUrl;
  try {
    targetUrl = decodeURIComponent(url);
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'URL invalide' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'URL malformée' });
  }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
      'Connection': 'keep-alive',
    };

    // Transmettre le header Range si présent (pour seek)
    if (req.headers['range']) {
      headers['Range'] = req.headers['range'];
    }

    const response = await axios({
      method: 'GET',
      url: targetUrl,
      responseType: 'stream',
      timeout: 30000,
      headers: headers,
      maxRedirects: 5,
    });

    // Transmettre les headers importants
    const statusCode = response.status || 200;
    res.status(statusCode);

    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    } else {
      // Détecter le type selon l'URL
      if (/\.ts($|\?)/.test(targetUrl)) {
        res.setHeader('Content-Type', 'video/mp2t');
      } else if (/\.m3u8($|\?)/.test(targetUrl)) {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      } else {
        res.setHeader('Content-Type', 'video/mp2t');
      }
    }

    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    if (response.headers['content-range']) {
      res.setHeader('Content-Range', response.headers['content-range']);
    }
    if (response.headers['accept-ranges']) {
      res.setHeader('Accept-Ranges', response.headers['accept-ranges']);
    }

    // Cache pour le streaming
    res.setHeader('Cache-Control', 'no-cache, no-store');

    // Pipe le stream directement
    response.data.pipe(res);

    response.data.on('error', (err) => {
      console.error('[PROXY] Stream error:', err.message);
      if (!res.headersSent) res.status(502).end();
    });

    req.on('close', () => {
      response.data.destroy();
    });

  } catch (err) {
    console.error('[PROXY] Erreur:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Impossible de récupérer le stream: ' + err.message });
    }
  }
};
