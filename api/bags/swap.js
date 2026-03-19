import { prepareSwap, readJsonBody, setCorsHeaders } from "../bags.js";

export default async function handler(req, res) {
  setCorsHeaders(res, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST only" });
  }

  try {
    const body = await readJsonBody(req);
    const result = await prepareSwap(body);
    return res.json({ ok: true, ...result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || "Swap preparation failed" });
  }
}
