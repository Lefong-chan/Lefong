// api/_parseM3U.js — Parser M3U partagé

function parseM3U(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const channels = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      current = parseExtinf(line);
    } else if (line.startsWith('#')) {
      continue;
    } else if (/^https?:\/\//i.test(line)) {
      if (current) {
        current.url = line;
        channels.push(current);
        current = null;
      }
    }
  }

  return channels;
}

function parseExtinf(line) {
  const ch = { name: '', group: '', logo: '', id: '', url: '' };

  const commaIdx = line.lastIndexOf(',');
  if (commaIdx !== -1) {
    ch.name = line.slice(commaIdx + 1).trim();
  }

  ch.id    = extractAttr(line, 'tvg-id');
  ch.logo  = extractAttr(line, 'tvg-logo');
  ch.group = extractAttr(line, 'group-title');

  if (!ch.name) {
    ch.name = extractAttr(line, 'tvg-name') || 'Chaîne inconnue';
  }

  return ch;
}

function extractAttr(line, attr) {
  const re = new RegExp(attr + '=["\']([^"\']*)["\']', 'i');
  const m  = line.match(re);
  return m ? m[1].trim() : '';
}

module.exports = { parseM3U };
