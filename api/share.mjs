// Serves a lightweight HTML page with OG meta tags for Bayse-style shared market cards.

function getParam(source, keys, fallback = "") {
  const candidates = Array.isArray(keys) ? keys : [keys];

  for (const key of candidates) {
    const value = source[key];
    const first = Array.isArray(value) ? value[0] : value;
    if (first != null && first !== "") return String(first);
  }

  return fallback;
}

function getTheme(source) {
  const raw = getParam(source, ["th", "theme"], "default");
  return raw === "b" ? "bayse" : raw;
}

function getBaysePrimaryUrl(eventId) {
  return eventId ? `https://www.bayse.markets/market/${encodeURIComponent(eventId)}` : "https://www.bayse.markets/trade";
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
        yesUrl: getParam(row, "yesUrl"),
        noLabel: getParam(row, "noLabel", "No"),
        noPrice: getParam(row, "noPrice", "\u2014"),
        noUrl: getParam(row, "noUrl"),
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
      ${row.yesUrl
        ? `<a class="price price-yes" href="${esc(row.yesUrl)}" target="_blank" rel="noopener">${esc(row.yesLabel)} ${esc(row.yesPrice)}</a>`
        : `<div class="price price-yes">${esc(row.yesLabel)} ${esc(row.yesPrice)}</div>`}
      ${row.noUrl
        ? `<a class="price price-no" href="${esc(row.noUrl)}" target="_blank" rel="noopener">${esc(row.noLabel)} ${esc(row.noPrice)}</a>`
        : `<div class="price price-no">${esc(row.noLabel)} ${esc(row.noPrice)}</div>`}
    </div>`).join("");
}

export default function handler(req, res) {
  const q = req.query || {};
  const theme = getTheme(q);
  const title = getParam(q, ["t", "title"], "Prediction Market");
  const eventId = getParam(q, ["e", "eventId"]);
  const primaryUrl = getParam(
    q,
    ["u", "url"],
    theme === "bayse" ? getBaysePrimaryUrl(eventId) : "https://headlineodds.fun"
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
    const focus = getParam(q, ["f", "bayseFocus"]);
    const meta = getParam(q, ["m", "bayseMeta"], "Open Bayse market");
    const close = getParam(q, ["c", "bayseClose"], "Open market");
    const rows = parseRowsParam(getParam(q, ["r", "rows"]));
    const preview = rows[0] || {
      yesLabel: getParam(q, ["yl", "bayseLabel1"], "Yes"),
      yesPrice: getParam(q, ["yp", "baysePrice1"], "\u2014"),
      noLabel: getParam(q, ["nl", "bayseLabel2"], "No"),
      noPrice: getParam(q, ["np", "baysePrice2"], "\u2014"),
    };

    description = `${title} - ${preview.yesLabel} ${preview.yesPrice} / ${preview.noLabel} ${preview.noPrice} on Bayse`;

    body = `
  <div class="bayse-page">
    <div class="bayse-card">
      <div class="bayse-grid" aria-hidden="true"></div>
      <div class="bayse-glow" aria-hidden="true"></div>

      <div class="bayse-inner">
        <div class="bayse-brand">
          <span class="ho-mark" aria-hidden="true"><span class="ho-h">H</span><span class="ho-o">O</span></span>
          <span>Headline Odds</span>
        </div>

        ${focus ? `<div class="bayse-focus">${esc(focus)}</div>` : ""}

        <div class="bayse-title">${esc(title)}</div>

        <div class="bayse-prices">
          <div class="bayse-pill bayse-pill-yes">
            <span class="bayse-pill-dot" aria-hidden="true"></span>
            <span class="bayse-pill-label">${esc(preview.yesLabel)}</span>
            <span class="bayse-pill-value">${esc(preview.yesPrice)}</span>
          </div>
          <div class="bayse-pill bayse-pill-no">
            <span class="bayse-pill-label">${esc(preview.noLabel)}</span>
            <span class="bayse-pill-value">${esc(preview.noPrice)}</span>
          </div>
        </div>

        <div class="bayse-meta">
          <span>${esc(meta)}</span>
          <span>${esc(close)}</span>
        </div>
      </div>

      <div class="bayse-footer">
        <div class="bayse-footer-title">${esc(title)}</div>
        <div class="bayse-footer-meta">headlineodds.fun/scanner &mdash; Powered by Bayse Markets</div>
      </div>
    </div>

    <div class="bayse-actions">
      <a class="bayse-action bayse-action-ghost" href="https://headlineodds.fun/scanner" target="_blank" rel="noopener">Open scanner</a>
      <a class="bayse-action bayse-action-primary" href="${esc(primaryUrl)}" target="_blank" rel="noopener">Open Bayse</a>
      <a class="bayse-action bayse-action-ghost" href="https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener">Share to X</a>
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

    body.bayse-theme {
      background: linear-gradient(180deg, #050814 0%, #02040b 100%);
      color: #ffffff;
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
      width: min(1080px, 100%);
      display: grid;
      gap: 18px;
      justify-items: center;
    }

    .bayse-card {
      width: min(1040px, 100%);
      min-height: 520px;
      border-radius: 30px;
      background: linear-gradient(180deg, rgba(7, 10, 24, 0.94) 0%, rgba(3, 5, 12, 0.98) 100%);
      border: 1px solid rgba(76, 110, 190, 0.45);
      box-shadow: 0 28px 100px rgba(0, 0, 0, 0.48);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .bayse-grid,
    .bayse-glow {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .bayse-grid {
      background-image: linear-gradient(rgba(52, 77, 136, 0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(52, 77, 136, 0.28) 1px, transparent 1px);
      background-size: 34px 34px;
      opacity: 0.24;
    }

    .bayse-glow {
      background: radial-gradient(circle at 50% 14%, rgba(31, 108, 240, 0.22) 0%, rgba(0, 0, 0, 0) 48%);
    }

    .bayse-inner {
      position: relative;
      z-index: 1;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 44px 70px 22px;
      text-align: center;
    }

    .bayse-brand {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
      color: rgba(241, 247, 255, 0.78);
      font-size: 22px;
      font-weight: 600;
    }

    .ho-mark {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      background: #070b17;
      border: 1px solid rgba(82, 119, 199, 0.68);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.08em;
    }

    .ho-h {
      color: #11c46b;
    }

    .ho-o {
      color: #f5f9ff;
    }

    .bayse-focus {
      margin-bottom: 18px;
      padding: 8px 16px;
      border-radius: 999px;
      background: rgba(31, 108, 240, 0.08);
      border: 1px solid rgba(31, 108, 240, 0.18);
      color: #8fb7ff;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .bayse-title {
      max-width: 780px;
      color: #f2f7ff;
      font-size: clamp(38px, 4vw, 56px);
      font-weight: 700;
      letter-spacing: -0.05em;
      line-height: 1.12;
      margin-bottom: 28px;
    }

    .bayse-prices {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 22px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .bayse-pill {
      min-width: 178px;
      min-height: 72px;
      padding: 0 24px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .bayse-pill-yes {
      background: rgba(10, 35, 82, 0.88);
      border: 1px solid rgba(31, 108, 240, 0.32);
      box-shadow: 0 0 0 1px rgba(31, 108, 240, 0.14) inset;
    }

    .bayse-pill-no {
      background: rgba(18, 22, 35, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .bayse-pill-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: #1f6cf0;
    }

    .bayse-pill-label {
      color: rgba(214, 229, 255, 0.9);
      font-size: 21px;
      font-weight: 600;
    }

    .bayse-pill-no .bayse-pill-label {
      color: rgba(204, 214, 232, 0.86);
    }

    .bayse-pill-value {
      color: #1f6cf0;
      font-size: 34px;
      font-weight: 800;
      letter-spacing: -0.04em;
    }

    .bayse-pill-no .bayse-pill-value {
      color: #f2f7ff;
    }

    .bayse-meta {
      display: flex;
      align-items: center;
      gap: 34px;
      color: rgba(208, 218, 238, 0.7);
      font-size: 18px;
      font-weight: 500;
      flex-wrap: wrap;
      justify-content: center;
    }

    .bayse-footer {
      position: relative;
      z-index: 1;
      min-height: 58px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 0 26px;
      background: linear-gradient(90deg, rgba(12, 53, 132, 0.58) 0%, rgba(9, 26, 64, 0.46) 52%, rgba(6, 8, 7, 0.82) 100%);
      border-top: 1px solid rgba(79, 121, 206, 0.35);
      flex-wrap: wrap;
    }

    .bayse-footer-title {
      color: #f5f9ff;
      font-size: 16px;
      font-weight: 700;
    }

    .bayse-footer-meta {
      color: rgba(155, 194, 255, 0.86);
      font-size: 14px;
      font-weight: 500;
    }

    .bayse-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .bayse-action {
      min-height: 42px;
      padding: 0 16px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      transition: transform 160ms ease;
    }

    .bayse-action:hover {
      transform: translateY(-1px);
    }

    .bayse-action-ghost {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(105, 137, 204, 0.28);
      color: rgba(241, 247, 255, 0.86);
    }

    .bayse-action-primary {
      background: rgba(31, 108, 240, 0.16);
      border: 1px solid rgba(31, 108, 240, 0.3);
      color: #a7c7ff;
    }

    @media (max-width: 760px) {
      .bayse-inner {
        padding: 34px 24px 20px;
      }

      .bayse-meta,
      .bayse-footer {
        justify-content: center;
      }
    }

    @media (max-width: 560px) {
      .bayse-prices {
        flex-direction: column;
        width: 100%;
      }

      .bayse-pill {
        width: 100%;
      }

      .bayse-footer {
        padding: 14px 18px;
      }
    }
  </style>
  ${autoRedirect ? `<script>
    if (!/bot|crawl|spider|twitter|facebook|telegram|slack|discord/i.test(navigator.userAgent)) {
      setTimeout(function() { window.location.href = ${toJsString(primaryUrl)}; }, 1500);
    }
  </script>` : ""}
</head>
<body${theme === "bayse" ? ` class="bayse-theme"` : ""}>
${body}
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  return res.status(200).send(html);
}
