/**
 * IPTV API Server - xtream.js
 * Vercel Serverless Function
 */

const axios = require('axios');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Origin, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  
  let { host, username, password } = req.body || {};
  
  if (!host || !username || !password) {
    return res.status(400).json({ ok: false, error: 'Manque parametres: host, username, password' });
  }
  
  // Nettoyage du host
  host = host.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(host)) {
    host = 'http://' + host;
  }
  
  const apiBase = `${host}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
  
  try {
    // 1. Vérifier les infos utilisateur
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
    
    if (!infoData || !infoData.user_info) {
      return res.status(401).json({ ok: false, error: 'Login invalide ou serveur incompatible' });
    }
    
    const userInfo = infoData.user_info;
    const serverInfo = infoData.server_info || {};
    
    // Vérification expiration
    if (userInfo.status && userInfo.status !== 'Active') {
      return res.status(401).json({ ok: false, error: 'Compte expiré ou inactif: ' + userInfo.status });
    }
    
    // 2. Récupérer les catégories live
    let categories = [];
    try {
      const catResp = await axios.get(`${apiBase}&action=get_live_categories`, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      categories = Array.isArray(catResp.data) ? catResp.data : [];
    } catch (e) {
      // Non bloquant
    }
    
    // Map catégorie id => nom
    const catMap = {};
    categories.forEach(function(c) {
      if (c.category_id) catMap[c.category_id] = c.category_name || 'Divers';
    });
    
    // 3. Récupérer les streams live
    let rawStreams = [];
    try {
      const streamsResp = await axios.get(`${apiBase}&action=get_live_streams`, {
        timeout: 30000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      rawStreams = Array.isArray(streamsResp.data) ? streamsResp.data : [];
    } catch (e) {
      return res.status(502).json({ ok: false, error: 'Impossible de récupérer les chaînes: ' + (e.message || '') });
    }
    
    if (!rawStreams.length) {
      return res.status(200).json({ ok: false, error: 'Aucune chaîne disponible sur ce serveur' });
    }
    
    // 4. Construire la liste des chaînes
    // URL .m3u8 (HLS) en premier, .ts en fallback
    const channels = rawStreams.map(function(s, idx) {
      const streamId = s.stream_id;
      const groupName = catMap[s.category_id] || s.category_name || 'Divers';
      
      return {
        id: idx,
        name: s.name || ('Chaîne ' + (idx + 1)),
        // .m3u8 = HLS (essayé en premier par le player)
        url: `${host}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${streamId}.m3u8`,
        // .ts = fallback natif si .m3u8 échoue
        urlFallback: `${host}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${streamId}.ts`,
        logo: s.stream_icon || '',
        group: groupName,
        streamId: streamId,
        num: s.num || (idx + 1)
      };
    });
    
    // Infos serveur formatées
    const formattedServerInfo = {
      expirationDate: userInfo.exp_date ?
        new Date(parseInt(userInfo.exp_date) * 1000).toLocaleDateString('fr-FR') :
        null,
      maxConnections: userInfo.max_connections || null,
      activeConnections: userInfo.active_cons || null,
      status: userInfo.status || null,
      timezone: serverInfo.timezone || null,
    };
    
    return res.status(200).json({
      ok: true,
      channels: channels,
      categories: categories,
      serverInfo: formattedServerInfo,
      source: `Xtream (${channels.length} chaînes)`
    });
    
  } catch (err) {
    return res.status(502).json({ ok: false, error: err.message || 'Erreur inconnue' });
  }
};
