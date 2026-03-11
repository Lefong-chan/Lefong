/**
 * IPTV API Server - channels.js
 * Node.js / Express
 * 
 * Ampiasao: npm install express axios node-fetch cors
 * Alefa:    node api/channels.js
 * Port:     http://localhost:3001
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// SOURCES M3U PAR DEFAUT (pays / playlists publiques)
// ============================================================
const DEFAULT_M3U_SOURCES = [
  { id: 'fr',   name: 'France 🇫🇷',        url: 'https://iptv-org.github.io/iptv/countries/fr.m3u' },
  { id: 'us',   name: 'États-Unis 🇺🇸',    url: 'https://iptv-org.github.io/iptv/countries/us.m3u' },
  { id: 'de',   name: 'Allemagne 🇩🇪',     url: 'https://iptv-org.github.io/iptv/countries/de.m3u' },
  { id: 'gb',   name: 'Royaume-Uni 🇬🇧',   url: 'https://iptv-org.github.io/iptv/countries/gb.m3u' },
  { id: 'ma',   name: 'Maroc 🇲🇦',         url: 'https://iptv-org.github.io/iptv/countries/ma.m3u' },
  { id: 'dz',   name: 'Algérie 🇩🇿',       url: 'https://iptv-org.github.io/iptv/countries/dz.m3u' },
  { id: 'tn',   name: 'Tunisie 🇹🇳',       url: 'https://iptv-org.github.io/iptv/countries/tn.m3u' },
  { id: 'sn',   name: 'Sénégal 🇸🇳',       url: 'https://iptv-org.github.io/iptv/countries/sn.m3u' },
  { id: 'gh',   name: 'Ghana 🇬🇭',         url: 'https://iptv-org.github.io/iptv/countries/gh.m3u' },
  { id: 'ng',   name: 'Nigeria 🇳🇬',       url: 'https://iptv-org.github.io/iptv/countries/ng.m3u' },
  { id: 'mg',   name: 'Madagascar 🇲🇬',    url: 'https://iptv-org.github.io/iptv/countries/mg.m3u' },
  { id: 'es',   name: 'Espagne 🇪🇸',       url: 'https://iptv-org.github.io/iptv/countries/es.m3u' },
  { id: 'it',   name: 'Italie 🇮🇹',        url: 'https://iptv-org.github.io/iptv/countries/it.m3u' },
  { id: 'br',   name: 'Brésil 🇧🇷',        url: 'https://iptv-org.github.io/iptv/countries/br.m3u' },
  { id: 'tr',   name: 'Turquie 🇹🇷',       url: 'https://iptv-org.github.io/iptv/countries/tr.m3u' },
  { id: 'sa',   name: 'Arabie Saoudite 🇸🇦', url: 'https://iptv-org.github.io/iptv/countries/sa.m3u' },
];

// Cache en mémoire pour les playlists M3U déjà téléchargées
const m3uCache = {};   // id -> { channels, fetchedAt }
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ============================================================
// PARSEUR M3U
// ============================================================
function parseM3U(text) {
  const lines = text.split(/\r?\n/);
  const channels = [];
  let cur = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('#EXTINF')) {
      cur = { name: '', url: '', logo: '', group: 'Divers' };
      const nm  = line.match(/,(.+)$/);       if (nm)  cur.name  = nm[1].trim();
      const lg  = line.match(/tvg-logo="([^"]*)"/i);  if (lg && lg[1].trim()) cur.logo  = lg[1].trim();
      const gr  = line.match(/group-title="([^"]*)"/i); if (gr && gr[1].trim()) cur.group = gr[1].trim();
      const tid = line.match(/tvg-id="([^"]*)"/i);    cur.tvgId = tid ? tid[1] : '';
    } else if (line && !line.startsWith('#') && cur) {
      cur.url = line;
      if (cur.name && cur.url) channels.push({ ...cur, id: channels.length });
      cur = null;
    }
  }
  return channels;
}

// ============================================================
// HELPER – télécharger une URL avec timeout
// ============================================================
async function fetchText(url, timeoutMs = 25000) {
  const resp = await axios.get(url, {
    timeout: timeoutMs,
    headers: {
      'User-Agent': 'Mozilla/5.0 (IPTV-Player/1.0)',
      'Accept': '*/*',
    },
    responseType: 'text',
  });
  if (!resp.data || resp.data.length < 10) throw new Error('Réponse vide');
  return resp.data;
}

