// Vercel serverless function — matches a headline against live Kalshi markets
// Uses Cloudflare Workers AI (bge-small-en-v1.5) for semantic embedding matching

const KALSHI_API = "https://api.elections.kalshi.com/trade-api/v2";
const EMBED_API = "https://headline-embed.abiodunfaboyode007.workers.dev/";
const CACHE_TTL = 5 * 60 * 1000;
let marketCache = { data: [], ts: 0 };
let embedCache = { vectors: [], ts: 0 }; // cache market embeddings too

function cosineSim(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function getEmbeddings(texts) {
  // CF Worker accepts up to 100 texts at a time
  const allEmbeddings = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const res = await fetch(EMBED_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: batch }),
    });
    if (!res.ok) throw new Error(`Embed API ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    allEmbeddings.push(...json.embeddings);
  }
  return allEmbeddings;
}

async function getAllMarkets() {
  const now = Date.now();
  if (marketCache.data.length && now - marketCache.ts < CACHE_TTL) {
    return marketCache.data;
  }

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

  marketCache = { data: allMarkets, ts: Date.now() };
  // Invalidate embed cache when markets refresh
  embedCache = { vectors: [], ts: 0 };
  return allMarkets;
}

async function getMarketEmbeddings(markets) {
  const now = Date.now();
  if (embedCache.vectors.length === markets.length && now - embedCache.ts < CACHE_TTL) {
    return embedCache.vectors;
  }

  // Build a searchable text for each market
  const texts = markets.map(m =>
    [m.title, m.subtitle, m.event_title].filter(Boolean).join(" — ")
  );

  const vectors = await getEmbeddings(texts);
  embedCache = { vectors, ts: Date.now() };
  return vectors;
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
    if (markets.length === 0) {
      return res.json({ ok: true, results: [], marketCount: 0 });
    }

    // Get embeddings: headline first, then all markets
    const [headlineEmbed] = await getEmbeddings([headline.trim()]);
    const marketEmbeds = await getMarketEmbeddings(markets);

    // Score by cosine similarity
    const results = markets
      .map((m, i) => ({ ...m, score: cosineSim(headlineEmbed, marketEmbeds[i]) }))
      .filter(m => m.score > 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ score, category, event_title, ...rest }) => ({
        ...rest,
        similarity: Math.round(score * 100),
      }));

    return res.json({ ok: true, results, marketCount: markets.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
