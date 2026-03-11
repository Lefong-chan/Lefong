import fetch from "node-fetch";

// Helper: parse M3U content
function parseM3U(txt) {
  const lines = txt.split(/\r?\n/);
  const chs = [];
  let cur = null;

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    if (line.startsWith('#EXTINF')) {
      cur = { id: chs.length, name: '', logo:'', group:'Divers', url:'' };
      const nm = line.match(/,(.+)$/);
      if (nm) cur.name = nm[1].trim();
      const lg = line.match(/tvg-logo="([^"]*)"/i);
      if (lg && lg[1]) cur.logo = lg[1].trim();
      const gr = line.match(/group-title="([^"]*)"/i);
      if (gr && gr[1]) cur.group = gr[1].trim();
    } else if (!line.startsWith('#') && cur) {
      cur.url = line;
      chs.push(cur);
      cur = null;
    }
  });

  return chs;
}

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if(req.method === "OPTIONS") return res.status(200).end();
  if(req.method !== "POST") return res.status(405).json({ ok:false, error:"Method not allowed" });

  try {

    const { url, content, name } = req.body;

    let m3uText = '';

    if (url) {
      // fetch M3U from URL
      const r = await fetch(url);
      if(!r.ok) throw new Error("Impossible de récupérer le fichier M3U");
      m3uText = await r.text();
    } else if (content) {
      m3uText = content;
    } else {
      return res.status(400).json({ ok:false, error:"URL na Content tsy hita" });
    }

    const channels = parseM3U(m3uText);

    res.json({
      ok:true,
      source: name || "M3U",
      total: channels.length,
      channels
    });

  } catch(err) {
    res.status(500).json({ ok:false, error: err.message });
  }

}
