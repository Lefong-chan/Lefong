import fetch from "node-fetch";

export default async function handler(req, res) {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {

    let { server, username, password } = req.body;

    if (!server || !username || !password) {
      return res.status(400).json({
        ok: false,
        error: "server, username ary password no ilaina"
      });
    }

    // manala slash farany raha misy
    server = server.replace(/\/$/, "");

    // Xtream API URL
    const apiURL =
      `${server}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;

    // fetch streams
    const response = await fetch(apiURL, {
      method: "GET",
      timeout: 15000
    });

    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        error: "Tsy afaka mifandray amin'ny serveur Xtream"
      });
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(500).json({
        ok: false,
        error: "Format réponse Xtream tsy mety"
      });
    }

    // convert channels ho format frontend
    const channels = data.map((ch, i) => {

      const streamId = ch.stream_id;

      return {
        id: streamId || i,
        name: ch.name || "Unknown",
        logo: ch.stream_icon || "",
        group: ch.category_name || "Live",
        url: `${server}/live/${username}/${password}/${streamId}.m3u8`
      };

    });

    return res.json({
      ok: true,
      total: channels.length,
      channels
    });

  } catch (err) {

    return res.status(500).json({
      ok: false,
      error: err.message || "Erreur serveur"
    });

  }

}
