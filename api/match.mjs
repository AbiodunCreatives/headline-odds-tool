// Vercel serverless function - search and rank open Bayse events.

import { fetchOpenBayseEvents } from "./bayse.mjs";

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 8;
const SEARCH_PAGE_SIZE = 18;
const TRENDING_PAGE_SIZE = 18;

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseTimestamp(value) {
  const ts = Date.parse(value || "");
  return Number.isFinite(ts) ? ts : 0;
}

function getEventScore(event) {
  const hasImage = event.image_url ? 1 : 0;
  const marketCount = Array.isArray(event.markets) ? event.markets.length : 0;
  const pricedMarketCount = (event.markets || []).filter(
    market => market.outcome1_display != null && market.outcome2_display != null
  ).length;

  return (
    hasImage * 10_000_000_000 +
    pricedMarketCount * 1_000_000_000 +
    marketCount * 100_000_000 +
    toFiniteNumber(event.total_orders) * 10_000 +
    toFiniteNumber(event.liquidity) * 10 +
    toFiniteNumber(event.total_volume) +
    parseTimestamp(event.created_at) / 1_000_000_000
  );
}

function dedupeEvents(events) {
  const seen = new Set();
  const unique = [];

  for (const event of events) {
    const key = event.id || event.slug || event.url || event.title;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(event);
  }

  return unique;
}

async function getBayseEvents({ keyword = "", pageSize = SEARCH_PAGE_SIZE } = {}) {
  const events = await fetchOpenBayseEvents({
    keyword,
    fetchImpl: fetch,
    pageSize,
  });

  const uniqueEvents = dedupeEvents(events)
    .sort((a, b) => getEventScore(b) - getEventScore(a));

  return {
    bayseCount: uniqueEvents.length,
    results: uniqueEvents.slice(0, MAX_RESULTS),
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    try {
      const data = await getBayseEvents({ pageSize: TRENDING_PAGE_SIZE });
      return res.json({ ok: true, kind: "trending", ...data });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method !== "POST") return res.status(405).json({ error: "GET or POST only" });

  const query = String(req.body?.headline || "").trim();
  if (query.length < MIN_QUERY_LENGTH) {
    return res.status(400).json({ error: "Keyword too short" });
  }

  try {
    const data = await getBayseEvents({ keyword: query, pageSize: SEARCH_PAGE_SIZE });
    return res.json({ ok: true, kind: "search", query, ...data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
