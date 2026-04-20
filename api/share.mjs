// Serves a lightweight HTML page with OG meta tags for shared market cards.

function getParam(source, key, fallback = "") {
  const value = source[key];
  return value == null || value === "" ? fallback : String(value);
}

function formatCentsText(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-" || raw === "\u2014") return "\u2014";
  return /^[0-9.]+$/.test(raw) ? `${raw}\u00a2` : raw;
}

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function toJsString(value) {
  return JSON.stringify(String(value ?? ""));
}

export default function handler(req, res) {
  const q = req.query || {};
  const theme = getParam(q, "theme", "default");
  const title = getParam(q, "title", "Prediction Market");
  const primaryUrl = getParam(
    q,
    "url",
    theme === "bayse" ? "https://www.bayse.markets/install" : "https://headlineodds.fun"
  );

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const baseUrl = `${proto}://${host}`;

  const ogParams = new URLSearchParams();
  for (const [key, value] of Object.entries(q)) {
    if (value == null || value === "") continue;
    ogParams.set(key, String(value));
  }

  const ogImage = `${baseUrl}/api/og?${ogParams}`;
  const shareUrl = `${baseUrl}${req.url}`;

  let description = "";
  let body = "";
  let autoRedirect = false;

  if (theme === "bayse") {
    const bayseTitle = getParam(q, "bayseTitle", "Open Bayse market");
    const bayseSubtitle = getParam(q, "bayseSubtitle", "Live Bayse market");
    const bayseLabel1 = getParam(q, "bayseLabel1", "Outcome 1");
    const baysePrice1 = formatCentsText(getParam(q, "baysePrice1", "\u2014"));
    const bayseLabel2 = getParam(q, "bayseLabel2", "Outcome 2");
    const baysePrice2 = formatCentsText(getParam(q, "baysePrice2", "\u2014"));
    const bayseMeta = getParam(q, "bayseMeta", "Open on Bayse");
    const bayseClose = getParam(q, "bayseClose");
    const bayseCategory = getParam(q, "bayseCategory", "Open market");

    description = `${title} - ${bayseLabel1} ${baysePrice1} / ${bayseLabel2} ${baysePrice2} on Bayse`;

    body = `
  <div class="wrap bayse-theme">
    <div class="hero-kicker">
      <span>Bayse Market</span>
      ${bayseCategory ? `<span class="hero-tag">${esc(bayseCategory)}</span>` : ""}
    </div>
    <h1>${esc(title)}</h1>
    <p class="lead">Live Bayse pricing captured from an open market.</p>

    <section class="panel bayse">
      <div class="panel-top">
        <strong>Bayse</strong>
        <span>${esc(bayseMeta)}</span>
      </div>
      <h2>${esc(bayseTitle)}</h2>
      <p class="panel-subtitle">${esc(bayseSubtitle)}</p>

      <div class="odds-row">
        <div class="odd bayse-odd">
          <label>${esc(bayseLabel1)}</label>
          <span>${esc(baysePrice1)}</span>
        </div>
        <div class="odd bayse-odd">
          <label>${esc(bayseLabel2)}</label>
          <span>${esc(baysePrice2)}</span>
        </div>
      </div>

      ${(bayseClose || bayseCategory) ? `
      <div class="panel-meta">
        ${bayseCategory ? `<span>Category: <strong>${esc(bayseCategory)}</strong></span>` : ""}
        ${bayseClose ? `<span>Closes: <strong>${esc(bayseClose)}</strong></span>` : ""}
      </div>` : ""}
    </section>

    <div class="actions">
      <a class="btn btn-bayse" href="${esc(primaryUrl)}" target="_blank" rel="noopener">Open Bayse</a>
      <a class="btn btn-ghost" href="https://headlineodds.fun/scanner" target="_blank" rel="noopener">Try the Scanner</a>
    </div>
  </div>`;
  } else {
    const yes = formatCentsText(getParam(q, "yes", "\u2014"));
    const no = formatCentsText(getParam(q, "no", "\u2014"));
    const vol = getParam(q, "vol");
    const closes = getParam(q, "closes");

    description = `Market says ${yes} yes / ${no} no - ${title}`;
    autoRedirect = true;

    body = `
  <div class="wrap">
    <h1>${esc(title)}</h1>
    <p>Market says ${esc(yes)} yes / ${esc(no)} no.</p>
    ${vol || closes ? `<p class="subtle">${vol ? `Volume ${esc(vol)}` : ""}${vol && closes ? " - " : ""}${closes ? `Closes ${esc(closes)}` : ""}</p>` : ""}
    <p><a href="${esc(primaryUrl)}">Click here</a> if not redirected.</p>
  </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)} - Headline Odds</title>
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

  <style>
    :root {
      color-scheme: dark;
      --bg: #080a09;
      --card: rgba(255,255,255,0.035);
      --border: rgba(255,255,255,0.08);
      --text: #eef2ef;
      --muted: #a9b5ae;
      --green: #00e38f;
      --bayse: #4f7cff;
      --bayse-soft: rgba(79,124,255,0.14);
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        radial-gradient(circle at top right, rgba(79,124,255,0.16), transparent 36%),
        radial-gradient(circle at bottom left, rgba(0,227,143,0.08), transparent 34%),
        var(--bg);
      color: var(--text);
      font-family: system-ui, sans-serif;
      padding: 24px;
    }

    .wrap {
      width: min(920px, 100%);
      text-align: center;
      padding: 40px;
      border-radius: 28px;
      border: 1px solid var(--border);
      background: rgba(8,10,9,0.84);
      backdrop-filter: blur(18px);
      box-shadow: 0 24px 80px rgba(0,0,0,0.36);
    }

    .wrap.bayse-theme {
      text-align: left;
      background:
        linear-gradient(180deg, rgba(79,124,255,0.08), transparent 44%),
        rgba(8,10,9,0.86);
    }

    h1 {
      margin: 0 0 12px;
      font-size: clamp(30px, 4vw, 48px);
      line-height: 1.08;
      letter-spacing: -0.03em;
    }

    h2 {
      margin: 0 0 12px;
      font-size: 20px;
      line-height: 1.35;
      letter-spacing: -0.02em;
    }

    p {
      margin: 0;
      color: var(--muted);
      font-size: 16px;
      line-height: 1.6;
    }

    .subtle {
      margin-top: 10px;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    .hero-kicker {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }

    .hero-kicker > span {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      border-radius: 999px;
      background: var(--bayse-soft);
      border: 1px solid rgba(79,124,255,0.22);
      color: #8db0ff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .hero-tag {
      background: rgba(255,255,255,0.04) !important;
      border-color: rgba(255,255,255,0.12) !important;
      color: var(--muted) !important;
    }

    .lead {
      max-width: 720px;
      margin-bottom: 28px;
    }

    .panel {
      border-radius: 22px;
      padding: 22px;
      border: 1px solid var(--border);
      background: var(--card);
      margin-bottom: 24px;
    }

    .panel.bayse {
      background: linear-gradient(180deg, rgba(79,124,255,0.16), rgba(12,18,38,0.92));
      border-color: rgba(79,124,255,0.26);
    }

    .panel-top {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 12px;
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .panel-top strong {
      font-size: 13px;
      color: #8db0ff;
    }

    .panel-subtitle {
      margin-bottom: 16px;
    }

    .odds-row {
      display: flex;
      gap: 12px;
    }

    .odd {
      flex: 1;
      border-radius: 16px;
      padding: 16px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04);
    }

    .odd label {
      display: block;
      margin-bottom: 8px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .odd span {
      display: block;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.04em;
    }

    .bayse-odd {
      background: rgba(79,124,255,0.14);
      border-color: rgba(79,124,255,0.22);
    }

    .bayse-odd span {
      color: #e3ebff;
    }

    .panel-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 18px;
      margin-top: 16px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
    }

    .panel-meta strong {
      color: var(--text);
    }

    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 0 18px;
      border-radius: 999px;
      border: 1px solid var(--border);
      font-size: 14px;
      font-weight: 700;
      transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
    }

    .btn:hover {
      transform: translateY(-1px);
    }

    .btn-bayse {
      background: var(--bayse-soft);
      border-color: rgba(79,124,255,0.28);
      color: #dce7ff;
    }

    .btn-ghost {
      background: rgba(255,255,255,0.04);
      color: var(--muted);
    }

    @media (max-width: 760px) {
      .wrap,
      .wrap.bayse-theme {
        padding: 28px 20px;
      }

      .odds-row {
        flex-direction: column;
      }
    }
  </style>
  ${autoRedirect ? `<script>
    if (!/bot|crawl|spider|twitter|facebook|telegram|slack|discord/i.test(navigator.userAgent)) {
      setTimeout(function() { window.location.href = ${toJsString(primaryUrl)}; }, 1500);
    }
  </script>` : ""}
</head>
<body>
${body}
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  return res.status(200).send(html);
}
