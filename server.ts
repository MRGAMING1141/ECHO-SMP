import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface OrderRecord {
  id: string;
  payment_reference: string;
  player_name: string;
  discord_username?: string;
  items: { name: string; qty: number; unit_price?: number; price?: number }[];
  total_amount: number;
  currency: string;
  payment_method: string;
  payment_status: "pending" | "paid" | "delivered" | "cancelled";
  cancel_token: string;
  created_at: string;
  paid_at?: string;
}

const app = express();
app.use(express.json());

let ordersDb: OrderRecord[] = [
  {
    id: "ord_1",
    payment_reference: "ECHO-261004-AB12",
    player_name: "Steve_MC",
    discord_username: "steve#0001",
    items: [{ name: "Master", qty: 1, unit_price: 69 }],
    total_amount: 69,
    currency: "₹",
    payment_method: "qr",
    payment_status: "pending",
    cancel_token: "tok_123",
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: "ord_2",
    payment_reference: "ECHO-261004-CD34",
    player_name: "AlexCraft",
    discord_username: "alex#1234",
    items: [{ name: "Legendary Key", qty: 3, unit_price: 59 }],
    total_amount: 177,
    currency: "₹",
    payment_method: "upi",
    payment_status: "paid",
    cancel_token: "tok_456",
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    paid_at: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

let loginStats = {
  totalLogins: 1421,
  firstLogin: new Date(Date.now() - 86400000 * 30).toISOString(),
  lastLogin: new Date().toISOString()
};

const productPrices: Record<string, number> = {
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
  "100K claim blocks": 100
};

// Ensure Google OAuth popups never lose window.opener reference and HTML is never stale-cached
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  if (req.path === "/" || req.path.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

// API Endpoints
app.get("/api/admin-function-url", (req, res) => {
  res.json({ ok: true, url: "/api/supabase-proxy" });
});

app.get("/firebase-applet-config.json", (_req, res) => {
  const configPath = path.resolve(__dirname, "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    res.setHeader("Content-Type", "application/json");
    return res.sendFile(configPath);
  }
  return res.status(404).json({ error: "Firebase config not found" });
});

app.post("/api/supabase-proxy", (req, res) => {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.replace("Bearer ", "").trim();
  const action = req.body?.action;

  if (action === "record_site_login") {
    loginStats.totalLogins += 1;
    loginStats.lastLogin = new Date().toISOString();
    return res.json({ ok: true, website_logins: loginStats });
  }

  // Strict staff authorization: only authorized staff Gmail accounts
  const staffEmailHeader = String(req.headers["x-staff-email"] || "").trim().toLowerCase();
  const isAuthorizedStaff =
    ["GOOGLE_STAFF:lasthope.mr@gmail.com", "GOOGLE_STAFF:zxbrar1@gmail.com", "GOOGLE_STAFF:ayushbhaktistudio@gmail.com", "GOOGLE_STAFF:janvirajpurohit491@gmail.com"].includes(token) ||
    ["lasthope.mr@gmail.com", "zxbrar1@gmail.com", "ayushbhaktistudio@gmail.com", "janvirajpurohit491@gmail.com"].includes(token.toLowerCase()) ||
    ["lasthope.mr@gmail.com", "zxbrar1@gmail.com", "ayushbhaktistudio@gmail.com", "janvirajpurohit491@gmail.com"].includes(staffEmailHeader);

  if (!isAuthorizedStaff) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized. Access is strictly restricted to authorized staff Gmail accounts."
    });
  }

  if (action === "update_status") {
    const { order_id, status } = req.body;
    const order = ordersDb.find(o => o.id === order_id || o.payment_reference === order_id);
    if (!order) {
      return res.status(404).json({ ok: false, error: "Order not found." });
    }
    order.payment_status = status;
    if (status === "paid") {
      order.paid_at = new Date().toISOString();
    }
    return res.json({ ok: true, order });
  }

  if (action === "create_manual_sale") {
    const { payment_reference, player_name, discord_username, items_text, total_amount, payment_status } = req.body;
    if (!player_name || !payment_reference) {
      return res.status(400).json({ ok: false, error: "Sale ID and Player name are required." });
    }
    const parsedItems = String(items_text || "Custom Bundle")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .map(raw => {
        const m = raw.match(/^(.*?)\s*[x×]\s*(\d+)$/i);
        if (m) {
          const name = m[1].trim();
          const qty = Math.max(1, Number(m[2]) || 1);
          return { name, qty, unit_price: productPrices[name] || 0 };
        }
        return { name: raw, qty: 1, unit_price: productPrices[raw] || Number(total_amount) || 0 };
      });

    const existing = ordersDb.find(
      o => o.payment_reference.toUpperCase() === String(payment_reference).trim().toUpperCase()
    );
    if (existing) {
      existing.player_name = String(player_name).trim();
      if (discord_username) existing.discord_username = String(discord_username).trim();
      if (parsedItems.length) existing.items = parsedItems;
      if (Number.isFinite(Number(total_amount)) && Number(total_amount) >= 0) {
        existing.total_amount = Number(total_amount);
      }
      if (payment_status) existing.payment_status = payment_status;
      return res.json({ ok: true, order: existing });
    }

    const newOrder: OrderRecord = {
      id: `ord_${Date.now()}`,
      payment_reference: String(payment_reference).trim().toUpperCase(),
      player_name: String(player_name).trim(),
      discord_username: discord_username ? String(discord_username).trim() : "",
      items: parsedItems.length ? parsedItems : [{ name: "Manual Order", qty: 1, unit_price: Number(total_amount) || 0 }],
      total_amount: Math.max(0, Number(total_amount) || 0),
      currency: "₹",
      payment_method: "manual",
      payment_status: payment_status || "paid",
      cancel_token: `tok_${Math.random().toString(36).substring(2, 10)}`,
      created_at: new Date().toISOString(),
      paid_at: payment_status === "paid" || payment_status === "delivered" ? new Date().toISOString() : undefined
    };
    ordersDb.unshift(newOrder);
    return res.json({ ok: true, order: newOrder });
  }

  res.json({
    ok: true,
    orders: ordersDb,
    website_logins: loginStats
  });
});

