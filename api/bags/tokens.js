import { getTokensByPartner, setCorsHeaders } from "../bags.js";

export default async function handler(req, res) {
  setCorsHeaders(res, "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "GET only" });
  }

  try {
    const tokens = await getTokensByPartner();
    return res.json({ ok: true, tokens });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || "Unable to load partner tokens" });
  }
}
