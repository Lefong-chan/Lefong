// api/stream.js
const axios = require("axios");

module.exports = async function handler(req, res) {

  // ========================
  // CORS
  // ========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Paramètre url manquant" });
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

    // ========================
    // REQUEST STREAM
    // ========================
    const headers = {
      "User-Agent": "Mozilla/5.0",
      Accept: "*/*",
      Connection: "keep-alive",
    };

    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    const response = await axios({
      method: "GET",
      url: targetUrl,
      responseType: "stream",
      timeout: 30000,
      headers,
      maxRedirects: 5,
      validateStatus: () => true
    });

    const contentType = response.headers["content-type"] || "";

    // ========================
    // CAS PLAYLIST M3U8
    // ========================
    if (
      contentType.includes("mpegurl") ||
      targetUrl.includes(".m3u8")
    ) {

      const playlistResponse = await axios.get(targetUrl, {
        timeout: 30000,
        headers
      });

      let body = playlistResponse.data;

      const baseUrl =
        targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

      body = body
        .split("\n")
        .map((line) => {

          line = line.trim();

          if (!line || line.startsWith("#")) return line;

          let absoluteUrl;

          if (line.startsWith("http")) {
            absoluteUrl = line;
          } else {
            absoluteUrl = baseUrl + line;
          }

          return `${BASE}/api/stream?url=${encodeURIComponent(absoluteUrl)}`;
        })
        .join("\n");

      res.setHeader(
        "Content-Type",
        "application/vnd.apple.mpegurl"
      );

      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Access-Control-Allow-Origin", "*");

      return res.status(200).send(body);
    }

    // ========================
    // CAS SEGMENT VIDEO (.ts .m4s .aac)
    // ========================

    res.status(response.status || 200);

    if (response.headers["content-type"]) {
      res.setHeader(
        "Content-Type",
        response.headers["content-type"]
      );
    } else {

      if (targetUrl.includes(".ts")) {
        res.setHeader("Content-Type", "video/mp2t");
      } else if (targetUrl.includes(".m4s")) {
        res.setHeader("Content-Type", "video/iso.segment");
      } else {
        res.setHeader("Content-Type", "application/octet-stream");
      }

    }

    if (response.headers["content-length"]) {
      res.setHeader(
        "Content-Length",
        response.headers["content-length"]
      );
    }

    if (response.headers["accept-ranges"]) {
      res.setHeader(
        "Accept-Ranges",
        response.headers["accept-ranges"]
      );
    }

    res.setHeader("Cache-Control", "no-cache");

    // STREAM DIRECT
    response.data.pipe(res);

    response.data.on("error", () => {
      if (!res.headersSent) {
        res.status(502).end();
      }
    });

    req.on("close", () => {
      response.data.destroy();
    });

  } catch (err) {

    console.error("Proxy stream error:", err.message);

    if (!res.headersSent) {
      res.status(502).json({
        error: "Impossible de récupérer le stream"
      });
    }

  }
};
