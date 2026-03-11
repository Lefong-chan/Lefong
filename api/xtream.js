/**
 * IPTV API Server - xtream.js
 * Vercel Serverless Function
 *
 * FIX: Sur Android Chrome, les segments HLS (.ts fragments dans le manifest .m3u8)
 * échouent avec levelLoadError (CORS / réseau). Solution: utiliser .ts direct
 * comme URL principale, et .m3u8 comme fallback pour Safari/iOS.
 */

const axios = require('axios');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Origin, X-Requested-With');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  let { host, username, password } = req.body || {};
  if (!host || !username || !password)
    return res.status(400).json({ ok: false, error: 'Manque parametres: host, username, password' });

  host = host.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(host)) host = 'http://' + host;

  const apiBase = `${host}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  try {
    // 1. Vérifier le compte
    let infoData;
    try {
      const infoResp = await axios.get(apiBase, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
      });
      infoData = infoResp.data;
    } catch (e) {
      return res.status(502).json({ ok: false, error: 'Serveur inaccessible: ' + (e.message || 'Timeout') });
    }

    if (!infoData || !infoData.user_info)
      return res.status(401).json({ ok: false, error: 'Login invalide ou serveur incompatible' });

    const userInfo = infoData.user_info;
    const serverInfo = infoData.server_info || {};

    // 2. Catégories
    let categories = [];
    try {
      const catResp = await axios.get(`${apiBase}&action=get_live_categories`, {
        timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      categories = Array.isArray(catResp.data) ? catResp.data : [];
    } catch (e) { /* non bloquant */ }

    const catMap = {};
    categories.forEach(c => { if (c.category_id) catMap[c.category_id] = c.category_name || 'Divers'; });

    // 3. Streams live
    let rawStreams = [];
    try {
      const streamsResp = await axios.get(`${apiBase}&action=get_live_streams`, {
        timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      rawStreams = Array.isArray(streamsResp.data) ? streamsResp.data : [];
    } catch (e) {
      return res.status(502).json({ ok: false, error: 'Impossible de récupérer les chaînes: ' + (e.message || '') });
    }

    if (!rawStreams.length)
      return res.status(200).json({ ok: false, error: 'Aucune chaîne disponible sur ce serveur' });

    // 4. Construction des chaînes
    // IMPORTANT: url = .ts (direct, fonctionne sur Android/Chrome sans CORS sur fragments)
    //            urlFallback = .m3u8 (pour Safari/iOS qui supporte HLS natif)
    const u = encodeURIComponent(username);
    const p = encodeURIComponent(password);

    const channels = rawStreams.map((s, idx) => {
      const sid = s.stream_id;
      const group = catMap[s.category_id] || s.category_name || 'Divers';
      return {
        id: idx,
        name: s.name || ('Chaîne ' + (idx + 1)),
        // .ts direct = URL principale (pas de fragment HLS, pas de CORS sur segments)
        url: `${host}/live/${u}/${p}/${sid}.ts`,
        // .m3u8 = fallback pour les navigateurs qui supportent HLS natif (Safari iOS)
        urlFallback: `${host}/live/${u}/${p}/${sid}.m3u8`,
        logo: s.stream_icon || '',
        group: group,
        streamId: sid,
        num: s.num || (idx + 1)
      };
    });

    return res.status(200).json({
      ok: true,
      channels,
      categories,
      serverInfo: {
        expirationDate: userInfo.exp_date
          ? new Date(parseInt(userInfo.exp_date) * 1000).toLocaleDateString('fr-FR')
          : null,
        maxConnections: userInfo.max_connections || null,
        activeConnections: userInfo.active_cons || null,
        status: userInfo.status || null,
        timezone: serverInfo.timezone || null,
      },
      source: `Xtream (${channels.length} chaînes)`
    });

  } catch (err) {
    return res.status(502).json({ ok: false, error: err.message || 'Erreur inconnue' });
  }
};
