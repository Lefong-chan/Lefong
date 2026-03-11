/**
 * IPTV API Server - channels.js
 * Voadio ho an'ny Vercel sy ny fandefasana video (m3u8)
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// CORS mba hanaiky ny navigateur rehetra
app.use(cors());
app.use(express.json());

// Lisitry ny firenena M3U (Default)
const DEFAULT_M3U_SOURCES = [
  { id: 'fr',   name: 'France 🇫🇷',        url: 'https://iptv-org.github.io/iptv/countries/fr.m3u' },
  { id: 'us',   name: 'États-Unis 🇺🇸',    url: 'https://iptv-org.github.io/iptv/countries/us.m3u' },
  { id: 'de',   name: 'Allemagne 🇩🇪',     url: 'https://iptv-org.github.io/iptv/countries/de.m3u' },
  { id: 'gb',   name: 'Royaume-Uni 🇬🇧',   url: 'https://iptv-org.github.io/iptv/countries/gb.m3u' },
  { id: 'ma',   name: 'Maroc 🇲🇦',         url: 'https://iptv-org.github.io/iptv/countries/ma.m3u' },
  { id: 'dz',   name: 'Algérie 🇩🇿',       url: 'https://iptv-org.github.io/iptv/countries/dz.m3u' },
  { id: 'tn',   name: 'Tunisie 🇹🇳',       url: 'https://iptv-org.github.io/iptv/countries/tn.m3u' },
  { id: 'sn',   name: 'Sénégal 🇸🇳',       url: 'https://iptv-org.github.io/iptv/countries/sn.m3u' },
  { id: 'mg',   name: 'Madagascar 🇲🇬',    url: 'https://iptv-org.github.io/iptv/countries/mg.m3u' },
  { id: 'es',   name: 'Espagne 🇪🇸',       url: 'https://iptv-org.github.io/iptv/countries/es.m3u' },
  { id: 'it',   name: 'Italie 🇮🇹',        url: 'https://iptv-org.github.io/iptv/countries/it.m3u' },
  { id: 'br',   name: 'Brésil 🇧🇷',        url: 'https://iptv-org.github.io/iptv/countries/br.m3u' },
  { id: 'tr',   name: 'Turquie 🇹🇷',       url: 'https://iptv-org.github.io/iptv/countries/tr.m3u' },
  { id: 'sa',   name: 'Arabie Saoudite 🇸🇦', url: 'https://iptv-org.github.io/iptv/countries/sa.m3u' },
];

/**
 * Mampiditra ny rakitra M3U ho lasa Array
 */
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
    } else if (line && !line.startsWith('#') && cur) {
      cur.url = line;
      if (cur.name && cur.url) channels.push({ ...cur, id: channels.length });
      cur = null;
    }
  }
  return channels;
}

/**
 * Mitady ny lahatsoratra avy amin'ny URL
 */
async function fetchText(url, timeoutMs = 25000) {
  const resp = await axios.get(url, {
    timeout: timeoutMs,
    headers: { 'User-Agent': 'Mozilla/5.0 (IPTV-Player/1.0)', 'Accept': '*/*' },
    responseType: 'text',
  });
  return resp.data;
}

// --- ROUTES ---

// 1. Fakana ny lisitry ny firenena
app.get('/api/sources', (req, res) => {
  const list = DEFAULT_M3U_SOURCES.map(s => ({
    id: s.id, name: s.name, type: 'm3u', url: s.url
  }));
  res.json({ ok: true, sources: list });
});

// 2. Fakana ny chaîne rehetra ao amin'ny firenena iray
app.get('/api/channels/:sourceId', async (req, res) => {
  const { sourceId } = req.params;
  const src = DEFAULT_M3U_SOURCES.find(s => s.id === sourceId);
  if (!src) return res.status(404).json({ ok: false, error: 'Source inconnue' });

  try {
    const text = await fetchText(src.url);
    const channels = parseM3U(text);
    res.json({ ok: true, source: src.name, channels });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

// 3. Fikarakarana ny Xtream Codes
app.post('/api/xtream', async (req, res) => {
  let { host, username, password } = req.body;
  if (!host || !username || !password) return res.status(400).json({ ok: false, error: 'Manque parametres' });
  
  host = host.replace(/\/$/, ''); // Esory ny / any amin'ny farany
  const apiBase = `${host}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  try {
    // Hamarino raha mety ny login
    const infoResp = await axios.get(apiBase, { timeout: 15000 });
    if (!infoResp.data || !infoResp.data.user_info) {
        return res.status(401).json({ ok: false, error: 'Login failed: Hamarino ny Host sy Identifiants' });
    }

    // Alao ny sokajy (categories)
    let categories = {};
    const catResp = await axios.get(`${apiBase}&action=get_live_categories`, { timeout: 15000 });
    if (Array.isArray(catResp.data)) {
        catResp.data.forEach(c => categories[c.category_id] = c.category_name);
    }

    // Alao ny chaîne rehetra
    const streamsResp = await axios.get(`${apiBase}&action=get_live_streams`, { timeout: 30000 });
    const rawStreams = Array.isArray(streamsResp.data) ? streamsResp.data : [];

    // Ovaina ho format mampiasa .m3u8 mba halefaka vakiana amin'ny navigateur
    const channels = rawStreams.map((s, idx) => ({
      id: idx,
      name: s.name,
      // Natao .m3u8 eto mba hialana amin'ny MEDIA_ELEMENT_ERROR
      url: `${host}/live/${username}/${password}/${s.stream_id}.m3u8`, 
      logo: s.stream_icon || '',
      group: categories[s.category_id] || 'Live'
    }));

    res.json({ ok: true, channels });
  } catch (err) {
    res.status(502).json({ ok: false, error: "Tsy azo ny serveur Xtream: " + err.message });
  }
});

// Statut-ny server
app.get('/api/health', (req, res) => res.json({ ok: true, status: "Serverless active" }));

// TSY MAINTSY: module.exports ho an'ny Vercel
module.exports = app;
