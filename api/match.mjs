// Vercel serverless function - search open Bayse markets only.

import { searchOpenBayseMarkets } from "./bayse.mjs";

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 8;
const SEARCH_PAGE_SIZE = 24;

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getMarketScore(market) {
  const hasTwoPrices = market.outcome1_display != null && market.outcome2_display != null ? 1 : 0;
  return (
    hasTwoPrices * 1_000_000_000 +
    toFiniteNumber(market.total_volume) * 1_000_000 +
    toFiniteNumber(market.liquidity) * 1_000 +
    toFiniteNumber(market.total_orders)
  );
}

function dedupeMarkets(markets) {
  const seen = new Set();
  const unique = [];

  for (const market of markets) {
    const key = market.market_id || market.id || market.slug || market.url || market.title;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(market);
  }

  return unique;
}

async function searchBayseMarkets(query) {
  const markets = await searchOpenBayseMarkets({
    keyword: query,
    fetchImpl: fetch,
    pageSize: SEARCH_PAGE_SIZE,
  });

  const uniqueMarkets = dedupeMarkets(markets)
    .sort((a, b) => getMarketScore(b) - getMarketScore(a));

  return {
    bayseCount: uniqueMarkets.length,
    results: uniqueMarkets.slice(0, MAX_RESULTS),
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
    const data = await searchBayseMarkets(query);
    return res.json({ ok: true, query, ...data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
