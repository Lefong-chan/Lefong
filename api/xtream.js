/**
 * api/xtream.js — Xtream Codes Proxy API
 * Compatible Vercel Serverless
 */

const axios = require("axios");

function getBase(req) {
  const host =
    req.headers["x-forwarded-host"] ||
    req.headers["host"] ||
    "lefong.vercel.app";

  const proto = req.headers["x-forwarded-proto"] || "https";

  return `${proto}://${host}`;
}

module.exports = async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Origin, X-Requested-With"
  );

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  }

  let { host, username, password } = req.body || {};

  if (!host || !username || !password) {
    return res.status(400).json({
      ok: false,
      error: "Paramètres manquants: host, username, password",
    });
  }

  host = host.trim().replace(/\/$/, "");

  if (!/^https?:\/\//i.test(host)) {
    host = "http://" + host;
  }

  const apiBase =
    `${host}/player_api.php?username=${encodeURIComponent(username)}` +
    `&password=${encodeURIComponent(password)}`;

  const BASE = getBase(req);

  try {

    // =========================
    // 1. VERIFIER LE COMPTE
    // =========================

    let infoData;

    try {

      const infoResp = await axios.get(apiBase, {
        timeout: 15000,
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
      });

      infoData = infoResp.data;

    } catch (e) {

      return res.status(502).json({
        ok: false,
        error: "Serveur IPTV inaccessible",
      });

    }

    if (!infoData || !infoData.user_info) {
      return res.status(401).json({
        ok: false,
        error: "Login invalide ou serveur incompatible",
      });
    }

    const userInfo = infoData.user_info;
    const serverInfo = infoData.server_info || {};

    // =========================
    // 2. CATEGORIES
    // =========================

    let categories = [];

    try {

      const catResp = await axios.get(
        `${apiBase}&action=get_live_categories`,
        {
          timeout: 15000,
          headers: { "User-Agent": "Mozilla/5.0" },
        }
      );

      categories = Array.isArray(catResp.data)
        ? catResp.data
        : [];

    } catch (e) {}

    const catMap = {};

    categories.forEach((c) => {
      if (c.category_id) {
        catMap[c.category_id] = c.category_name || "Divers";
      }
    });

    // =========================
    // 3. STREAMS LIVE
    // =========================

    let rawStreams = [];

    try {

      const streamsResp = await axios.get(
        `${apiBase}&action=get_live_streams`,
        {
          timeout: 30000,
          headers: { "User-Agent": "Mozilla/5.0" },
        }
      );

      rawStreams = Array.isArray(streamsResp.data)
        ? streamsResp.data
        : [];

    } catch (e) {

      return res.status(502).json({
        ok: false,
        error: "Impossible de récupérer les chaînes",
      });

    }

    if (!rawStreams.length) {
      return res.status(200).json({
        ok: false,
        error: "Aucune chaîne disponible",
      });
    }

    // =========================
    // 4. GENERATION DES CHANNELS
    // =========================

    const u = encodeURIComponent(username);
    const p = encodeURIComponent(password);

    const channels = rawStreams.map((s, idx) => {

      const sid = s.stream_id;

      const group =
        catMap[s.category_id] ||
        s.category_name ||
        "Divers";

      const rawTs =
        `${host}/live/${u}/${p}/${sid}.ts`;

      const rawM3u8 =
        `${host}/live/${u}/${p}/${sid}.m3u8`;

      const proxyTs =
        `${BASE}/api/stream?url=${encodeURIComponent(rawTs)}`;

      const proxyM3u8 =
        `${BASE}/api/stream?url=${encodeURIComponent(rawM3u8)}`;

      return {

        id: idx,

        name:
          (s.name || `Chaîne ${idx + 1}`)
            .replace(/'/g, "’"), // évite bug JS

        logo: s.stream_icon || "",

        group: group,

        streamId: sid,

        num: s.num || idx + 1,

        // PRINCIPAL = HLS
        url: proxyM3u8,

        // FALLBACK = TS
        urlFallback: proxyTs,
      };

    });

    // =========================
    // REPONSE
    // =========================

    return res.status(200).json({

      ok: true,

      source: `Xtream (${channels.length} chaînes)`,

      channels,

      categories,

      serverInfo: {

        expirationDate: userInfo.exp_date
          ? new Date(parseInt(userInfo.exp_date) * 1000)
              .toLocaleDateString("fr-FR")
          : null,

        maxConnections:
          userInfo.max_connections || null,

        activeConnections:
          userInfo.active_cons || null,

        status:
          userInfo.status || null,

        timezone:
          serverInfo.timezone || null,
      },
    });

  } catch (err) {

    console.error("XTREAM ERROR:", err.message);

    return res.status(502).json({
      ok: false,
      error: "Erreur serveur Xtream",
    });

  }

};
