export default function handler(req, res) {
  // Ity no lisitry ny sources hita ao amin'ny app-nao
  const sources = [
    {
      id: "m3u-url",
      name: "M3U URL",
      type: "m3u",
      description: "Lien direct vers une playlist M3U"
    },
    {
      id: "xtream-codes",
      name: "Xtream Codes",
      type: "xtream",
      description: "Serveur IPTV avec login/pass"
    },
    {
      id: "m3u-file",
      name: "Fichier M3U",
      type: "file",
      description: "Importer un fichier local"
    }
  ];

  res.status(200).json(sources);
}
