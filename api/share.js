// Serves a lightweight HTML page with OG meta tags for X card previews
// When X crawls this URL, it sees the og:image pointing to /api/og

export const config = { runtime: "edge" };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Prediction Market";
  const yes = searchParams.get("yes") || "—";
  const no = searchParams.get("no") || "—";
  const vol = searchParams.get("vol") || "";
  const closes = searchParams.get("closes") || "";
  const url = searchParams.get("url") || "https://kalshi.com/markets";

  // Build OG image URL with same params
  const ogParams = new URLSearchParams({ title, yes, no, vol, closes });
  const baseUrl = new URL(req.url).origin;
  const ogImage = `${baseUrl}/api/og?${ogParams}`;
  const shareUrl = `${baseUrl}/api/share?${searchParams}`;

  const description = `Market says ${yes}¢ yes / ${no}¢ no — ${title}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)} — Headline Odds</title>
  <meta name="description" content="${esc(description)}" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="${esc(shareUrl)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(ogImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Headline Odds" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@headlineodds" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(ogImage)}" />

  <meta http-equiv="refresh" content="2;url=${esc(url)}" />
  <style>
    body {
      margin: 0; min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: #080a09; color: #eef2ef;
      font-family: system-ui, sans-serif;
    }
    .wrap { text-align: center; padding: 40px; }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { color: #a9b5ae; font-size: 16px; }
    a { color: #00e38f; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>${esc(title)}</h1>
    <p>Redirecting to Kalshi market\u2026</p>
    <p><a href="${esc(url)}">Click here</a> if not redirected.</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
