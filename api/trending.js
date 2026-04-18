// Vercel serverless function - returns live, high-activity Kalshi markets
// GET -> { ok, results: [{ activity, context, market }] }

import {
  compareByActivity,
  fetchOpenMarkets,
  formatContracts,
} from "./kalshi.mjs";

const CACHE_TTL = 60 * 1000;
let trendCache = { data: null, ts: 0 };

function hasLivePrice(market) {
  return market.yes_display !== null && market.no_display !== null;
}

function buildActivityLabel(market) {
  if (market.volume_24h != null && market.volume_24h > 0) {
    return `24h volume ${formatContracts(market.volume_24h)}`;
  }
  if (market.volume != null && market.volume > 0) {
    return `total volume ${formatContracts(market.volume)}`;
  }
  if (market.open_interest != null && market.open_interest > 0) {
    return `open interest ${formatContracts(market.open_interest)}`;
  }
  if (market.liquidity_dollars != null && market.liquidity_dollars > 0) {
    return `liquidity $${Math.round(market.liquidity_dollars).toLocaleString()}`;
  }
  return "live open market";
}

function buildContextLabel(market) {
  const parts = [market.category, market.subtitle].filter(Boolean);
  return parts.join(" - ") || "Live Kalshi market";
}

async function getTrendingMarkets() {
  const now = Date.now();
  if (trendCache.data && now - trendCache.ts < CACHE_TTL) {
    return trendCache.data;
  }

  const seen = new Set();
  const data = (await fetchOpenMarkets({ fetchImpl: fetch, pageLimit: 4, pageSize: 200 }))
    .filter(hasLivePrice)
    .sort(compareByActivity)
    .filter(market => {
      if (!market.ticker || seen.has(market.ticker)) return false;
      seen.add(market.ticker);
      return true;
    })
    .slice(0, 100)
    .map(market => ({
      source: "Kalshi",
      headline: buildContextLabel(market),
      activity: buildActivityLabel(market),
      context: buildContextLabel(market),
      market,
    }));

  trendCache = { data, ts: Date.now() };
  return data;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const force = req.query.force === "1";
  const offset = parseInt(req.query.offset, 10) || 0;
  const limit = parseInt(req.query.limit, 10) || 20;

  try {
    if (force) {
      trendCache = { data: null, ts: 0 };
    }

    const trending = await getTrendingMarkets();
    const page = trending.slice(offset, offset + limit);
    return res.json({ ok: true, results: page, total: trending.length, cached: !force });
  } catch (err) {
    if (trendCache.data) {
      const page = trendCache.data.slice(offset, offset + limit);
      return res.json({
        ok: true,
        results: page,
        total: trendCache.data.length,
        stale: true,
        error: err.message,
      });
    }
    return res.status(500).json({ ok: false, error: err.message });
  }
}
