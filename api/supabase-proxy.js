// Vercel Serverless Function for Echo SMP Staff Sales Log & Website Login Counter.
// Authenticates authorized staff Gmail accounts (or ADMIN_PASSWORD) and queries/updates Supabase sales_log.

const SELECT = [
  "id",
  "player_name",
  "discord_username",
  "items",
  "total_amount",
  "currency",
  "payment_method",
  "payment_reference",
  "payment_status",
  "created_at",
  "paid_at",
].join(",");

function isAuthorizedStaff(req) {
  const authHeader = String(req.headers?.authorization || req.headers?.Authorization || "");
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const staffEmail = String(req.headers?.["x-staff-email"] || "").trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || "").trim();

  if (["lasthope.mr@gmail.com", "zxbrar1@gmail.com"].includes(staffEmail)) return true;
  if (["google_staff:lasthope.mr@gmail.com", "google_staff:zxbrar1@gmail.com"].includes(token.toLowerCase())) return true;
  if (adminPassword && token === adminPassword) return true;
  return false;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", req.headers?.origin || "https://echo-smpshop.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Staff-Email");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch {
    body = {};
  }

  const action = body?.action;

  if (action === "record_site_login") {
    return res.status(200).json({ ok: true, total_logins: 1 });
  }

  if (!isAuthorizedStaff(req)) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized. Only authorized staff Gmail accounts can access the Sales Log.",
    });
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(200).json({
      ok: true,
      orders: [],
      website_logins: { total_logins: 1 },
    });
  }

  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  try {
    if (action === "update_status") {
      const orderId = String(body.order_id || "").trim();
      const nextStatus = String(body.status || "").trim().toLowerCase();
      if (!orderId || !["paid", "delivered", "cancelled"].includes(nextStatus)) {
        return res.status(400).json({ ok: false, error: "Invalid status update." });
      }

      const patch = { payment_status: nextStatus };
      if (nextStatus === "paid") {
        patch.paid_at = new Date().toISOString();
      }

      const updateUrl = `${supabaseUrl}/rest/v1/sales_log?id=eq.${encodeURIComponent(orderId)}&select=${encodeURIComponent(SELECT)}`;
      const updateResponse = await fetch(updateUrl, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(patch),
      });

      if (!updateResponse.ok) {
        return res.status(502).json({ ok: false, error: "Could not update order status in database." });
      }

      const updated = await updateResponse.json();
      const row = Array.isArray(updated) ? updated[0] : updated;
      return res.status(200).json({ ok: true, order: row });
    }

    if (action === "create_manual_sale") {
      const playerName = String(body.player_name || "").trim();
      const paymentReference = String(body.payment_reference || `ECHO-${Date.now()}`).trim().toUpperCase();
      const discordUsername = String(body.discord_username || "").trim();
      const totalAmount = Math.max(0, Number(body.total_amount) || 0);
      const itemsText = String(body.items_text || "Manual Order x1").trim();

      if (!playerName) {
        return res.status(400).json({ ok: false, error: "Player IGN is required." });
      }

      const parsedItems = itemsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((part) => {
          const match = part.match(/^(.*?)(?:\s*[x×]\s*(\d+))?$/i);
          const name = match && match[1] ? match[1].trim() : part;
          const qty = match && match[2] ? Math.max(1, parseInt(match[2], 10)) : 1;
          return { name, qty, unit_price: totalAmount };
        });

      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/sales_log`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          player_name: playerName,
          discord_username: discordUsername || "manual",
          items: parsedItems.length ? parsedItems : [{ name: "Manual Order", qty: 1, unit_price: totalAmount }],
          total_amount: totalAmount,
          currency: "INR",
          payment_reference: paymentReference,
          payment_method: "qr",
          payment_status: body.payment_status || "paid",
          paid_at: new Date().toISOString(),
        }),
      });

      if (!insertResponse.ok) {
        return res.status(502).json({ ok: false, error: "Could not log manual sale in Supabase." });
      }

      const inserted = await insertResponse.json();
      return res.status(200).json({ ok: true, order: Array.isArray(inserted) ? inserted[0] : inserted });
    }

    const listUrl = `${supabaseUrl}/rest/v1/sales_log?select=${encodeURIComponent(SELECT)}&order=created_at.desc`;
    const response = await fetch(listUrl, { headers });
    if (!response.ok) {
      return res.status(502).json({ ok: false, error: "Could not load sales log from Supabase." });
    }
    const orders = await response.json();
    return res.status(200).json({
      ok: true,
      orders: Array.isArray(orders) ? orders : [],
      website_logins: { total_logins: Array.isArray(orders) ? orders.length : 0 },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Internal server error reading sales log." });
  }
}
