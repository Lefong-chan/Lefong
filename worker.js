export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response("Proxy mandeha tsara!", { status: 200 });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Range",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      const decodedUrl = decodeURIComponent(targetUrl);
      const newHeaders = new Headers(request.headers);
      newHeaders.set("User-Agent", "IPTVSmarters/1.0.3 (iPad; iOS 16.0.2; Scale/2.00)");
      newHeaders.delete("Host");

      const response = await fetch(decodedUrl, {
        method: request.method,
        headers: newHeaders,
        redirect: "follow"
      });

      // Raha Playlist m3u8
      if (decodedUrl.toLowerCase().includes(".m3u8")) {
        let body = await response.text();
        const baseUrl = decodedUrl.substring(0, decodedUrl.lastIndexOf("/") + 1);
        const proxyBase = `${url.protocol}//${url.host}${url.pathname}`;

        const newBody = body.split("\n").map(line => {
          line = line.trim();
          if (!line || line.startsWith("#")) return line;
          const absolute = line.startsWith("http") ? line : baseUrl + line;
          return `${proxyBase}?url=${encodeURIComponent(absolute)}`;
        }).join("\n");

        return new Response(newBody, {
          headers: { ...corsHeaders, "Content-Type": "application/vnd.apple.mpegurl" }
        });
      }

      // Raha Fragment .ts (Streaming)
      return new Response(response.body, {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": response.headers.get("Content-Type") || "video/mp2t",
          "Cache-Control": "no-cache"
        }
      });

    } catch (err) {
      return new Response("Error: " + err.message, { status: 500, headers: corsHeaders });
    }
  }
};
