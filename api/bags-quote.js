// Vercel serverless function — Bags.fm quote proxy + live stats badge
// GET  → { ok, solPrice, poolCount }          (60s cached, for nav badge)
// POST { inputMint, outputMint, amount } → { ok, outAmount, priceImpactPct, requestId, venue, platformFee }

const BAGS_API = "https://public-api-v2.bags.fm/api/v1";
const SOL_MINT  = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const CACHE_TTL = 60 * 1000; // 60 s

let statsCache = { solPrice: null, poolCount: null, ts: 0 };

function bagsHeaders() {
  return {
    "x-api-key": process.env.BAGS_API_KEY || "",
    "Content-Type": "application/json",
  };
}

async function getLiveStats() {
  const now = Date.now();
  if (statsCache.ts && now - statsCache.ts < CACHE_TTL) return statsCache;

  const [quoteRes, poolsRes] = await Promise.all([
    fetch(
      `${BAGS_API}/trade/quote?inputMint=${SOL_MINT}&outputMint=${USDC_MINT}&amount=1000000000&slippageMode=auto`,
      { headers: bagsHeaders() }
    ),
    fetch(`${BAGS_API}/solana/bags/pools`, { headers: bagsHeaders() }),
  ]);

  let solPrice = null;
  if (quoteRes.ok) {
    const j = await quoteRes.json();
    if (j.success && j.response?.outAmount) {
      // outAmount is USDC with 6 decimals
      solPrice = parseFloat((parseInt(j.response.outAmount) / 1e6).toFixed(2));
    }
  }

  let poolCount = null;
  if (poolsRes.ok) {
    const j = await poolsRes.json();
    const arr = Array.isArray(j) ? j : Array.isArray(j.response) ? j.response : null;
    if (arr) poolCount = arr.length;
  }

  statsCache = { solPrice, poolCount, ts: Date.now() };
  return statsCache;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // ── GET: live stats for nav badge ──────────────────────────────────────
  if (req.method === "GET") {
    try {
      const stats = await getLiveStats();
      return res.json({ ok: true, solPrice: stats.solPrice, poolCount: stats.poolCount });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method !== "POST") return res.status(405).json({ error: "GET or POST only" });

  // ── POST: proxy quote request ──────────────────────────────────────────
  const { inputMint, outputMint, amount } = req.body || {};
  if (!inputMint || !outputMint || !amount) {
    return res.status(400).json({ ok: false, error: "Missing inputMint, outputMint, or amount" });
  }

  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: String(amount),
      slippageMode: "auto",
    });

    const upstream = await fetch(`${BAGS_API}/trade/quote?${params}`, {
      headers: bagsHeaders(),
    });
    const j = await upstream.json();

    if (!j.success) {
      return res.status(502).json({ ok: false, error: j.message || "Quote failed" });
    }

    const r = j.response;
    return res.json({
      ok: true,
      outAmount: r.outAmount,
      priceImpactPct: r.priceImpactPct,
      requestId: r.requestId,
      venue: r.routePlan?.[0]?.swapInfo?.label || "Bags",
      platformFee: r.platformFee,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
