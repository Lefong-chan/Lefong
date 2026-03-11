const axios = require("axios");

module.exports = async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "url manquant" });

  let targetUrl;
  try {
    targetUrl = decodeURIComponent(url);
    if (!/^https?:\/\//i.test(targetUrl)) {
      return res.status(400).json({ error: "URL invalide" });
    }
  } catch {
    return res.status(400).json({ error: "URL malformée" });
  }

  const BASE = (req.headers["x-forwarded-proto"] || "https") + "://" + (req.headers["x-forwarded-host"] || req.headers.host);

  // 2. User-Agent ho an'ny IPTV
  const headers = {
    "User-Agent": "IPTVSmarters/1.0.3 (iPad; iOS 16.0.2; Scale/2.00)",
    "Accept": "*/*",
    "Connection": "keep-alive"
  };

  if (req.headers.range) headers["Range"] = req.headers.range;

  try {
    // =========================
    // PLAYLIST M3U8 (Mitazona ny fetch fa haingana ity)
    // =========================
    if (targetUrl.toLowerCase().includes(".m3u8")) {
      const playlist = await axios.get(targetUrl, { timeout: 10000, headers });
      let body = playlist.data;
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

      body = body.split("\n").map((line) => {
        line = line.trim();
        if (!line || line.startsWith("#")) return line;
        const absolute = line.startsWith("http") ? line : baseUrl + line;
        return `${BASE}/api/stream?url=${encodeURIComponent(absolute)}`;
      }).join("\n");

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      return res.status(200).send(body);
    }

    // =========================
    // SEGMENT STREAM (.ts) - Pipe mivantana
    // =========================
    const response = await axios({
      method: "GET",
      url: targetUrl,
      responseType: "stream",
      timeout: 10000, // Ahena ny timeout ho 10s mba hitovy amin'ny Vercel
      headers,
      maxRedirects: 5,
      validateStatus: () => true
    });

    // Ny Vercel dia mila mahazo ny header haingana araka izay azo atao
    res.writeHead(response.status || 200, {
      "Content-Type": response.headers["content-type"] || "video/mp2t",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Access-Control-Allow-Origin": "*",
      "Transfer-Encoding": "chunked" // Manampy amin'ny streaming
    });

    // Pipe mivantana avy any amin'ny IPTV mankany amin'ny browser
    response.data.pipe(res);

    // Fanidiana ny connection raha misy fahadisoana
    response.data.on("error", (e) => {
      console.error("Pipe Error:", e.message);
      res.end();
    });

    req.on("close", () => {
      response.data.destroy();
    });

  } catch (err) {
    console.error("Stream Proxy Error:", err.message);
    if (!res.headersSent) res.status(502).end();
  }
};
