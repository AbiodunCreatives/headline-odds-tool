// Vercel serverless function — matches a headline against live Kalshi markets
// Uses Cloudflare Workers AI (bge-small-en-v1.5) for semantic embedding matching

import { fetchOpenMarkets } from "./kalshi.mjs";

const EMBED_API = "https://headline-embed.abiodunfaboyode007.workers.dev/";
const MARKET_CACHE_TTL = 60 * 1000;
const EMBED_CACHE_TTL = 30 * 60 * 1000;

let marketCache = { data: [], ts: 0 };
let embedCache = { key: "", vectors: [], ts: 0 };

function cosineSim(a, b) {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function getEmbeddings(texts) {
  const allEmbeddings = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const res = await fetch(EMBED_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: batch }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "<no body>");
      console.error("Embed API error", res.status, body);
      throw new Error(`Embed API ${res.status}`);
    }
    const json = await res.json();
    if (json.error) {
      console.error("Embed API returned error field", json.error);
      throw new Error(json.error);
    }
    allEmbeddings.push(...json.embeddings);
  }
  return allEmbeddings;
}

async function getAllMarkets() {
  const now = Date.now();
  if (marketCache.data.length && now - marketCache.ts < MARKET_CACHE_TTL) {
    return marketCache.data;
  }

  const allMarkets = await fetchOpenMarkets({ fetchImpl: fetch, pageLimit: 4, pageSize: 200 });

  marketCache = { data: allMarkets, ts: Date.now() };
  return allMarkets;
}

async function getMarketEmbeddings(markets) {
  const texts = markets.map(m =>
    [m.title, m.subtitle, m.event_title].filter(Boolean).join(" - ")
  );
  const key = texts.join("\n");
  const now = Date.now();

  if (embedCache.key === key && embedCache.vectors.length === texts.length && now - embedCache.ts < EMBED_CACHE_TTL) {
    return embedCache.vectors;
  }

  const vectors = await getEmbeddings(texts);
  embedCache = { key, vectors, ts: Date.now() };
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

    const [headlineEmbed] = await getEmbeddings([headline.trim()]);
    const marketEmbeds = await getMarketEmbeddings(markets);

    const results = markets
      .map((m, i) => ({ ...m, score: cosineSim(headlineEmbed, marketEmbeds[i]) }))
      .filter(m => m.score > 0.35 && m.yes_display !== null && m.no_display !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ score, category, event_title, ...rest }) => ({
        ...rest,
        similarity: Math.round(score * 100),
      }));

    return res.json({ ok: true, results, marketCount: markets.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
