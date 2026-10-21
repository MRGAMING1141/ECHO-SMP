// Vercel Serverless Function to list orders for a logged-in player on echo-smpshop.vercel.app.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  const player = String(req.query?.player || "").trim();
  if (!player || !/^[A-Za-z0-9_ .-]{1,32}$/.test(player)) {
    return res.status(200).json({ ok: true, orders: [] });
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(200).json({ ok: true, orders: [] });
  }

  try {
    const url = `${supabaseUrl}/rest/v1/sales_log?select=id,payment_reference,player_name,items,total_amount,payment_method,payment_status,paid_at,created_at&player_name=ilike.${encodeURIComponent(player)}&order=created_at.desc&limit=30`;
    const response = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return res.status(200).json({ ok: true, orders: [] });
    }

    const rows = await response.json();
    const orders = (Array.isArray(rows) ? rows : []).map((o) => ({
      id: o.payment_reference,
      ign: o.player_name,
      items: o.items,
      total: o.total_amount,
      method: o.payment_method,
      status: o.payment_status,
      paid_at: o.paid_at,
      ts: new Date(o.created_at).getTime() || Date.now(),
    }));

    return res.status(200).json({ ok: true, orders });
  } catch {
    return res.status(200).json({ ok: true, orders: [] });
  }
}
