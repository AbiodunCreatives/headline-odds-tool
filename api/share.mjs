// Serves a lightweight HTML page with OG meta tags for X card previews.
// The Bayse theme shows a comparison landing page, while legacy links keep the existing redirect flow.

function getParam(source, key, fallback = "") {
  const value = source[key];
  return value == null || value === "" ? fallback : String(value);
}

function formatCentsText(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-" || raw === "—") return "—";
  return /^[0-9.]+$/.test(raw) ? `${raw}¢` : raw;
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
  const primaryUrl = getParam(q, "url", "https://kalshi.com/markets");
  const secondaryUrl = getParam(q, "secondaryUrl");

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
    const bayseLabel1 = getParam(q, "bayseLabel1", "Outcome 1");
    const baysePrice1 = formatCentsText(getParam(q, "baysePrice1", "—"));
    const bayseLabel2 = getParam(q, "bayseLabel2", "Outcome 2");
    const baysePrice2 = formatCentsText(getParam(q, "baysePrice2", "—"));
    const bayseMeta = getParam(q, "bayseMeta", "Open on Bayse");
    const kalshiTitle = getParam(q, "kalshiTitle", "Matched Kalshi market");
    const kalshiYes = formatCentsText(getParam(q, "kalshiYes", "—"));
    const kalshiNo = formatCentsText(getParam(q, "kalshiNo", "—"));
    const kalshiMeta = getParam(q, "kalshiMeta", "Live Kalshi price");
    const match = getParam(q, "match");

    description = `${title} - Bayse ${bayseLabel1} ${baysePrice1} / ${bayseLabel2} ${baysePrice2}; Kalshi Yes ${kalshiYes} / No ${kalshiNo}`;

    body = `
  <div class="wrap bayse-theme">
    <div class="hero-kicker">
      <span>Bayse x Kalshi</span>
      ${match ? `<span class="hero-fit">${esc(match)}% fit</span>` : ""}
    </div>
    <h1>${esc(title)}</h1>
    <p class="lead">Live comparison captured from an open Bayse market and the closest active Kalshi market.</p>

    <div class="grid">
      <section class="panel bayse">
        <div class="panel-top">
          <strong>Bayse</strong>
          <span>${esc(bayseMeta)}</span>
        </div>
        <h2>${esc(bayseTitle)}</h2>
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
      </section>

      <section class="panel kalshi">
        <div class="panel-top">
          <strong>Kalshi</strong>
          <span>${esc(kalshiMeta)}</span>
        </div>
        <h2>${esc(kalshiTitle)}</h2>
        <div class="odds-row">
          <div class="odd yes">
            <label>Yes</label>
            <span>${esc(kalshiYes)}</span>
          </div>
          <div class="odd no">
            <label>No</label>
            <span>${esc(kalshiNo)}</span>
          </div>
        </div>
      </section>
    </div>

    <div class="actions">
      ${secondaryUrl ? `<a class="btn btn-bayse" href="${esc(secondaryUrl)}" target="_blank" rel="noopener">Open Bayse</a>` : ""}
      <a class="btn btn-kalshi" href="${esc(primaryUrl)}" target="_blank" rel="noopener">View on Kalshi</a>
      <a class="btn btn-ghost" href="https://headlineodds.fun/scanner" target="_blank" rel="noopener">Try the Scanner</a>
    </div>
  </div>`;
  } else {
    const yes = formatCentsText(getParam(q, "yes", "—"));
    const no = formatCentsText(getParam(q, "no", "—"));
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
        radial-gradient(circle at bottom left, rgba(0,227,143,0.1), transparent 34%),
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
      background: rgba(8,10,9,0.82);
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
      margin: 0 0 18px;
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
    .hero-fit {
      background: rgba(0,227,143,0.08) !important;
      border-color: rgba(0,227,143,0.18) !important;
      color: #7af1be !important;
    }
    .lead {
      max-width: 720px;
      margin-bottom: 28px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .panel {
      border-radius: 22px;
      padding: 22px;
      border: 1px solid var(--border);
      background: var(--card);
    }
    .panel.bayse {
      background: linear-gradient(180deg, rgba(79,124,255,0.16), rgba(12,18,38,0.92));
      border-color: rgba(79,124,255,0.26);
    }
    .panel.kalshi {
      background: linear-gradient(180deg, rgba(0,227,143,0.09), rgba(8,10,9,0.92));
      border-color: rgba(0,227,143,0.18);
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
    }
    .panel.bayse .panel-top strong {
      color: #8db0ff;
    }
    .panel.kalshi .panel-top strong {
      color: #7af1be;
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
    .yes {
      background: rgba(0,227,143,0.11);
      border-color: rgba(0,227,143,0.2);
    }
    .yes span {
      color: var(--green);
    }
    .no span {
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
    .btn-kalshi {
      background: rgba(0,227,143,0.1);
      border-color: rgba(0,227,143,0.2);
      color: var(--green);
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
      .grid {
        grid-template-columns: 1fr;
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
