// api/stream.js — Vercel Edge Function: stream proxy (no timeout, true piping)
// Handles .m3u8 manifests AND .ts segments via real HTTP streaming

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders(),
    });
  }

  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid URL.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IPTV-Player/1.0)',
        'Accept':     '*/*',
      },
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream returned ${upstream.status}` }),
        { status: upstream.status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    const ct = upstream.headers.get('content-type') || '';
    const isManifest =
      ct.includes('mpegurl') ||
      ct.includes('m3u') ||
      targetUrl.includes('.m3u8');

    if (isManifest) {
      // Rewrite manifest: proxy sub-playlists, keep segments as absolute direct URLs
      const text  = await upstream.text();
      const base  = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      const origin = new URL(targetUrl).origin;

      const rewritten = text.split('\n').map(line => {
        const t = line.trim();
        if (!t || t.startsWith('#')) return line;

        // Resolve to absolute URL
        let abs;
        if (/^https?:\/\//i.test(t))  abs = t;
        else if (t.startsWith('/'))   abs = origin + t;
        else                          abs = base + t;

        // Sub-playlists (.m3u8) → still proxy through edge function
        if (abs.includes('.m3u8')) {
          return `/api/stream?url=${encodeURIComponent(abs)}`;
        }

        // Segments (.ts, .aac, etc.) → proxy through edge function (no CORS issue)
        return `/api/stream?url=${encodeURIComponent(abs)}`;
      }).join('\n');

      return new Response(rewritten, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache',
          ...corsHeaders(),
        },
      });
    }

    // Binary segment: true streaming pipe — no buffering, no timeout issue
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': ct || 'video/mp2t',
        'Cache-Control': 'no-cache',
        ...corsHeaders(),
      },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Edge stream error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
  };
}
