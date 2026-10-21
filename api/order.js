// Vercel serverless endpoint for creating pending ECHO SMP orders.
import crypto from "crypto";

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

function send(res, status, body, origin) {
  if (origin) {
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
  const secret = process.env.ORDER_CANCEL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "echo-default-secret";
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

export default async function handler(req, res) {
  const origin = req.headers.origin || "";

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", origin || "https://echo-smpshop.vercel.app");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return send(res, 405, { error: "Method not allowed." }, origin);
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return send(res, 500, { error: "Order service is not configured." }, origin);
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    const headers = {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

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
    const paymentMethod = cleanText(body.payment_method, 12).toLowerCase();
    if (!["upi", "qr"].includes(paymentMethod)) {
      return send(res, 400, { error: "Choose UPI or QR Code as the payment method." }, origin);
    }

    const existingResponse = await fetch(
      `${supabaseUrl}/rest/v1/sales_log?select=id,payment_reference,payment_status,payment_method,total_amount,items,currency,player_name&payment_reference=eq.${encodeURIComponent(paymentReference)}&limit=1`,
      { headers }
    );

    if (!existingResponse.ok) {
      return send(res, 502, { error: "Could not verify the order." }, origin);
    }

    const existing = await existingResponse.json();
    if (Array.isArray(existing) && existing.length) {
      const saved = existing[0];
      const samePlayer = String(saved.player_name || "").toLowerCase() === playerName.toLowerCase();
      const savedItems = Array.isArray(saved.items) ? saved.items : [];
      const sameItems = savedItems.length === order.items.length && order.items.every((item, index) => {
        const prior = savedItems[index] || {};
        return prior.name === item.name &&
          Number(prior.qty) === item.qty &&
          Number(prior.unit_price) === item.unit_price;
      });
      if (!samePlayer || !sameItems) {
        return send(res, 409, { error: "This order reference already belongs to a different order. Start checkout again." }, origin);
      }
      return send(res, 200, {
        ok: true,
        duplicate: true,
        order_id: saved.id,
        payment_reference: paymentReference,
        payment_status: saved.payment_status || "pending",
        payment_method: saved.payment_method || paymentMethod,
        total_amount: Number(saved.total_amount),
        currency: saved.currency || "INR",
        items: saved.items,
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
        payment_method: paymentMethod,
      }),
    });

    const responseText = await insertResponse.text();
    if (!insertResponse.ok) {
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
      payment_method: row && row.payment_method ? row.payment_method : paymentMethod,
      total_amount: order.total,
      currency: "INR",
      items: order.items,
      cancel_token: cancelToken(paymentReference, playerName),
    }, origin);
  } catch (error) {
    return send(res, 400, { error: "Invalid order request." }, origin);
  }
}
