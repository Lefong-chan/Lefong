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
    return res.status(405).json({ ok:false, error:"Method not allowed" });
  }

  try {

    const { server, username, password } = req.body;

    if(!server || !username || !password){
      return res.status(400).json({
        ok:false,
        error:"server, username ary password no ilaina"
      });
    }

    // URL Xtream API
    const apiURL =
      `${server}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;

    const response = await fetch(apiURL);

    if(!response.ok){
      return res.status(502).json({
        ok:false,
        error:"Tsy afaka mifandray amin'ny serveur Xtream"
      });
    }

    const data = await response.json();

    // convertir ho format channel ho an'ny frontend
    const channels = data.map(ch => ({
      id: ch.stream_id,
      name: ch.name,
      logo: ch.stream_icon,
      group: ch.category_name || "Live",
      url:
        `${server}/live/${username}/${password}/${ch.stream_id}.m3u8`
    }));

    res.json({
      ok:true,
      total: channels.length,
      channels
    });

  } catch(err){
    res.status(500).json({
      ok:false,
      error: err.message
    });
  }

}
