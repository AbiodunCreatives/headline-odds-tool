import fs from "node:fs/promises";
import path from "node:path";
import bs58 from "bs58";
import * as bagsSdk from "@bagsfm/bags-sdk";
import { Connection, PublicKey } from "@solana/web3.js";

const { BagsSDK } = bagsSdk;

export const BAGS_API_BASE_URL = "https://public-api-v2.bags.fm/api/v1";
export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const DEFAULT_BAGS_URL = "https://bags.fm";
export const LAUNCH_STORE_PATH =
  process.env.BAGS_LAUNCH_STORE_PATH || path.join(process.cwd(), "data", "bags-launches.json");

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "in",
  "into",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "this",
  "to",
  "was",
  "will",
  "with",
]);

let cachedConnection = null;
let cachedSdk = null;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getRpcUrl() {
  return getRequiredEnv("SOLANA_RPC_URL");
}

function getConnection() {
  if (!cachedConnection) {
    cachedConnection = new Connection(getRpcUrl(), "processed");
  }
  return cachedConnection;
}

function getLaunchImageUrl() {
  if (process.env.BAGS_TOKEN_IMAGE_URL) {
    return process.env.BAGS_TOKEN_IMAGE_URL;
  }

  if (process.env.PUBLIC_APP_URL) {
    return new URL("/og-image.png", process.env.PUBLIC_APP_URL).toString();
  }

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/og-image.png`;
  }

  return "https://headlineodds.fun/og-image.png";
}

function getSdk() {
  if (!cachedSdk) {
    cachedSdk = new BagsSDK(getRequiredEnv("BAGS_API_KEY"), getConnection(), "processed");
  }
  return cachedSdk;
}

function maybeGetPartnerWallet() {
  const value = process.env.BAGS_PARTNER_WALLET?.trim();
  return value || null;
}

export function buildBagsUrl() {
  return process.env.BAGS_TOKEN_PAGE_URL || DEFAULT_BAGS_URL;
}

export function buildTokenName(headline) {
  return (headline || "").trim().slice(0, 20).trim() || "Headline Token";
}

export function deriveTickerFromHeadline(headline) {
  const words = String(headline || "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !STOP_WORDS.has(word.toLowerCase()));

  let ticker = words
    .slice(0, 6)
    .map((word) => word[0])
    .join("");

  const joined = words.join("");
  for (const char of joined) {
    if (ticker.length >= 6) break;
    ticker += char;
  }

  if (ticker.length < 4) {
    ticker = (ticker + "NEWS").slice(0, 4);
  }

  return ticker.slice(0, 6);
}

export function normalizeTicker(ticker, headline = "") {
  const clean = String(ticker || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (clean.length >= 4) {
    return clean.slice(0, 6);
  }

  return deriveTickerFromHeadline(headline);
}

export function buildTokenDescription(headline, kalshiOdds) {
  const oddsNumber = Number(kalshiOdds);
  const oddsLabel = Number.isFinite(oddsNumber)
    ? `${Math.round(oddsNumber)}% YES`
    : "N/A";
  return `${String(headline || "").trim()} | Kalshi odds: ${oddsLabel}`;
}

export function extractLaunchMetadata(description = "") {
  const [headlinePart, oddsPart] = String(description).split(" | Kalshi odds:");
  const oddsMatch = oddsPart?.match(/(-?\d+(?:\.\d+)?)%/);
  return {
    headline: headlinePart?.trim() || "",
    kalshiOdds: oddsMatch ? Number(oddsMatch[1]) : null,
  };
}

function createBagsHeaders(extraHeaders = {}) {
  return {
    "x-api-key": getRequiredEnv("BAGS_API_KEY"),
    ...extraHeaders,
  };
}

function createBagsUrl(endpoint, query) {
  const url = new URL(endpoint.replace(/^\//, ""), `${BAGS_API_BASE_URL}/`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url;
}

export async function callBagsApi(endpoint, options = {}) {
  const { method = "GET", query, body, headers = {} } = options;
  const fetchOptions = {
    method,
    headers: createBagsHeaders(headers),
  };

  if (body !== undefined) {
    fetchOptions.headers["Content-Type"] = "application/json";
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(createBagsUrl(endpoint, query), fetchOptions);
  const text = await response.text();

  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const errorMessage =
      payload?.error ||
      payload?.message ||
      `Bags API request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  if (payload && typeof payload === "object" && "success" in payload) {
    if (!payload.success) {
      throw new Error(payload.error || "Bags API request failed");
    }
    return payload.response;
  }

  return payload;
}