app.post("/api/order", (req, res) => {
  const { action, player_name, discord_username, items, payment_reference, payment_method, cancel_token } = req.body;

  if (action === "cancel") {
    const order = ordersDb.find(o => o.payment_reference === payment_reference && o.cancel_token === cancel_token);
    if (!order) {
      return res.status(404).json({ ok: false, error: "Order not found or invalid cancellation token." });
    }
    if (order.payment_status !== "pending") {
      return res.status(400).json({ ok: false, error: "Order has already been accepted or processed and cannot be cancelled." });
    }
    order.payment_status = "cancelled";
    return res.json({ ok: true, message: "Order cancelled successfully." });
  }

  if (!player_name || !items || !Array.isArray(items)) {
    return res.status(400).json({ ok: false, error: "Invalid order data." });
  }

  let calculatedTotal = 0;
  const verifiedItems = items.map((item: any) => {
    const name = item.name || item.n || "Item";
    const qty = Math.max(1, Number(item.qty || item.q || 1));
    const unitPrice = productPrices[name] || 50;
    calculatedTotal += unitPrice * qty;
    return {
      name,
      qty,
      unit_price: unitPrice
    };
  });

  const saleId = payment_reference || `ECHO-${Math.floor(100000 + Math.random() * 900000)}`;
  const cancelToken = `tok_${Math.random().toString(36).substring(2, 10)}`;

  const newRecord: OrderRecord = {
    id: `ord_${Date.now()}`,
    payment_reference: saleId,
    player_name: player_name.trim(),
    discord_username: discord_username ? discord_username.trim() : "",
    items: verifiedItems,
    total_amount: calculatedTotal,
    currency: "₹",
    payment_method: payment_method || "qr",
    payment_status: "pending",
    cancel_token: cancelToken,
    created_at: new Date().toISOString()
  };

  ordersDb.unshift(newRecord);

  res.json({
    ok: true,
    payment_reference: saleId,
    total_amount: calculatedTotal,
    currency: "₹",
    payment_method: newRecord.payment_method,
    items: verifiedItems,
    cancel_token: cancelToken
  });
});

app.post("/api/order-status", (req, res) => {
  const { payment_reference, player_name, cancel_token } = req.body;
  const refNorm = String(payment_reference || "").trim().toUpperCase();
  const playerNorm = String(player_name || "").trim().toLowerCase();

  const order = ordersDb.find(o => {
    const matchRef = o.payment_reference.toUpperCase() === refNorm;
    if (!matchRef) return false;
    if (cancel_token && o.cancel_token === cancel_token) return true;
    if (playerNorm && o.player_name.toLowerCase() === playerNorm) return true;
    return false;
  });

  if (!order) {
    return res.status(404).json({ ok: false, error: "Order not found" });
  }
  res.json({
    ok: true,
    order: {
      id: order.id,
      payment_reference: order.payment_reference,
      player_name: order.player_name,
      items: order.items,
      total_amount: order.total_amount,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      created_at: order.created_at,
      paid_at: order.paid_at
    }
  });
});

app.get("/api/player-orders", (req, res) => {
  const playerNorm = String(req.query.player || "").trim().toLowerCase();
  if (!playerNorm) {
    return res.json({ ok: true, orders: [] });
  }
  const matching = ordersDb
    .filter(o => o.player_name.toLowerCase() === playerNorm)
    .map(o => ({
      id: o.payment_reference,
      ign: o.player_name,
      items: o.items,
      total: o.total_amount,
      method: o.payment_method,
      status: o.payment_status,
      paid_at: o.paid_at,
      ts: new Date(o.created_at).getTime() || Date.now()
    }));
  res.json({ ok: true, orders: matching });
});

async function startServer() {
  const PORT = Number(process.env.PORT || 3000);

  // Serve public static assets (bg1.jpg, bg2.jpg, musiecho-theme.mp3, steve.png, etc.)
  app.use(express.static(path.resolve(__dirname, "public"), { index: false }));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.get("*", async (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      try {
        let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.resolve(__dirname, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Echo SMP server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