// ============================================================
// ROUTES
// ============================================================

/**
 * GET /api/sources
 * Liste toutes les sources M3U par défaut
 */
app.get('/api/sources', (req, res) => {
  const list = DEFAULT_M3U_SOURCES.map(s => ({
    id:   s.id,
    name: s.name,
    type: 'm3u',
    url:  s.url,
    cached: !!(m3uCache[s.id] && Date.now() - m3uCache[s.id].fetchedAt < CACHE_TTL_MS),
    chCount: m3uCache[s.id] ? m3uCache[s.id].channels.length : null,
  }));
  res.json({ ok: true, sources: list });
});

/**
 * GET /api/channels/:sourceId
 * Retourne les chaînes d'une source M3U par défaut
 * Ex: GET /api/channels/fr
 */
app.get('/api/channels/:sourceId', async (req, res) => {
  const { sourceId } = req.params;
  const src = DEFAULT_M3U_SOURCES.find(s => s.id === sourceId);
  if (!src) return res.status(404).json({ ok: false, error: 'Source inconnue' });

  // Vérifier cache
  const cached = m3uCache[sourceId];
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return res.json({ ok: true, source: src.name, channels: cached.channels, fromCache: true });
  }

  try {
    const text = await fetchText(src.url);
    const channels = parseM3U(text);
    m3uCache[sourceId] = { channels, fetchedAt: Date.now() };
    res.json({ ok: true, source: src.name, channels, fromCache: false });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/m3u/url
 * Charger une playlist M3U depuis une URL externe quelconque
 * Body JSON: { url: "https://...", name: "Ma Source" }
 */
app.post('/api/m3u/url', async (req, res) => {
  const { url, name } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: 'url requis' });

  try {
    const text = await fetchText(url);
    const channels = parseM3U(text);
    if (!channels.length) return res.status(422).json({ ok: false, error: 'Aucune chaîne trouvée dans cette playlist' });
    res.json({ ok: true, source: name || url, channels });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/m3u/content
 * Charger une playlist M3U depuis le contenu texte directement
 * Body JSON: { content: "#EXTM3U\n#EXTINF...", name: "Mon fichier" }
 */
app.post('/api/m3u/content', (req, res) => {
  const { content, name } = req.body;
  if (!content) return res.status(400).json({ ok: false, error: 'content requis' });

  try {
    const channels = parseM3U(content);
    if (!channels.length) return res.status(422).json({ ok: false, error: 'Aucune chaîne trouvée' });
    res.json({ ok: true, source: name || 'Fichier local', channels });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/xtream
 * Connexion Xtream Codes — récupère TOUTES les chaînes live depuis le serveur
 * Body JSON: { host: "http://...", username: "...", password: "..." }
 *
 * Étapes :
 *  1. Appel /player_api.php?action=get_live_categories  → catégories
 *  2. Appel /player_api.php?action=get_live_streams     → toutes les chaînes
 *  3. Construction URL de stream pour chaque chaîne
 */
app.post('/api/xtream', async (req, res) => {
  let { host, username, password } = req.body;
  if (!host || !username || !password) {
    return res.status(400).json({ ok: false, error: 'host, username et password sont requis' });
  }

  host = host.replace(/\/$/, '');

  const apiBase = `${host}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  try {
    // 1. Authentification + info serveur
    const infoResp = await axios.get(apiBase, { timeout: 20000 });
    const info = infoResp.data;

    if (!info || info.user_info === undefined) {
      return res.status(401).json({ ok: false, error: 'Identifiants invalides ou serveur inaccessible' });
    }

    const userInfo = info.user_info || {};
    if (userInfo.auth === 0 || userInfo.auth === '0') {
      return res.status(401).json({ ok: false, error: 'Authentification refusée par le serveur' });
    }

    const serverInfo = info.server_info || {};

    // 2. Récupérer les catégories live
    let categories = {};
    try {
      const catResp = await axios.get(`${apiBase}&action=get_live_categories`, { timeout: 20000 });
      if (Array.isArray(catResp.data)) {
        catResp.data.forEach(cat => { categories[cat.category_id] = cat.category_name; });
      }
    } catch (_) { /* ignore, non bloquant */ }

    // 3. Récupérer toutes les chaînes live
    const streamsResp = await axios.get(`${apiBase}&action=get_live_streams`, { timeout: 40000 });
    const rawStreams = streamsResp.data;

    if (!Array.isArray(rawStreams) || rawStreams.length === 0) {
      return res.status(422).json({ ok: false, error: 'Aucune chaîne live trouvée sur ce serveur' });
    }

    // Déterminer le format de stream (ts ou m3u8)
    const streamFormat = serverInfo.rtmp_port ? 'ts' : 'ts';

    // 4. Construire la liste de chaînes
    const channels = rawStreams.map((s, idx) => {
      const catName = categories[s.category_id] || 'Divers';
      const streamUrl = `${host}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${s.stream_id}.${streamFormat}`;
      return {
        id:       idx,
        name:     s.name || `Chaîne ${s.stream_id}`,
        url:      streamUrl,
        logo:     s.stream_icon || '',
        group:    catName,
        streamId: s.stream_id,
        epgId:    s.epg_channel_id || '',
      };
    });

    res.json({
      ok: true,
      source: `Xtream: ${host}`,
      serverInfo: {
        url:            host,
        timezone:       serverInfo.timezone || '',
        timestampNow:   serverInfo.timestamp_now || '',
        protocol:       streamFormat,
        expirationDate: userInfo.exp_date ? new Date(parseInt(userInfo.exp_date) * 1000).toLocaleDateString() : '',
        maxConnections: userInfo.max_connections || '',
        username:       userInfo.username || username,
      },
      categories: Object.values(categories),
      channels,
    });

  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json({ ok: false, error: `Serveur a répondu ${err.response.status}` });
    }
    res.status(502).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/xtream/categories
 * Récupère uniquement les catégories d'un serveur Xtream
 * Query params: host, username, password
 */
app.get('/api/xtream/categories', async (req, res) => {
  let { host, username, password } = req.query;
  if (!host || !username || !password) {
    return res.status(400).json({ ok: false, error: 'host, username, password requis en query' });
  }
  host = host.replace(/\/$/, '');
  try {
    const url = `${host}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_categories`;
    const resp = await axios.get(url, { timeout: 15000 });
    res.json({ ok: true, categories: resp.data });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/xtream/streams
 * Récupère les chaînes d'une catégorie Xtream spécifique
 * Query params: host, username, password, categoryId (optionnel)
 */
app.get('/api/xtream/streams', async (req, res) => {
  let { host, username, password, categoryId } = req.query;
  if (!host || !username || !password) {
    return res.status(400).json({ ok: false, error: 'host, username, password requis' });
  }
  host = host.replace(/\/$/, '');
  let action = 'get_live_streams';
  if (categoryId) action += `&category_id=${encodeURIComponent(categoryId)}`;
  try {
    const url = `${host}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=${action}`;
    const resp = await axios.get(url, { timeout: 30000 });
    const raw = Array.isArray(resp.data) ? resp.data : [];
    const channels = raw.map((s, idx) => ({
      id:       idx,
      name:     s.name || `Chaîne ${s.stream_id}`,
      url:      `${host}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${s.stream_id}.ts`,
      logo:     s.stream_icon || '',
      group:    s.category_name || categoryId || 'Divers',
      streamId: s.stream_id,
    }));
    res.json({ ok: true, channels });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), cacheKeys: Object.keys(m3uCache).length });
});

// ============================================================
// DÉMARRAGE
// ============================================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 IPTV API démarrée sur http://localhost:${PORT}`);
  console.log(`   Sources M3U disponibles: ${DEFAULT_M3U_SOURCES.length}`);
  console.log(`   Routes:`);
  console.log(`     GET  /api/sources`);
  console.log(`     GET  /api/channels/:sourceId   (ex: /api/channels/fr)`);
  console.log(`     POST /api/m3u/url              { url, name }`);
  console.log(`     POST /api/m3u/content          { content, name }`);
  console.log(`     POST /api/xtream               { host, username, password }`);
  console.log(`     GET  /api/xtream/categories    ?host=&username=&password=`);
  console.log(`     GET  /api/xtream/streams       ?host=&username=&password=&categoryId=`);
  console.log(`     GET  /api/health\n`);
});
