// api/stream.js
const axios = require("axios");

module.exports = async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "url manquant" });
  }

  let targetUrl;

  try {
    targetUrl = decodeURIComponent(url);

    if (!/^https?:\/\//i.test(targetUrl)) {
      return res.status(400).json({ error: "URL invalide" });
    }

  } catch {
    return res.status(400).json({ error: "URL malformée" });
  }

  const BASE =
    (req.headers["x-forwarded-proto"] || "https") +
    "://" +
    (req.headers["x-forwarded-host"] || req.headers.host);

  try {

    const headers = {
      "User-Agent": "Mozilla/5.0",
      Accept: "*/*",
      Connection: "keep-alive"
    };

    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    // =========================
    // PLAYLIST M3U8
    // =========================
    if (targetUrl.includes(".m3u8")) {

      const playlist = await axios.get(targetUrl, {
        timeout: 20000,
        headers
      });

      let body = playlist.data;

      const baseUrl =
        targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

      body = body
        .split("\n")
        .map((line) => {

          line = line.trim();

          if (!line || line.startsWith("#")) return line;

          let absolute;

          if (line.startsWith("http")) {
            absolute = line;
          } else {
            absolute = baseUrl + line;
          }

          // proxy segments + playlists
          return `${BASE}/api/stream?url=${encodeURIComponent(absolute)}`;

        })
        .join("\n");

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Cache-Control", "no-cache");

      return res.status(200).send(body);
    }

    // =========================
    // SEGMENT STREAM (.ts)
    // =========================
    const response = await axios({
      method: "GET",
      url: targetUrl,
      responseType: "stream",
      timeout: 30000,
      headers,
      maxRedirects: 5,
      validateStatus: () => true
    });

    res.status(response.status || 200);

    if (response.headers["content-type"]) {
      res.setHeader("Content-Type", response.headers["content-type"]);
    } else {
      res.setHeader("Content-Type", "video/mp2t");
    }

    if (response.headers["content-length"]) {
      res.setHeader("Content-Length", response.headers["content-length"]);
    }

    if (response.headers["accept-ranges"]) {
      res.setHeader("Accept-Ranges", response.headers["accept-ranges"]);
    }

    res.setHeader("Cache-Control", "no-cache");

    response.data.pipe(res);

    response.data.on("error", () => {
      if (!res.headersSent) res.status(502).end();
    });

    req.on("close", () => {
      response.data.destroy();
    });

  } catch (err) {

    console.error("stream proxy error:", err.message);

    if (!res.headersSent) {
      res.status(502).json({
        error: "stream impossible"
      });
    }

  }

};
