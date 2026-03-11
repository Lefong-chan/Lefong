/**
 * IPTV API Server - channels.js
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Origin', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

app.options('*', cors());
app.use(express.json());

const DEFAULT_M3U_SOURCES = [
  { id: 'fr',   name: 'France',          url: 'https://iptv-org.github.io/iptv/countries/fr.m3u' },
  { id: 'us',   name: 'Etats-Unis',      url: 'https://iptv-org.github.io/iptv/countries/us.m3u' },
  { id: 'de',   name: 'Allemagne',       url: 'https://iptv-org.github.io/iptv/countries/de.m3u' },
  { id: 'gb',   name: 'Royaume-Uni',     url: 'https://iptv-org.github.io/iptv/countries/gb.m3u' },
  { id: 'ma',   name: 'Maroc',           url: 'https://iptv-org.github.io/iptv/countries/ma.m3u' },
  { id: 'dz',   name: 'Algerie',         url: 'https://iptv-org.github.io/iptv/countries/dz.m3u' },
  { id: 'tn',   name: 'Tunisie',         url: 'https://iptv-org.github.io/iptv/countries/tn.m3u' },
  { id: 'sn',   name: 'Senegal',         url: 'https://iptv-org.github.io/iptv/countries/sn.m3u' },
  { id: 'mg',   name: 'Madagascar',      url: 'https://iptv-org.github.io/iptv/countries/mg.m3u' },
  { id: 'es',   name: 'Espagne',         url: 'https://iptv-org.github.io/iptv/countries/es.m3u' },
  { id: 'it',   name: 'Italie',          url: 'https://iptv-org.github.io/iptv/countries/it.m3u' },
  { id: 'br',   name: 'Bresil',          url: 'https://iptv-org.github.io/iptv/countries/br.m3u' },
  { id: 'tr',   name: 'Turquie',         url: 'https://iptv-org.github.io/iptv/countries/tr.m3u' },
  { id: 'sa',   name: 'Arabie Saoudite', url: 'https://iptv-org.github.io/iptv/countries/sa.m3u' },
];

const m3uCache = {};
const CACHE_TTL_MS = 10 * 60 * 1000; 

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

async function fetchText(url, timeoutMs = 25000) {
  const resp = await axios.get(url, {
    timeout: timeoutMs,
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' },
    responseType: 'text',
  });
  return resp.data;
}

// --- ROUTES ---

app.get('/api/sources', (req, res) => {
  const list = DEFAULT_M3U_SOURCES.map(s => ({
    id: s.id, name: s.name, type: 'm3u', url: s.url, chCount: 0
  }));
  res.setHeader('Cache-Control', 'no-store');
  res.json({ ok: true, sources: list });
});

app.get('/api/channels/:sourceId', async (req, res) => {
  const { sourceId } = req.params;
  const src = DEFAULT_M3U_SOURCES.find(s => s.id === sourceId);
  if (!src) return res.status(404).json({ ok: false, error: 'Source inconnue' });

  try {
    const text = await fetchText(src.url);
    const channels = parseM3U(text);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ ok: true, source: src.name, channels });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

app.post('/api/xtream', async (req, res) => {
  let { host, username, password } = req.body;
  if (!host || !username || !password) return res.status(400).json({ ok: false, error: 'Manque parametres' });
  
  host = host.replace(/\/$/, '');
  const apiBase = `${host}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  try {
    const infoResp = await axios.get(apiBase, { timeout: 15000 });
    if (!infoResp.data || !infoResp.data.user_info) return res.status(401).json({ ok: false, error: 'Login failed' });

    const streamsResp = await axios.get(`${apiBase}&action=get_live_streams`, { timeout: 25000 });
    const rawStreams = Array.isArray(streamsResp.data) ? streamsResp.data : [];

    const channels = rawStreams.slice(0, 500).map((s, idx) => ({
      id: idx,
      name: s.name,
      url: `${host}/live/${username}/${password}/${s.stream_id}.ts`,
      logo: s.stream_icon || '',
      group: 'Live'
    }));

    res.json({ ok: true, channels });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true, status: "Serverless active" }));

module.exports = app;
