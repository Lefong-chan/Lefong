const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const DEFAULT_M3U_SOURCES = [
  { id: 'fr', name: 'France 🇫🇷', url: 'https://iptv-org.github.io/iptv/countries/fr.m3u' },
  { id: 'mg', name: 'Madagascar 🇲🇬', url: 'https://iptv-org.github.io/iptv/countries/mg.m3u' }
];

// Fonction hikarakarana ny M3U
function parseM3U(text) {
  const lines = text.split(/\r?\n/);
  const channels = [];
  let cur = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('#EXTINF')) {
      cur = { name: '', url: '', logo: '', group: 'Divers' };
      const nm = line.match(/,(.+)$/); if (nm) cur.name = nm[1].trim();
      const lg = line.match(/tvg-logo="([^"]*)"/i); if (lg) cur.logo = lg[1].trim();
      const gr = line.match(/group-title="([^"]*)"/i); if (gr) cur.group = gr[1].trim();
    } else if (line && !line.startsWith('#') && cur) {
      cur.url = line;
      if (cur.name && cur.url) channels.push({ ...cur, id: channels.length });
      cur = null;
    }
  }
  return channels;
}

// 1. Lisitry ny firenena
app.get('/api/sources', (req, res) => {
  res.json({ ok: true, sources: DEFAULT_M3U_SOURCES });
});

// 2. Fakana M3U avy amin'ny firenena (GET)
app.get('/api/channels/:sourceId', async (req, res) => {
  const src = DEFAULT_M3U_SOURCES.find(s => s.id === req.params.sourceId);
  if (!src) return res.status(404).json({ ok: false, error: 'Source introuvable' });
  try {
    const r = await axios.get(src.url, { timeout: 15000 });
    res.json({ ok: true, channels: parseM3U(r.data), source: src.name });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 3. Fakana M3U avy amin'ny URL (POST) - Nampiana ity
app.post('/api/m3u/url', async (req, res) => {
  const { url, name } = req.body;
  try {
    const r = await axios.get(url, { timeout: 20000 });
    res.json({ ok: true, channels: parseM3U(r.data), source: name });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 4. Xtream Codes (POST)
app.post('/api/xtream', async (req, res) => {
  let { host, username, password } = req.body;
  host = host.replace(/\/$/, '');
  const base = `${host}/player_api.php?username=${username}&password=${password}`;
  try {
    const info = await axios.get(base, { timeout: 10000 });
    if (!info.data.user_info) return res.json({ ok: false, error: 'Login fail' });
    
    const streams = await axios.get(`${base}&action=get_live_streams`, { timeout: 20000 });
    const channels = (Array.isArray(streams.data) ? streams.data : []).map((s, i) => ({
      id: i,
      name: s.name,
      url: `${host}/live/${username}/${password}/${s.stream_id}.m3u8`, // .m3u8 fa tsy .ts
      logo: s.stream_icon || '',
      group: 'Live'
    }));
    res.json({ ok: true, channels });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = app;
