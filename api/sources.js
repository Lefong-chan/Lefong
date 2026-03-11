export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const DEFAULT_M3U_SOURCES = [
    { id: 'fr',   name: 'France',          url: 'https://iptv-org.github.io/iptv/countries/fr.m3u' },
    { id: 'mg',   name: 'Madagascar',      url: 'https://iptv-org.github.io/iptv/countries/mg.m3u' },
    { id: 'us',   name: 'Etats-Unis',      url: 'https://iptv-org.github.io/iptv/countries/us.m3u' },
    { id: 'de',   name: 'Allemagne',       url: 'https://iptv-org.github.io/iptv/countries/de.m3u' },
    { id: 'gb',   name: 'Royaume-Uni',     url: 'https://iptv-org.github.io/iptv/countries/gb.m3u' },
    { id: 'ma',   name: 'Maroc',           url: 'https://iptv-org.github.io/iptv/countries/ma.m3u' },
    { id: 'dz',   name: 'Algerie',         url: 'https://iptv-org.github.io/iptv/countries/dz.m3u' },
    { id: 'tn',   name: 'Tunisie',         url: 'https://iptv-org.github.io/iptv/countries/tn.m3u' },
    { id: 'sn',   name: 'Senegal',         url: 'https://iptv-org.github.io/iptv/countries/sn.m3u' },
    { id: 'es',   name: 'Espagne',         url: 'https://iptv-org.github.io/iptv/countries/es.m3u' },
    { id: 'it',   name: 'Italie',          url: 'https://iptv-org.github.io/iptv/countries/it.m3u' },
    { id: 'br',   name: 'Bresil',          url: 'https://iptv-org.github.io/iptv/countries/br.m3u' },
    { id: 'tr',   name: 'Turquie',         url: 'https://iptv-org.github.io/iptv/countries/tr.m3u' },
    { id: 'sa',   name: 'Arabie Saoudite', url: 'https://iptv-org.github.io/iptv/countries/sa.m3u' }
  ];

  res.status(200).json({
    ok: true,
    sources: DEFAULT_M3U_SOURCES
  });
}
