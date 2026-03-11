export default function handler(req, res) {
  // CORS Headers mba tsy hisy blocage
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Ny valiny andrasan'ny HTML-nao (fetchDefaultSources)
  const data = {
    ok: true,
    sources: [
      { 
        id: "default-playlist", 
        name: "Ma Playlist M3U", 
        chCount: 0 
      }
    ]
  };

  res.status(200).json(data);
}
