// Public order-status endpoint for echo-smpshop.vercel.app.
export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: "Order status service is not configured." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const playerName = typeof body.player_name === "string" ? body.player_name.trim().slice(0, 32) : "";
    const paymentReference = typeof body.payment_reference === "string" ? body.payment_reference.trim().toUpperCase().slice(0, 40) : "";

    if (!/^[A-Za-z0-9_ .-]{1,32}$/.test(playerName) || !paymentReference) {
      return res.status(404).json({ error: "Order not found." });
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/sales_log?select=id,payment_reference,player_name,items,total_amount,payment_method,payment_status,paid_at,created_at&payment_reference=eq.${encodeURIComponent(paymentReference)}&player_name=ilike.${encodeURIComponent(playerName)}&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return res.status(502).json({ error: "Could not check order status." });
    }
    const rows = await response.json();
    if (!Array.isArray(rows) || !rows.length) {
      return res.status(404).json({ error: "Order not found." });
    }

    return res.status(200).json({ ok: true, order: rows[0] });
  } catch {
    return res.status(400).json({ error: "Invalid order status request." });
  }
}
