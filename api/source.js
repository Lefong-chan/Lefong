export default function handler(req, res){

  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,OPTIONS");

  if(req.method === "OPTIONS"){
    return res.status(200).end();
  }

  if(req.method !== "GET"){
    return res.status(405).json({
      ok:false,
      error:"Method not allowed"
    });
  }

  const DEFAULT_M3U_SOURCES = [
    { id:'fr', name:'France 🇫🇷', url:'https://iptv-org.github.io/iptv/countries/fr.m3u' },
    { id:'us', name:'USA 🇺🇸', url:'https://iptv-org.github.io/iptv/countries/us.m3u' },
    { id:'de', name:'Germany 🇩🇪', url:'https://iptv-org.github.io/iptv/countries/de.m3u' },
    { id:'gb', name:'UK 🇬🇧', url:'https://iptv-org.github.io/iptv/countries/gb.m3u' },
    { id:'ma', name:'Maroc 🇲🇦', url:'https://iptv-org.github.io/iptv/countries/ma.m3u' },
    { id:'dz', name:'Algérie 🇩🇿', url:'https://iptv-org.github.io/iptv/countries/dz.m3u' },
    { id:'mg', name:'Madagascar 🇲🇬', url:'https://iptv-org.github.io/iptv/countries/mg.m3u' }
  ];

  res.json({
    ok:true,
    total:DEFAULT_M3U_SOURCES.length,
    sources:DEFAULT_M3U_SOURCES
  });

}
