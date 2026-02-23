// Vercel serverless function — matches a headline against live Kalshi markets

const KALSHI_API = "https://api.elections.kalshi.com/trade-api/v2";
const CACHE_TTL = 5 * 60 * 1000;
let cache = { data: [], ts: 0 };

const STOP_WORDS = new Set([
  "the","a","an","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","can","shall",
  "to","of","in","for","on","with","at","by","from","as","into","through","during",
  "before","after","above","below","between","out","off","over","under","again",
  "further","then","once","here","there","when","where","why","how","all","both",
  "each","few","more","most","other","some","such","no","nor","not","only","own",
  "same","so","than","too","very","just","because","but","and","or","if","while",
  "about","up","its","it","this","that","these","those","he","she","they","them",
  "his","her","their","what","which","who","whom","new","says","said","report",
  "reports","according","also","get","gets","got","going","make","makes","made",
  "take","takes","look","year","years","day","days","week","weeks","month","months",
  "time","way","us","back","first","last","next","now","still","even","many","much",
  "well","long","right","left","big","old","high","low",
]);

function extractKeywords(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function scoreMatch(headlineKw, market) {
  const marketText = [market.title, market.subtitle, market.event_title, market.category]
    .join(" ").toLowerCase();
  const marketKw = new Set(extractKeywords(marketText));

  let matches = 0;
  const matched = [];
  for (const kw of headlineKw) {
    if (marketKw.has(kw) || marketText.includes(kw)) {
      matches++;
      matched.push(kw);
    }
  }
  if (matches === 0) return 0;

  const bonus = matched.reduce((sum, kw) => sum + (kw.length > 5 ? 0.1 : 0), 0);

  let bigramBonus = 0;
  for (let i = 0; i < headlineKw.length - 1; i++) {
    const bg = `${headlineKw[i]} ${headlineKw[i + 1]}`;
    if (bg.length > 6 && marketText.includes(bg)) {
      bigramBonus = 0.2;
      break;
    }
  }

  return matches / headlineKw.length + bonus + bigramBonus;
}

async function getAllMarkets() {
  const now = Date.now();
  if (cache.data.length && now - cache.ts < CACHE_TTL) return cache.data;

  const allMarkets = [];
  let cursor = null;

  for (let i = 0; i < 4; i++) {
    const params = new URLSearchParams({
      limit: "200", status: "open", with_nested_markets: "true",
    });
    if (cursor) params.set("cursor", cursor);

    const res = await fetch(`${KALSHI_API}/events?${params}`);
    if (!res.ok) throw new Error(`Kalshi API ${res.status}`);
    const json = await res.json();

    for (const event of json.events || []) {
      for (const m of event.markets || []) {
        const close = m.close_time || m.expected_expiration_time;
        if (close && new Date(close).getTime() < Date.now()) continue;

        const seriesTicker = event.series_ticker || event.event_ticker || "";
        allMarkets.push({
          ticker: m.ticker,
          title: m.title || event.title,
          subtitle: m.subtitle || event.sub_title || "",
          category: event.category || "",
          event_title: event.title || "",
          yes_bid: m.yes_bid,
          no_bid: m.no_bid,
          last_price: m.last_price,
          volume: m.volume,
          close_time: close,
          url: seriesTicker
            ? `https://kalshi.com/markets/${seriesTicker}`
            : m.ticker
              ? `https://kalshi.com/markets/${m.ticker}`
              : "https://kalshi.com/markets",
        });
      }
    }

    cursor = json.cursor;
    if (!cursor || (json.events || []).length < 200) break;
  }

  cache = { data: allMarkets, ts: Date.now() };
  return allMarkets;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { headline } = req.body || {};
  if (!headline || typeof headline !== "string" || headline.trim().length < 5) {
    return res.status(400).json({ error: "Headline too short" });
  }

  try {
    const markets = await getAllMarkets();
    const headlineKw = extractKeywords(headline.trim());
    if (headlineKw.length < 1) {
      return res.json({ ok: true, results: [], marketCount: markets.length });
    }

    const results = markets
      .map(m => ({ ...m, score: scoreMatch(headlineKw, m) }))
      .filter(m => m.score > 0.15)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ score, category, event_title, subtitle, ...rest }) => ({
        ...rest,
        subtitle,
      }));

    return res.json({ ok: true, results, marketCount: markets.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
