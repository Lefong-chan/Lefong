export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const DEFAULT_M3U_SOURCES = [
    { id: 'fr',   name: 'France',          url: 'https://iptv-org.github.io/iptv/countries/fr.m3u' },
    { id: 'mg',   name: 'Madagascar',      url: 'https://iptv-org.github.io/iptv/countries/mg.m3u' },
    { id: 'us',   name: 'Etats-Unis',      url: 'https://iptv-org.github.io/iptv/countries/us.m3u' },
    { id: 'ma',   name: 'Maroc',           url: 'https://iptv-org.github.io/iptv/countries/ma.m3u' },
    { id: 'sn',   name: 'Senegal',         url: 'https://iptv-org.github.io/iptv/countries/sn.m3u' }
  ];

  res.status(200).json({
    ok: true,
    sources: DEFAULT_M3U_SOURCES
  });
}