function base58ToBase64(serializedTransaction) {
  return Buffer.from(bs58.decode(serializedTransaction)).toString("base64");
}

function base64ToBase58(serializedTransaction) {
  return bs58.encode(Buffer.from(serializedTransaction, "base64"));
}

function serializeTransactionToBase64(transaction) {
  return Buffer.from(transaction.serialize()).toString("base64");
}

async function ensureLaunchStore() {
  await fs.mkdir(path.dirname(LAUNCH_STORE_PATH), { recursive: true });
  try {
    await fs.access(LAUNCH_STORE_PATH);
  } catch {
    await fs.writeFile(LAUNCH_STORE_PATH, "[]", "utf8");
  }
}

async function readLaunchStore() {
  await ensureLaunchStore();
  const raw = await fs.readFile(LAUNCH_STORE_PATH, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLaunchStore(records) {
  await ensureLaunchStore();
  await fs.writeFile(LAUNCH_STORE_PATH, JSON.stringify(records, null, 2), "utf8");
}

async function upsertLaunchRecord(record) {
  const launches = await readLaunchStore();
  const existingIndex = launches.findIndex((entry) => entry.tokenMint === record.tokenMint);

  if (existingIndex >= 0) {
    launches[existingIndex] = {
      ...launches[existingIndex],
      ...record,
      updatedAt: new Date().toISOString(),
    };
  } else {
    launches.unshift(record);
  }

  await writeLaunchStore(launches);
}

function flattenFeeShareTransactions(feeShareConfig) {
  const items = [];

  for (const transaction of feeShareConfig?.transactions || []) {
    items.push({
      kind: "config",
      label: "Fee share setup",
      base64: base58ToBase64(transaction.transaction),
    });
  }

  for (const bundle of feeShareConfig?.bundles || []) {
    for (const transaction of bundle) {
      items.push({
        kind: "config",
        label: "Fee share bundle",
        base64: base58ToBase64(transaction.transaction),
      });
    }
  }

  return items;
}

function parseNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function sumIfFinite(...values) {
  const finite = values.filter((value) => Number.isFinite(Number(value))).map(Number);
  if (!finite.length) return null;
  return finite.reduce((sum, value) => sum + value, 0);
}

function buildLaunchRecord(record) {
  const createdAt = record.createdAt || new Date().toISOString();
  return {
    tokenMint: record.tokenMint,
    name: record.name,
    symbol: record.symbol,
    headline: record.headline,
    description: record.description,
    kalshiOdds: parseNumber(record.kalshiOdds),
    userWallet: record.userWallet,
    metadataUrl: record.metadataUrl,
    configKey: record.configKey,
    txSignatures: record.txSignatures || [],
    launchSignature: record.launchSignature || null,
    bagsUrl: record.bagsUrl || buildBagsUrl(),
    imageUrl: record.imageUrl || getLaunchImageUrl(),
    createdAt,
    updatedAt: record.updatedAt || createdAt,
  };
}

export async function prepareLaunchToken({ headline, kalshiOdds, userWallet, ticker }) {
  if (!headline || typeof headline !== "string") {
    throw new Error("headline is required");
  }

  if (!userWallet || typeof userWallet !== "string") {
    throw new Error("userWallet is required");
  }

  const creatorWallet = new PublicKey(userWallet);
  const symbol = normalizeTicker(ticker, headline);
  const name = buildTokenName(headline);
  const description = buildTokenDescription(headline, kalshiOdds);
  const sdk = getSdk();

  const tokenInfo = await sdk.tokenLaunch.createTokenInfoAndMetadata({
    imageUrl: getLaunchImageUrl(),
    name,
    symbol,
    description,
  });

  const feeSharePayload = {
    payer: creatorWallet.toBase58(),
    baseMint: tokenInfo.tokenMint,
    claimersArray: [creatorWallet.toBase58()],
    basisPointsArray: [10000],
    partnerConfig: getRequiredEnv("BAGS_PARTNER_KEY"),
  };

  const partnerWallet = maybeGetPartnerWallet();
  if (partnerWallet) {
    feeSharePayload.partner = partnerWallet;
  }

  const feeShareConfig = await callBagsApi("/fee-share/config", {
    method: "POST",
    body: feeSharePayload,
  });

  const configKey =
    feeShareConfig?.meteoraConfigKey ||
    feeShareConfig?.configKey ||
    feeShareConfig?.feeShareAuthority;

  if (!configKey) {
    throw new Error("Bags fee share config response did not include a config key");
  }

  const launchTransaction = await sdk.tokenLaunch.createLaunchTransaction({
    metadataUrl: tokenInfo.tokenMetadata,
    tokenMint: new PublicKey(tokenInfo.tokenMint),
    launchWallet: creatorWallet,
    initialBuyLamports: 0,
    configKey: new PublicKey(configKey),
  });

  return {
    mode: "prepare",
    tokenMint: tokenInfo.tokenMint,
    symbol,
    name,
    description,
    headline: headline.trim(),
    kalshiOdds: parseNumber(kalshiOdds),
    metadataUrl: tokenInfo.tokenMetadata,
    configKey,
    bagsUrl: buildBagsUrl(),
    imageUrl: getLaunchImageUrl(),
    transactions: [
      ...flattenFeeShareTransactions(feeShareConfig),
      {
        kind: "launch",
        label: "Token launch",
        base64: serializeTransactionToBase64(launchTransaction),
      },
    ],
  };
}

export async function launchToken(headline, kalshiOdds, userWallet, options = {}) {
  return prepareLaunchToken({
    headline,
    kalshiOdds,
    userWallet,
    ticker: options.ticker,
  });
}

export async function submitLaunchTransactions({
  signedTransactions,
  tokenMint,
  symbol,
  name,
  headline,
  description,
  kalshiOdds,
  userWallet,
  metadataUrl,
  configKey,
  imageUrl,
}) {
  if (!Array.isArray(signedTransactions) || signedTransactions.length === 0) {
    throw new Error("signedTransactions is required");
  }

  const txSignatures = [];
  for (const signedTransaction of signedTransactions) {
    const signature = await callBagsApi("/solana/send-transaction", {
      method: "POST",
      body: {
        transaction: base64ToBase58(signedTransaction),
      },
    });
    await getConnection().confirmTransaction(signature, "confirmed");
    txSignatures.push(signature);
  }

  const record = buildLaunchRecord({
    tokenMint,
    symbol,
    name,
    headline,
    description,
    kalshiOdds,
    userWallet,
    metadataUrl,
    configKey,
    imageUrl,
    txSignatures,
    launchSignature: txSignatures.at(-1) || null,
    bagsUrl: buildBagsUrl(),
  });

  await upsertLaunchRecord(record);

  return {
    mode: "submit",
    tokenMint: record.tokenMint,
    symbol: record.symbol,
    txSignature: record.launchSignature,
    txSignatures: record.txSignatures,
    bagsUrl: record.bagsUrl,
  };
}

async function fetchFallbackDexMetrics(tokenMint) {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`);
    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const pairs = Array.isArray(payload?.pairs) ? payload.pairs : [];
    if (!pairs.length) {
      return null;
    }

    const pair = pairs
      .filter((item) => item.chainId === "solana")
      .sort((left, right) => Number(right?.liquidity?.usd || 0) - Number(left?.liquidity?.usd || 0))[0];

    if (!pair) {
      return null;
    }

    return {
      priceUsd: parseNumber(pair.priceUsd),
      priceChange24h: parseNumber(pair?.priceChange?.h24),
      volume24hUsd: parseNumber(pair?.volume?.h24),
      dexUrl: pair.url || null,
    };
  } catch {
    return null;
  }
}

function toTokenResponse(record, topToken, fallbackMetrics) {
  const storedLaunch = record || {};
  const latestPrice = topToken?.tokenLatestPrice || null;
  const tokenInfo = topToken?.tokenInfo || null;
  const parsedFromDescription = extractLaunchMetadata(storedLaunch.description);

  return {
    tokenMint: storedLaunch.tokenMint || topToken?.token,
    symbol: storedLaunch.symbol || tokenInfo?.symbol || "",
    name: storedLaunch.name || tokenInfo?.name || "",
    headline:
      storedLaunch.headline ||
      parsedFromDescription.headline ||
      tokenInfo?.name ||
      "Headline token",
    description: storedLaunch.description || "",
    kalshiOdds:
      parseNumber(storedLaunch.kalshiOdds) ??
      parsedFromDescription.kalshiOdds,
    currentPriceUsd:
      parseNumber(latestPrice?.priceUSD) ??
      parseNumber(tokenInfo?.usdPrice) ??
      fallbackMetrics?.priceUsd ??
      null,
    priceChange24h:
      parseNumber(tokenInfo?.stats24h?.priceChange) ??
      fallbackMetrics?.priceChange24h ??
      null,
    volume24hUsd:
      sumIfFinite(tokenInfo?.stats24h?.buyVolume, tokenInfo?.stats24h?.sellVolume) ??
      parseNumber(latestPrice?.volumeUSD) ??
      fallbackMetrics?.volume24hUsd ??
      null,
    decimals: tokenInfo?.decimals ?? 6,
    bagsUrl: storedLaunch.bagsUrl || buildBagsUrl(),
    dexUrl: fallbackMetrics?.dexUrl || null,
    userWallet: storedLaunch.userWallet || null,
    launchSignature: storedLaunch.launchSignature || null,
    createdAt: storedLaunch.createdAt || null,
    updatedAt: storedLaunch.updatedAt || null,
    dataSource: topToken ? "bags" : fallbackMetrics ? "dexscreener" : "stored",
  };
}

export async function getTokensByPartner() {
  const storedLaunches = await readLaunchStore();
  const storedByMint = new Map(storedLaunches.map((record) => [record.tokenMint, record]));
  const partnerConfigKey = process.env.BAGS_PARTNER_KEY?.trim();
  let leaderboard = [];

  try {
    leaderboard = await getSdk().state.getTopTokensByLifetimeFees();
  } catch {
    leaderboard = [];
  }

  const relevantLeaderboard = leaderboard.filter((item) => {
    const partnerMatch = partnerConfigKey && item?.tokenInfo?.partnerConfig === partnerConfigKey;
    const storedMatch = storedByMint.has(item?.token);
    return partnerMatch || storedMatch;
  });

  const leaderboardByMint = new Map(relevantLeaderboard.map((item) => [item.token, item]));
  const fallbacks = await Promise.all(
    storedLaunches
      .filter((record) => !leaderboardByMint.has(record.tokenMint))
      .map(async (record) => [record.tokenMint, await fetchFallbackDexMetrics(record.tokenMint)])
  );
  const fallbackByMint = new Map(fallbacks);

  const tokens = storedLaunches.map((record) =>
    toTokenResponse(record, leaderboardByMint.get(record.tokenMint), fallbackByMint.get(record.tokenMint) || null)
  );

  for (const item of relevantLeaderboard) {
    if (storedByMint.has(item.token)) continue;
    tokens.push(toTokenResponse({ tokenMint: item.token }, item, null));
  }

  return tokens.sort((left, right) => {
    const leftTime = Date.parse(left.createdAt || "") || 0;
    const rightTime = Date.parse(right.createdAt || "") || 0;
    return rightTime - leftTime;
  });
}

export async function getQuote(inputMint, outputMint, amount) {
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error("amount must be a positive number");
  }

  const quote = await getSdk().trade.getQuote({
    inputMint: new PublicKey(inputMint),
    outputMint: new PublicKey(outputMint),
    amount: normalizedAmount,
  });

  return {
    ...quote,
    venue: quote.routePlan?.[0]?.venue || "Bags",
  };
}

export async function prepareSwap({ inputMint, outputMint, amount, userPublicKey }) {
  if (!userPublicKey) {
    throw new Error("userPublicKey is required");
  }

  const quote = await getQuote(inputMint, outputMint, amount);
  const swapTransaction = await getSdk().trade.createSwapTransaction({
    quoteResponse: quote,
    userPublicKey: new PublicKey(userPublicKey),
  });

  return {
    quote,
    transactionBase64: serializeTransactionToBase64(swapTransaction.transaction),
    computeUnitLimit: swapTransaction.computeUnitLimit,
    lastValidBlockHeight: swapTransaction.lastValidBlockHeight,
    prioritizationFeeLamports: swapTransaction.prioritizationFeeLamports,
  };
}

export function setCorsHeaders(res, methods = "GET, POST, OPTIONS") {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export async function readJsonBody(req) {
  if (req?.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req?.body === "string" && req.body.trim()) {
    return JSON.parse(req.body);
  }

  return {};
}
