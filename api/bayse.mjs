export const BAYSE_API = "https://relay.bayse.markets";
export const BAYSE_WEB_URL = "https://www.bayse.markets/install";

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

function probabilityToCents(value) {
  const probability = parseFiniteNumber(value);
  if (probability == null) return null;
  return Math.max(0, Math.min(100, Math.round(probability * 100)));
}

function buildBayseUrl(event) {
  const slug = cleanText(event?.slug);
  if (!slug) return BAYSE_WEB_URL;
  return `${BAYSE_WEB_URL}?market=${encodeURIComponent(slug)}`;
}

function buildSubtitle(eventTitle, marketTitle, description) {
  const parts = [];
  if (marketTitle && marketTitle !== eventTitle) parts.push(marketTitle);
  if (description) parts.push(description);
  return parts.join(" - ");
}

export function normalizeBayseMarket(event = {}, market = {}) {
  const eventTitle = firstText(event.title, market.title);
  const marketTitle = firstText(market.title, event.title);
  const description = cleanText(event.description);
  const title = eventTitle || marketTitle;

  const outcome1Price = probabilityToCents(firstNumber(market.yesBuyPrice, market.outcome1Price));
  const outcome2Price = probabilityToCents(firstNumber(market.noBuyPrice, market.outcome2Price));

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
    url: buildBayseUrl(event),
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

export async function searchOpenBayseMarkets({
  keyword,
  fetchImpl = fetch,
  pageSize = 12,
  currency = "USD",
} = {}) {
  const term = cleanText(keyword);
  if (!term) return [];

  const params = new URLSearchParams({
    status: "open",
    keyword: term,
    currency,
    page: "1",
    size: String(pageSize),
  });

  const response = await fetchImpl(`${BAYSE_API}/v1/pm/events?${params}`);
  if (!response.ok) {
    const body = await response.text().catch(() => "<no body>");
    console.error("Bayse API error", response.status, body);
    throw new Error(`Bayse API ${response.status}`);
  }

  const json = await response.json();
  const markets = [];

  for (const event of json.events || []) {
    for (const market of event.markets || []) {
      const normalized = normalizeBayseMarket(event, market);
      if (!normalized.title) continue;
      if (normalized.status && normalized.status !== "open") continue;
      markets.push(normalized);
    }
  }

  return markets;
}
