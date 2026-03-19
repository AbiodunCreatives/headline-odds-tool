import { getQuote, setCorsHeaders } from "../bags.js";

export default async function handler(req, res) {
  setCorsHeaders(res, "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "GET only" });
  }

  const { inputMint, outputMint, amount } = req.query || {};

  if (!inputMint || !outputMint || !amount) {
    return res.status(400).json({
      ok: false,
      error: "Missing inputMint, outputMint, or amount query params",
    });
  }

  try {
    const quote = await getQuote(inputMint, outputMint, Number(amount));
    return res.json({ ok: true, quote });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || "Quote failed" });
  }
}
