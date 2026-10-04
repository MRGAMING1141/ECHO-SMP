// Vercel serverless endpoint for creating pending ECHO SMP orders.
// The Supabase service-role key is read only from Vercel environment variables.
// It is never bundled into browser code.

const crypto = require("crypto");

const CATALOG = Object.freeze({
  "Master": 69,
  "Elite": 99,
  "Emperor": 129,
  "Titan": 169,
  "Divine": 289,
  "Knight": 399,
  "Royal": 649,
  "Founder": 1699,
  "Legendary Key": 59,
  "Magma Key": 99,
  "OP Key": 129,
  "Echo Key": 199,
  "10K claim blocks": 30,
  "30K claim blocks": 50,
  "50K claim blocks": 80,
  "100K claim blocks": 100,
});

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

function cancelToken(paymentReference, playerName) {
  const secret = process.env.ORDER_CANCEL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!secret) return "";
  return crypto
    .createHmac("sha256", secret)
    .update(paymentReference + "|" + playerName.toLowerCase())
    .digest("hex");
}

function safeTokenEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function calculateOrder(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 30) {
    throw new Error("Invalid items.");
  }

  const normalized = [];
  const seen = new Set();
  let total = 0;

  for (const item of items) {
    const name = cleanText(item && item.name, 80);
    const qty = Number(item && item.qty);

    if (!Object.prototype.hasOwnProperty.call(CATALOG, name)) {
      throw new Error("One or more products are invalid.");
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
      throw new Error("Invalid quantity.");
    }
    if (seen.has(name)) {
      throw new Error("Duplicate product lines are not allowed.");
    }

    seen.add(name);
    const unitPrice = CATALOG[name];
    total += unitPrice * qty;
    normalized.push({ name, qty, unit_price: unitPrice });
  }

  if (!Number.isSafeInteger(total) || total <= 0) {
    throw new Error("Invalid order total.");
  }

  return { items: normalized, total };
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";

  if (req.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return send(res, 403, { error: "Origin not allowed." }, origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return send(res, 405, { error: "Method not allowed." }, origin);
  }

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return send(res, 403, { error: "Origin not allowed." }, origin);
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    return send(res, 500, { error: "Order service is not configured." }, origin);
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    if (body.action === "cancel") {
      const playerName = cleanText(body.player_name, 32);
      const paymentReference = cleanText(body.payment_reference, 40);
      const suppliedToken = cleanText(body.cancel_token, 128);

      if (!/^[A-Za-z0-9_ .-]{1,32}$/.test(playerName) ||
          !/^ECHO-[0-9]{6}-[A-Z0-9]{4}$/.test(paymentReference) ||
          !suppliedToken) {
        return send(res, 400, { error: "Invalid cancellation request." }, origin);
      }

      const expectedToken = cancelToken(paymentReference, playerName);
      if (!expectedToken || !safeTokenEqual(expectedToken, suppliedToken)) {
        return send(res, 403, { error: "Cancellation authorization failed." }, origin);
      }

      const cancelResponse = await fetch(
        `${supabaseUrl}/rest/v1/sales_log?payment_reference=eq.${encodeURIComponent(paymentReference)}&player_name=eq.${encodeURIComponent(playerName)}&payment_status=eq.pending`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            Prefer: "return=representation",
          },
          body: JSON.stringify({ payment_status: "cancelled" }),
        }
      );

      const cancelText = await cancelResponse.text();
      if (!cancelResponse.ok) {
        console.error("Supabase cancellation failed:", cancelText);
        return send(res, 502, { error: "Could not cancel your order." }, origin);
      }

      let cancelledRows = [];
      try { cancelledRows = JSON.parse(cancelText); } catch {}

      if (!Array.isArray(cancelledRows) || !cancelledRows.length) {
        return send(res, 409, {
          error: "This order has already been accepted or cancelled.",
        }, origin);
      }

      return send(res, 200, {
        ok: true,
        payment_reference: paymentReference,
        payment_status: "cancelled",
      }, origin);
    }
    const playerName = cleanText(body.player_name, 32);
    const discordUsername = cleanText(body.discord_username, 80);
    const paymentReference = cleanText(body.payment_reference, 40);

    if (!/^[A-Za-z0-9_ .-]{1,32}$/.test(playerName)) {
      return send(res, 400, { error: "Enter a valid Minecraft username." }, origin);
    }
    if (!discordUsername || discordUsername.length > 80) {
      return send(res, 400, { error: "Enter a valid Discord username." }, origin);
    }
    if (!/^ECHO-[0-9]{6}-[A-Z0-9]{4}$/.test(paymentReference)) {
      return send(res, 400, { error: "Invalid order reference." }, origin);
    }

    const order = calculateOrder(body.items);

    const headers = {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    // Make retries of the same browser submission harmless when the reference
    // already exists. The table itself is unchanged; this is application-level
    // idempotency because payment_reference is not assumed to be UNIQUE.
    const existingResponse = await fetch(
      `${supabaseUrl}/rest/v1/sales_log?select=id,payment_reference,payment_status&payment_reference=eq.${encodeURIComponent(paymentReference)}&limit=1`,
      { headers }
    );

    if (!existingResponse.ok) {
      console.error("Supabase duplicate-check failed:", await existingResponse.text());
      return send(res, 502, { error: "Could not verify the order." }, origin);
    }

    const existing = await existingResponse.json();
    if (Array.isArray(existing) && existing.length) {
      return send(res, 200, {
        ok: true,
        duplicate: true,
        order_id: existing[0].id,
        payment_reference: paymentReference,
        payment_status: existing[0].payment_status || "pending",
        total_amount: order.total,
        currency: "INR",
        items: order.items,
        cancel_token: cancelToken(paymentReference, playerName),
      }, origin);
    }

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/sales_log`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        player_name: playerName,
        discord_username: discordUsername,
        items: order.items,
        total_amount: order.total,
        currency: "INR",
        payment_reference: paymentReference,
        // payment_method/payment_status/paid_at are deliberately omitted so
        // the database defaults remain authoritative.
      }),
    });

    const responseText = await insertResponse.text();
    if (!insertResponse.ok) {
      console.error("Supabase insert failed:", responseText);
      return send(res, 502, { error: "Could not save your order. Please try again." }, origin);
    }

    let inserted;
    try {
      inserted = JSON.parse(responseText);
    } catch {
      inserted = [];
    }

    const row = Array.isArray(inserted) ? inserted[0] : inserted;
    return send(res, 201, {
      ok: true,
      duplicate: false,
      order_id: row && row.id,
      payment_reference: paymentReference,
      payment_status: row && row.payment_status ? row.payment_status : "pending",
      total_amount: order.total,
      currency: "INR",
      items: order.items,
      cancel_token: cancelToken(paymentReference, playerName),
    }, origin);
  } catch (error) {
    console.error("Order endpoint error:", error);
    return send(res, 400, { error: "Invalid order request." }, origin);
  }
};
