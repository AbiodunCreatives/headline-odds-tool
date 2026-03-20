// Vercel serverless function — fetches trending headlines from RSS, matches against Kalshi markets
// GET → { ok, results: [{ headline, source, similarity, market: { title, yes_bid, no_bid, vol, close, url } }] }
// Cached 10 minutes in-memory

const KALSHI_API = "https://api.elections.kalshi.com/trade-api/v2";
const EMBED_API  = "https://headline-embed.abiodunfaboyode007.workers.dev/";
const CACHE_TTL  = 10 * 60 * 1000;

const RSS_FEEDS = [
  // US News
  { url: "https://feeds.npr.org/1001/rss.xml",           source: "NPR"     },
  { url: "https://rss.cnn.com/rss/edition.rss",          source: "CNN"     },
  { url: "https://feeds.foxnews.com/foxnews/latest",     source: "Fox News" },
  { url: "https://feeds.nytimes.com/nyt/rss/homepage",   source: "NY Times" },
  { url: "https://feeds.washingtonpost.com/rss/world",   source: "Wash Post" },
  { url: "https://feeds.reuters.com/reuters/topNews",    source: "Reuters" },
  { url: "https://feeds.bbci.co.uk/news/rss.xml",        source: "BBC"     },
  
  // Crypto & Tech
  { url: "https://cointelegraph.com/rss",                source: "Cointelegraph" },
  { url: "https://coindesk.com/arc/outboundfeeds/rss/",  source: "CoinDesk" },
  
  // Politics
  { url: "https://feeds.npr.org/1014/rss.xml",           source: "NPR Politics" },
  
  // Sports
  { url: "https://www.espn.com/espn/rss/news",           source: "ESPN"    },
  { url: "https://rss.cnn.com/rss/edition_sport.rss",    source: "CNN Sports" },
  
  // Business
  { url: "https://feeds.bloomberg.com/markets/news.rss", source: "Bloomberg" },
  { url: "https://feeds.foxbusiness.com/foxbusiness/latest", source: "Fox Business" },
];

let trendCache  = { data: null, ts: 0 };
let marketCache = { data: [],   ts: 0 };
let embedCache  = { vectors: [], ts: 0 };

// ── helpers ──────────────────────────────────────────────────────────────────

function cosineSim(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function parseRssTitles(xml) {
  const out = [];
  const itemRx  = /<item[\s\S]*?<\/item>/g;
  const titleRx = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/;
  for (const item of (xml.match(itemRx) || []).slice(0, 10)) {
    const m = item.match(titleRx);
    if (!m?.[1]) continue;
    const t = m[1]
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    if (t.length > 15) out.push(t);
  }
  return out;
}

async function fetchHeadlines() {
  const settled = await Promise.allSettled(
    RSS_FEEDS.map(async ({ url, source }) => {
      const res = await fetch(url, {
        headers: { "User-Agent": "HeadlineOdds/1.0 (+https://headlineodds.fun)" },
        signal: AbortSignal.timeout(4500),
      });
      if (!res.ok) return [];
      const xml = await res.text();
      return parseRssTitles(xml).map(headline => ({ headline, source }));
    })
  );
  return settled.flatMap(r => r.status === "fulfilled" ? r.value : []);
}

async function getMarkets() {
  const now = Date.now();
  if (marketCache.data.length && now - marketCache.ts < CACHE_TTL) return marketCache.data;

  // One page (200 markets) — enough for fast matching, avoids timeout on cold start
  const params = new URLSearchParams({ limit: "200", status: "open", with_nested_markets: "true" });
  const res = await fetch(`${KALSHI_API}/events?${params}`);
  if (!res.ok) throw new Error(`Kalshi API ${res.status}`);
  const json = await res.json();

  const markets = [];
  for (const event of json.events || []) {
    for (const m of event.markets || []) {
      const close = m.close_time || m.expected_expiration_time;
      if (close && new Date(close).getTime() < Date.now()) continue;
      const seriesTicker = event.series_ticker || event.event_ticker || "";
      markets.push({
        ticker: m.ticker,
        title: m.title || event.title,
        subtitle: m.subtitle || event.sub_title || "",
        event_title: event.title || "",
        yes_bid: m.yes_bid,
        no_bid: m.no_bid,
        yes_ask: m.yes_ask,
        no_ask: m.no_ask,
        last_price: m.last_price,
        volume: m.volume,
        close_time: close,
        url: seriesTicker
          ? `https://kalshi.com/markets/${seriesTicker}`
          : `https://kalshi.com/markets/${m.ticker || ""}`,
      });
    }
  }

  marketCache = { data: markets, ts: Date.now() };
  embedCache  = { vectors: [], ts: 0 };
  return markets;
}

async function getEmbeddings(texts) {
  const all = [];
  for (let i = 0; i < texts.length; i += 100) {
    const res = await fetch(EMBED_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: texts.slice(i, i + 100) }),
    });
    if (!res.ok) throw new Error(`Embed API ${res.status}`);
    const j = await res.json();
    if (j.error) throw new Error(j.error);
    all.push(...j.embeddings);
  }
  return all;
}

