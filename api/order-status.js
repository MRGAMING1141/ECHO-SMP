// Public order-status endpoint.
// Uses the same server-side cancellation token issued when the order was created.
// No Supabase key is exposed to the browser.

const crypto = require("crypto");

const ALLOWED_ORIGINS = new Set(
  [process.env.SITE_ORIGIN, "https://echo-smpshop.vercel.app"]
    .filter(Boolean)
    .map((value) => value.replace(/\/$/, ""))
);

function send(res, status, body, origin) {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}

function cleanText(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function tokenFor(reference, player) {
  const secret = process.env.ORDER_CANCEL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!secret) return "";
  return crypto.createHmac("sha256", secret)
    .update(reference + "|" + player.toLowerCase())
    .digest("hex");
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";

  if (req.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.has(origin)) return send(res, 403, { error: "Origin not allowed." }, origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST" || (origin && !ALLOWED_ORIGINS.has(origin))) {
    return send(res, 403, { error: "Request not allowed." }, origin);
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return send(res, 500, { error: "Order status service is not configured." }, origin);

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const playerName = cleanText(body.player_name, 32);
    const paymentReference = cleanText(body.payment_reference, 40);
    const cancelToken = cleanText(body.cancel_token, 128);

    if (!/^[A-Za-z0-9_ .-]{1,32}$/.test(playerName) ||
        !/^ECHO-[0-9]{6}-[A-Z0-9]{4}$/.test(paymentReference) ||
        !safeEqual(tokenFor(paymentReference, playerName), cancelToken)) {
      return send(res, 404, { error: "Order not found." }, origin);
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/sales_log?select=id,payment_reference,payment_status,paid_at,created_at&payment_reference=eq.${encodeURIComponent(paymentReference)}&player_name=eq.${encodeURIComponent(playerName)}&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return send(res, 502, { error: "Could not check order status." }, origin);
    const rows = await response.json();
    if (!Array.isArray(rows) || !rows.length) return send(res, 404, { error: "Order not found." }, origin);

    return send(res, 200, { ok: true, order: rows[0] }, origin);
  } catch {
    return send(res, 400, { error: "Invalid order status request." }, origin);
  }
};
