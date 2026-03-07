// Vercel serverless function — Bags.fm swap proxy
// POST { requestId, userPublicKey } → { ok, serializedTransaction }
// Frontend: deserialize base64 tx → wallet.signAndSendTransaction()

const BAGS_API = "https://public-api-v2.bags.fm/api/v1";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { requestId, userPublicKey } = req.body || {};
  if (!requestId || !userPublicKey) {
    return res.status(400).json({ ok: false, error: "Missing requestId or userPublicKey" });
  }

  try {
    const upstream = await fetch(`${BAGS_API}/trade/swap`, {
      method: "POST",
      headers: {
        "x-api-key": process.env.BAGS_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quote_request_id: requestId, userPublicKey }),
    });

    const j = await upstream.json();

    if (!j.success) {
      return res.status(502).json({ ok: false, error: j.message || "Swap failed" });
    }

    return res.json({ ok: true, serializedTransaction: j.response.serializedTransaction });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