async function getMarketEmbeddings(markets) {
  const now = Date.now();
  if (embedCache.vectors.length === markets.length && now - embedCache.ts < CACHE_TTL) {
    return embedCache.vectors;
  }
  const texts = markets.map(m =>
    [m.title, m.subtitle, m.event_title].filter(Boolean).join(" — ")
  );
  const vectors = await getEmbeddings(texts);
  embedCache = { vectors, ts: Date.now() };
  return vectors;
}

// ── handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const force = req.query.force === "1";
  const offset = parseInt(req.query.offset) || 0;
  const limit  = parseInt(req.query.limit)  || 20;

  if (!force && trendCache.data && Date.now() - trendCache.ts < CACHE_TTL) {
    const page = trendCache.data.slice(offset, offset + limit);
    return res.json({ ok: true, results: page, total: trendCache.data.length, cached: true });
  }

  try {
    const [headlines, markets] = await Promise.all([fetchHeadlines(), getMarkets()]);

    if (!headlines.length || !markets.length) {
      // If we have stale data, return it rather than an empty array
      if (trendCache.data) return res.json({ ok: true, results: trendCache.data, stale: true });
      return res.json({ ok: true, results: [] });
    }

    const [headlineVectors, marketVectors] = await Promise.all([
      getEmbeddings(headlines.map(h => h.headline)),
      getMarketEmbeddings(markets),
    ]);

    // For each headline find best-matching market
    const pairs = [];
    for (let i = 0; i < headlines.length; i++) {
      let bestSim = 0, bestIdx = -1;
      for (let j = 0; j < markets.length; j++) {
        const s = cosineSim(headlineVectors[i], marketVectors[j]);
        if (s > bestSim) { bestSim = s; bestIdx = j; }
      }
      if (bestSim > 0.38 && bestIdx >= 0) {
        const m = markets[bestIdx];
        const priceForVolume = Number(m.yes_bid ?? m.yes_ask ?? m.last_price ?? 50);
        const vol = m.volume != null
          ? `$${Math.round(m.volume * priceForVolume / 100).toLocaleString()}`
          : null;
        const close = m.close_time
          ? new Date(m.close_time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : null;
        pairs.push({
          headline: headlines[i].headline,
          source: headlines[i].source,
          similarity: Math.round(bestSim * 100),
          market: {
            title: m.title,
            yes_bid: m.yes_bid,
            no_bid: m.no_bid,
            yes_ask: m.yes_ask,
            no_ask: m.no_ask,
            last_price: m.last_price,
            vol,
            close,
            url: m.url,
          },
        });
      }
    }

    // Deduplicate — one market per entry, best headline wins
    const seen = new Set();
    const deduped = pairs
      .sort((a, b) => b.similarity - a.similarity)
      .filter(p => { if (seen.has(p.market.title)) return false; seen.add(p.market.title); return true; })
      .slice(0, 50);

    trendCache = { data: deduped, ts: Date.now() };

    const page = deduped.slice(offset, offset + limit);
    return res.json({ ok: true, results: page, total: deduped.length });
  } catch (err) {
    console.error("trending error", err);
    // Return stale cache rather than a hard error if we have previous data
    if (trendCache.data) {
      return res.json({ ok: true, results: trendCache.data, stale: true, error: err.message });
    }
    return res.status(500).json({ ok: false, error: err.message });
  }
}
