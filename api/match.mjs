// Vercel serverless function - search open Bayse markets and find the closest live Kalshi crossover
// Uses Cloudflare Workers AI (bge-small-en-v1.5) for semantic market matching

import { searchOpenBayseMarkets } from "./bayse.mjs";
import { fetchOpenMarkets } from "./kalshi.mjs";

const EMBED_API = "https://headline-embed.abiodunfaboyode007.workers.dev/";
const KALSHI_CACHE_TTL = 60 * 1000;
const EMBED_CACHE_TTL = 30 * 60 * 1000;
const MIN_QUERY_LENGTH = 2;
const MIN_MATCH_SCORE = 0.33;
const MAX_RESULTS = 8;

let kalshiCache = { data: [], ts: 0 };
let kalshiEmbedCache = { key: "", vectors: [], ts: 0 };

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

function buildKalshiEmbeddingText(market) {
  return [market.title, market.subtitle, market.event_title, market.category]
    .filter(Boolean)
    .join(" - ");
}

function buildBayseEmbeddingText(market) {
  return market.search_text || [
    market.title,
    market.market_title,
    market.description,
    market.rules,
    market.category,
    market.subcategory,
  ].filter(Boolean).join(" - ");
}

async function getAllKalshiMarkets() {
  const now = Date.now();
  if (kalshiCache.data.length && now - kalshiCache.ts < KALSHI_CACHE_TTL) {
    return kalshiCache.data;
  }

  const data = await fetchOpenMarkets({ fetchImpl: fetch, pageLimit: 4, pageSize: 200 });
  kalshiCache = { data, ts: Date.now() };
  return data;
}

async function getKalshiEmbeddings(markets) {
  const texts = markets.map(buildKalshiEmbeddingText);
  const key = texts.join("\n");
  const now = Date.now();

  if (
    kalshiEmbedCache.key === key &&
    kalshiEmbedCache.vectors.length === texts.length &&
    now - kalshiEmbedCache.ts < EMBED_CACHE_TTL
  ) {
    return kalshiEmbedCache.vectors;
  }

  const vectors = await getEmbeddings(texts);
  kalshiEmbedCache = { key, vectors, ts: Date.now() };
  return vectors;
}

function pickBestKalshiMatch(bayseVector, kalshiMarkets, kalshiVectors, usedTickers) {
  let bestIndex = -1;
  let bestScore = -Infinity;

  for (let i = 0; i < kalshiMarkets.length; i++) {
    const kalshi = kalshiMarkets[i];
    if (!kalshi?.ticker || usedTickers.has(kalshi.ticker)) continue;

    const score = cosineSim(bayseVector, kalshiVectors[i]);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  if (bestIndex === -1 || bestScore < MIN_MATCH_SCORE) return null;
  return { market: kalshiMarkets[bestIndex], score: bestScore };
}

async function matchBayseToKalshi(query) {
  const [bayseMarkets, kalshiMarkets] = await Promise.all([
    searchOpenBayseMarkets({ keyword: query, fetchImpl: fetch, pageSize: 12 }),
    getAllKalshiMarkets(),
  ]);

  if (!bayseMarkets.length || !kalshiMarkets.length) {
    return {
      bayseCount: bayseMarkets.length,
      kalshiMarketCount: kalshiMarkets.length,
      results: [],
    };
  }

  const [bayseVectors, kalshiVectors] = await Promise.all([
    getEmbeddings(bayseMarkets.map(buildBayseEmbeddingText)),
    getKalshiEmbeddings(kalshiMarkets),
  ]);

  const usedTickers = new Set();
  const pairs = [];

  for (let i = 0; i < bayseMarkets.length; i++) {
    const best = pickBestKalshiMatch(bayseVectors[i], kalshiMarkets, kalshiVectors, usedTickers);
    if (!best) continue;

    usedTickers.add(best.market.ticker);
    pairs.push({
      bayse: bayseMarkets[i],
      kalshi: best.market,
      similarity: Math.round(best.score * 100),
      score: best.score,
    });
  }

  pairs.sort((a, b) => b.score - a.score);

  return {
    bayseCount: bayseMarkets.length,
    kalshiMarketCount: kalshiMarkets.length,
    results: pairs.slice(0, MAX_RESULTS).map(({ score, ...rest }) => rest),
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const query = String(req.body?.headline || "").trim();
  if (query.length < MIN_QUERY_LENGTH) {
    return res.status(400).json({ error: "Keyword too short" });
  }

  try {
    const data = await matchBayseToKalshi(query);
    return res.json({ ok: true, query, ...data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
