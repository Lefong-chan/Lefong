import axios from 'axios';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  // Maka ny sourceId avy amin'ny URL (ohatra: /api/channels?id=mg)
  const sourceId = req.query.id || req.query.sourceId;

  const sources = {
    'fr': 'https://iptv-org.github.io/iptv/countries/fr.m3u',
    'mg': 'https://iptv-org.github.io/iptv/countries/mg.m3u',
    'us': 'https://iptv-org.github.io/iptv/countries/us.m3u',
    'sn': 'https://iptv-org.github.io/iptv/countries/sn.m3u'
  };

  const url = sources[sourceId];
  if (!url) return res.status(404).json({ ok: false, error: 'Source tsy hita' });

  try {
    const response = await axios.get(url);
    const text = response.data;
    
    // Parseur m3u tsotra
    const lines = text.split(/\r?\n/);
    const channels = [];
    let cur = null;

    for (const line of lines) {
      if (line.startsWith('#EXTINF')) {
        const nameMatch = line.match(/,(.+)$/);
        const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
        const groupMatch = line.match(/group-title="([^"]*)"/i);
        cur = {
          name: nameMatch ? nameMatch[1].trim() : 'Unknown',
          logo: logoMatch ? logoMatch[1] : '',
          group: groupMatch ? groupMatch[1] : 'Divers'
        };
      } else if (line && !line.startsWith('#') && cur) {
        cur.url = line.trim();
        channels.push({ ...cur, id: channels.length });
        cur = null;
      }
    }

    res.status(200).json({ ok: true, channels });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}
