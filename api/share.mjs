// Serves a lightweight HTML page with OG meta tags for Bayse-style shared market cards.

function getParam(source, key, fallback = "") {
  const value = source[key];
  return value == null || value === "" ? fallback : String(value);
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

function parseRowsParam(raw) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(row => ({
        title: getParam(row, "title"),
        yesLabel: getParam(row, "yesLabel", "Yes"),
        yesPrice: getParam(row, "yesPrice", "\u2014"),
        noLabel: getParam(row, "noLabel", "No"),
        noPrice: getParam(row, "noPrice", "\u2014"),
      }))
      .filter(row => row.yesPrice || row.noPrice);
  } catch {
    return [];
  }
}

function buildRowsMarkup(rows) {
  return rows.map(row => `
    <div class="row">
      <div class="row-copy">
        ${row.title ? `<div class="row-title">${esc(row.title)}</div>` : ""}
      </div>
      <div class="price price-yes">${esc(row.yesLabel)} ${esc(row.yesPrice)}</div>
      <div class="price price-no">${esc(row.noLabel)} ${esc(row.noPrice)}</div>
    </div>`).join("");
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
    const subtitle = getParam(q, "bayseSubtitle", "Live Bayse market");
    const category = getParam(q, "bayseCategory", "Open market");
    const meta = getParam(q, "bayseMeta", "Open Bayse market");
    const close = getParam(q, "bayseClose", "Open market");
    const image = getParam(q, "image");
    const rows = parseRowsParam(getParam(q, "rows"));
    const preview = rows[0] || { yesLabel: "Yes", yesPrice: "\u2014", noLabel: "No", noPrice: "\u2014" };

    description = `${title} - ${preview.yesLabel} ${preview.yesPrice} / ${preview.noLabel} ${preview.noPrice} on Bayse`;

    body = `
  <div class="bayse-page">
    <div class="bayse-topbar">
      <div class="bayse-brand">
        <span class="bayse-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M8 8.5A3.5 3.5 0 1 1 8 15.5H11.5"></path>
            <path d="M16 15.5A3.5 3.5 0 1 1 16 8.5H12.5"></path>
          </svg>
        </span>
        <span>bayse</span>
      </div>
      <div class="bayse-actions">
        <a class="nav-ghost" href="https://headlineodds.fun/scanner" target="_blank" rel="noopener">Scanner</a>
        <a class="nav-primary" href="${esc(primaryUrl)}" target="_blank" rel="noopener">Open Bayse</a>
      </div>
    </div>

    <div class="bayse-card">
      <div class="card-head">
        <div class="card-main">
          ${image ? `<span class="card-image"><img src="${esc(image)}" alt="${esc(title)}" /></span>` : `<span class="card-fallback">${esc((title || "Bayse").split(/\s+/).slice(0, 2).map(word => word[0] || "").join("").toUpperCase())}</span>`}
          <div class="card-copy">
            <div class="card-title">${esc(title)}</div>
            <div class="card-subtitle">${esc(subtitle)}</div>
          </div>
        </div>
        <span class="card-tag">${esc(category)}</span>
      </div>

      <div class="rows">
        ${buildRowsMarkup(rows.length ? rows : [preview])}
      </div>

      <div class="card-foot">
        <div class="foot-meta">
          <span>${esc(meta)}</span>
          <span>${esc(close)}</span>
        </div>
        <div class="foot-actions">
          <a class="foot-btn foot-share" href="https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener">Share to X</a>
          <a class="foot-btn" href="${esc(primaryUrl)}" target="_blank" rel="noopener">Trade on Bayse</a>
        </div>
      </div>
    </div>
  </div>`;
  } else {
    const yes = getParam(q, "yes", "\u2014");
    const no = getParam(q, "no", "\u2014");
    const vol = getParam(q, "vol");
    const closes = getParam(q, "closes");

    description = `Market says ${yes} yes / ${no} no - ${title}`;
    autoRedirect = true;

    body = `
  <div class="legacy-wrap">
    <h1>${esc(title)}</h1>
    <p>Market says ${esc(yes)} yes / ${esc(no)} no.</p>
    ${vol || closes ? `<p class="legacy-subtle">${vol ? `Volume ${esc(vol)}` : ""}${vol && closes ? " - " : ""}${closes ? `Closes ${esc(closes)}` : ""}</p>` : ""}
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
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

  <style>
    :root {
      color-scheme: light;
      --bg: #f5f8ff;
      --panel: #ffffff;
      --line: #dbe6ff;
      --text: #183b83;
      --text-soft: #5872a8;
      --muted: #88a0cf;
      --bayse: #1f6cf0;
      --bayse-soft: #eef4ff;
      --yes-bg: #f2f7ff;
      --yes-line: #bdd5ff;
      --no-bg: #fff7f7;
      --no-line: #ffd0d0;
      --no-text: #ff5d5d;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 28px;
      background: linear-gradient(180deg, #ffffff 0%, var(--bg) 100%);
      color: var(--text);
      font-family: "Plus Jakarta Sans", system-ui, sans-serif;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    .legacy-wrap {
      width: min(760px, 100%);
      padding: 32px;
      border-radius: 24px;
      background: var(--panel);
      border: 1px solid var(--line);
      text-align: center;
    }

    .legacy-wrap h1 {
      margin: 0 0 12px;
    }

    .legacy-subtle {
      margin: 12px 0;
      color: var(--text-soft);
    }

    .bayse-page {
      width: min(980px, 100%);
      display: grid;
      gap: 22px;
    }

    .bayse-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .bayse-brand {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      color: var(--bayse);
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.04em;
    }

    .bayse-mark {
      width: 34px;
      height: 34px;
      border-radius: 11px;
      background: var(--bayse);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 12px 22px rgba(31, 108, 240, 0.22);
    }

    .bayse-mark svg {
      width: 20px;
      height: 20px;
      fill: none;
      stroke: #fff;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .bayse-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .nav-ghost,
    .nav-primary,
    .foot-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      padding: 0 16px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      transition: transform 160ms ease;
    }

    .nav-ghost,
    .foot-btn {
      border: 1px solid var(--line);
      background: #fff;
    }

    .nav-primary {
      background: var(--bayse);
      color: #fff;
      box-shadow: 0 12px 24px rgba(31, 108, 240, 0.2);
    }

    .nav-ghost:hover,
    .nav-primary:hover,
    .foot-btn:hover {
      transform: translateY(-1px);
    }

    .bayse-card {
      padding: 18px;
      border-radius: 20px;
      background: var(--panel);
      border: 1px solid var(--line);
      box-shadow: 0 18px 40px rgba(31, 108, 240, 0.08);
    }

    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }

    .card-main {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .card-image,
    .card-fallback {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid #e7eeff;
      background: #f0f5ff;
    }

    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .card-fallback {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--bayse);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .card-title {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1.2;
    }

    .card-subtitle {
      margin-top: 4px;
      color: var(--text-soft);
      font-size: 15px;
      line-height: 1.6;
    }

    .card-tag {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 999px;
      background: var(--bayse-soft);
      color: var(--bayse);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .rows {
      display: grid;
      gap: 10px;
    }

    .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      gap: 12px;
      align-items: center;
      padding: 12px 0;
      border-top: 1px solid #eef3ff;
    }

    .row:first-child {
      border-top: none;
      padding-top: 0;
    }

    .row-title {
      color: var(--text-soft);
      font-size: 15px;
      font-weight: 700;
      line-height: 1.45;
    }

    .price {
      min-width: 150px;
      min-height: 40px;
      padding: 0 16px;
      border-radius: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid transparent;
      font-size: 13px;
      font-weight: 700;
      text-align: center;
    }

    .price-yes {
      background: var(--yes-bg);
      border-color: var(--yes-line);
      color: var(--bayse);
    }

    .price-no {
      background: var(--no-bg);
      border-color: var(--no-line);
      color: var(--no-text);
    }

    .card-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid #eef3ff;
    }

    .foot-meta {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      color: var(--muted);
      font-size: 13px;
      font-weight: 600;
    }

    .foot-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .foot-share {
      color: var(--bayse);
      background: var(--bayse-soft);
    }

    @media (max-width: 760px) {
      .row {
        grid-template-columns: 1fr;
      }

      .price {
        width: 100%;
      }

      .card-head,
      .card-foot {
        align-items: flex-start;
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
