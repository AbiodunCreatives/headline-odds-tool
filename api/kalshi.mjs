export const KALSHI_API = "https://api.elections.kalshi.com/trade-api/v2";

function parseFiniteNumber(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function fixedPointToNumber(value) {
  return parseFiniteNumber(value);
}

export function dollarsToCents(value) {
  const dollars = parseFiniteNumber(value);
  return dollars == null ? null : Math.round(dollars * 100);
}

function clampCents(value) {
  if (value == null) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function dollarsFromLegacyCents(value) {
  const cents = parseFiniteNumber(value);
  return cents == null ? null : cents / 100;
}

function firstNumber(...values) {
  for (const value of values) {
    if (value == null || Number.isNaN(value)) continue;
    return value;
  }
  return null;
}

function parseTimestamp(value) {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

export function formatContracts(value) {
  const amount = parseFiniteNumber(value);
  if (amount == null) return null;

  return `${new Intl.NumberFormat("en-US", {
    notation: amount >= 1000 ? "compact" : "standard",
    maximumFractionDigits: amount >= 1000 ? 1 : amount >= 100 ? 0 : 2,
  }).format(amount)} contracts`;
}

export function formatDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getCloseTime(market) {
  return (
    market.close_time ||
    market.expected_expiration_time ||
    market.expiration_time ||
    market.latest_expiration_time ||
    null
  );
}

export function buildMarketUrl(market, event = {}) {
  if (market.ticker) return `https://kalshi.com/markets/${String(market.ticker).toLowerCase()}`;
  const seriesTicker = event.series_ticker || market.series_ticker || "";
  if (seriesTicker) return `https://kalshi.com/markets/${String(seriesTicker).toLowerCase()}`;
  return "https://kalshi.com/markets";
}

export function normalizeBinaryMarket(market, event = {}) {
  const closeTime = getCloseTime(market);
  const yesBid = firstNumber(dollarsToCents(market.yes_bid_dollars), parseFiniteNumber(market.yes_bid));
  const noBid = firstNumber(dollarsToCents(market.no_bid_dollars), parseFiniteNumber(market.no_bid));
  const yesAsk = firstNumber(dollarsToCents(market.yes_ask_dollars), parseFiniteNumber(market.yes_ask));
  const noAsk = firstNumber(dollarsToCents(market.no_ask_dollars), parseFiniteNumber(market.no_ask));
  const lastPrice = firstNumber(dollarsToCents(market.last_price_dollars), parseFiniteNumber(market.last_price));
  const displayYes = clampCents(firstNumber(
    yesBid != null && yesAsk != null ? (yesBid + yesAsk) / 2 : null,
    lastPrice,
    yesBid,
    noBid != null ? 100 - noBid : null,
    yesAsk,
    noAsk != null ? 100 - noAsk : null
  ));
  const displayNo = displayYes == null ? null : 100 - displayYes;

  return {
    ticker: market.ticker,
    series_ticker: event.series_ticker || market.series_ticker || "",
    event_ticker: market.event_ticker || event.event_ticker || "",
    title: market.title || event.title || "",
    subtitle: market.subtitle || market.yes_sub_title || event.sub_title || "",
    category: event.category || market.category || "",
    event_title: market.event_title || event.title || "",
    status: market.status || event.status || "",
    yes_bid: yesBid,
    no_bid: noBid,
    yes_ask: yesAsk,
    no_ask: noAsk,
    last_price: lastPrice,
    yes_display: displayYes,
    no_display: displayNo,
    volume: firstNumber(parseFiniteNumber(market.volume_fp), parseFiniteNumber(market.volume)),
    volume_24h: firstNumber(parseFiniteNumber(market.volume_24h_fp), parseFiniteNumber(market.volume_24h)),
    open_interest: firstNumber(parseFiniteNumber(market.open_interest_fp), parseFiniteNumber(market.open_interest)),
    liquidity_dollars: firstNumber(
      parseFiniteNumber(market.liquidity_dollars),
      dollarsFromLegacyCents(market.liquidity)
    ),
    close_time: closeTime,
    close: formatDate(closeTime),
    updated_time: market.updated_time || event.updated_time || null,
    url: buildMarketUrl(market, event),
  };
}

export function compareByActivity(a, b) {
  const comparisons = [
    (b.volume_24h ?? -Infinity) - (a.volume_24h ?? -Infinity),
    (b.volume ?? -Infinity) - (a.volume ?? -Infinity),
    (b.open_interest ?? -Infinity) - (a.open_interest ?? -Infinity),
    (b.liquidity_dollars ?? -Infinity) - (a.liquidity_dollars ?? -Infinity),
    (parseTimestamp(b.updated_time) ?? -Infinity) - (parseTimestamp(a.updated_time) ?? -Infinity),
  ];

  return comparisons.find(value => value !== 0) || 0;
}

export async function fetchOpenMarkets({
  fetchImpl = fetch,
  pageLimit = 4,
  pageSize = 200,
} = {}) {
  const markets = [];
  let cursor = null;

  for (let page = 0; page < pageLimit; page++) {
    const params = new URLSearchParams({
      limit: String(pageSize),
      status: "open",
      with_nested_markets: "true",
    });
    if (cursor) params.set("cursor", cursor);

    const response = await fetchImpl(`${KALSHI_API}/events?${params}`);
    if (!response.ok) {
      const body = await response.text().catch(() => "<no body>");
      console.error("Kalshi API error", response.status, body);
      throw new Error(`Kalshi API ${response.status}`);
    }

    const json = await response.json();
    for (const event of json.events || []) {
      for (const market of event.markets || []) {
        const normalized = normalizeBinaryMarket(market, event);
        const closeTs = parseTimestamp(normalized.close_time);
        if (!normalized.title) continue;
        if (closeTs != null && closeTs < Date.now()) continue;
        markets.push(normalized);
      }
    }

    cursor = json.cursor;
    if (!cursor || (json.events || []).length < pageSize) break;
  }

  return markets;
}
