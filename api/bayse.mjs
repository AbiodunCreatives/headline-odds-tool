export const BAYSE_API = "https://relay.bayse.markets";
export const BAYSE_WEB_URL = "https://www.bayse.markets";
export const BAYSE_TRADE_URL = `${BAYSE_WEB_URL}/trade`;

function parseFiniteNumber(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstNumber(...values) {
  for (const value of values) {
    if (value == null || Number.isNaN(value)) continue;
    return value;
  }
  return null;
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function firstText(...values) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return "";
}

function normalizeDisplayPrice(value) {
  const price = parseFiniteNumber(value);
  if (price == null) return null;
  if (price <= 1) return Math.max(0, Math.min(100, Math.round(price * 100)));
  return Math.max(0, Math.min(100, Math.round(price)));
}

function buildBayseUrl(event, market = null, side = "") {
  const eventId = cleanText(event?.id);
  const marketId = cleanText(market?.id);
  const params = new URLSearchParams();

  if (marketId) params.set("marketId", marketId);
  if (side) {
    params.set("tradeType", "BUY");
    params.set("outcome", side.toUpperCase());
  }

  const query = params.toString();
  if (!eventId) {
    return query ? `${BAYSE_TRADE_URL}?${query}` : BAYSE_TRADE_URL;
  }

  const base = `${BAYSE_WEB_URL}/market/${eventId}`;
  return query ? `${base}?${query}` : base;
}

function buildSubtitle(eventTitle, marketTitle, description) {
  const parts = [];
  if (marketTitle && marketTitle !== eventTitle) parts.push(marketTitle);
  if (description) parts.push(description);
  return parts.join(" - ");
}

function pickEventCloseTime(event) {
  return firstText(event.closingDate, event.resolutionDate) || null;
}

export function normalizeBayseMarket(event = {}, market = {}) {
  const eventTitle = firstText(event.title, market.title);
  const marketTitle = firstText(market.title, event.title);
  const description = cleanText(event.description);
  const title = eventTitle || marketTitle;

  const outcome1Price = normalizeDisplayPrice(
    firstNumber(market.outcome1Price, market.yesBuyPrice, market.yesPriceForEstimate)
  );
  const outcome2Price = normalizeDisplayPrice(
    firstNumber(market.outcome2Price, market.noBuyPrice, market.noPriceForEstimate)
  );

  const normalized = {
    id: `${event.id || "event"}:${market.id || "market"}`,
    event_id: cleanText(event.id),
    market_id: cleanText(market.id),
    slug: cleanText(event.slug),
    title,
    event_title: eventTitle,
    market_title: marketTitle,
    subtitle: buildSubtitle(eventTitle, marketTitle, description),
    description,
    category: cleanText(event.category),
    subcategory: cleanText(event.subcategory),
    engine: cleanText(event.engine || market.engine),
    status: cleanText(market.status || event.status),
    close_time: event.closingDate || null,
    closing_date: event.closingDate || null,
    resolution_date: event.resolutionDate || null,
    liquidity: firstNumber(parseFiniteNumber(event.liquidity), parseFiniteNumber(market.liquidity)),
    total_volume: firstNumber(parseFiniteNumber(event.totalVolume), parseFiniteNumber(market.totalVolume)),
    total_orders: firstNumber(parseFiniteNumber(market.totalOrders), parseFiniteNumber(event.totalOrders)),
    supported_currencies: Array.isArray(event.supportedCurrencies) ? event.supportedCurrencies : [],
    outcome1_label: firstText(market.outcome1Label, "Outcome 1"),
    outcome2_label: firstText(market.outcome2Label, "Outcome 2"),
    outcome1_display: outcome1Price,
    outcome2_display: outcome2Price,
    rules: cleanText(market.rules),
    image_url: firstText(market.imageUrl, event.imageUrl),
    image_128_url: firstText(market.image128Url, event.image128Url),
    url: buildBayseUrl(event, market),
    yes_url: buildBayseUrl(event, market, "yes"),
    no_url: buildBayseUrl(event, market, "no"),
  };

  normalized.search_text = [
    normalized.title,
    normalized.market_title,
    normalized.description,
    normalized.rules,
    normalized.category,
    normalized.subcategory,
    normalized.engine,
  ].filter(Boolean).join(" - ");

  return normalized;
}

export function normalizeBayseEvent(event = {}) {
  const normalizedMarkets = (event.markets || [])
    .map(market => normalizeBayseMarket(event, market))
    .filter(market => market.title && (!market.status || market.status === "open"));

  const normalized = {
    id: cleanText(event.id),
    slug: cleanText(event.slug),
    title: firstText(event.title),
    description: cleanText(event.description),
    category: cleanText(event.category),
    subcategory: cleanText(event.subcategory),
    engine: cleanText(event.engine),
    status: cleanText(event.status),
    type: cleanText(event.type),
    image_url: firstText(event.imageUrl),
    image_128_url: firstText(event.image128Url, event.imageUrl),
    additional_context: cleanText(event.additionalContext),
    close_time: pickEventCloseTime(event),
    closing_date: firstText(event.closingDate) || null,
    resolution_date: firstText(event.resolutionDate) || null,
    created_at: firstText(event.createdAt) || null,
    liquidity: parseFiniteNumber(event.liquidity),
    total_volume: parseFiniteNumber(event.totalVolume),
    total_orders: parseFiniteNumber(event.totalOrders),
    supported_currencies: Array.isArray(event.supportedCurrencies) ? event.supportedCurrencies : [],
    url: buildBayseUrl(event),
    markets: normalizedMarkets,
  };

  normalized.search_text = [
    normalized.title,
    normalized.description,
    normalized.category,
    normalized.subcategory,
    normalized.engine,
    ...normalized.markets.map(market => market.search_text),
  ].filter(Boolean).join(" - ");

  return normalized;
}

export async function fetchOpenBayseEvents({
  keyword = "",
  fetchImpl = fetch,
  pageSize = 12,
  currency = "NGN",
  trending = false,
} = {}) {
  const term = cleanText(keyword);
  const params = new URLSearchParams({
    status: "open",
    currency,
    limit: String(pageSize),
  });

  if (trending) params.set("trending", "true");
  if (term) params.set("keyword", term);

  const response = await fetchImpl(`${BAYSE_API}/v1/pm/events?${params}`);
  if (!response.ok) {
    const body = await response.text().catch(() => "<no body>");
    console.error("Bayse API error", response.status, body);
    throw new Error(`Bayse API ${response.status}`);
  }

  const json = await response.json();
  return (json.events || [])
    .map(event => normalizeBayseEvent(event))
    .filter(event => event.title && event.markets.length && (!event.status || event.status === "open"));
}

export async function searchOpenBayseMarkets({
  keyword,
  fetchImpl = fetch,
  pageSize = 12,
  currency = "NGN",
} = {}) {
  const events = await fetchOpenBayseEvents({
    keyword,
    fetchImpl,
    pageSize,
    currency,
  });

  return events.flatMap(event => event.markets);
}
