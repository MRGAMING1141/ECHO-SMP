// Echo SMP admin sales reader.
// Password authentication is performed inside this function.
// The database secret key is server-side only and is never returned to the browser.

const ALLOWED_ORIGIN = Deno.env.get("SITE_ORIGIN") || "https://echo-smpshop.vercel.app";
const TABLE = "sales_log";
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

function corsHeaders(origin: string) {
  const allowed = origin === ALLOWED_ORIGIN ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, origin: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json",
    },
  });
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function sha256(value: string) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

function getBearer(request: Request) {
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Bearer ")) return "";
  return header.slice("Bearer ".length).trim();
}

function getSecretKey() {
  // Prefer the current Supabase secret-key system.
  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeysRaw) {
    try {
      const keys = JSON.parse(secretKeysRaw);
      if (typeof keys?.default === "string" && keys.default) return keys.default;
    } catch {
      // Fail closed below.
    }
  }

  // Compatibility with the project's existing legacy service-role setup.
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return legacy || "";
}

export default {
  async fetch(request: Request) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      if (origin !== ALLOWED_ORIGIN) {
        return new Response(null, { status: 403, headers: corsHeaders(origin) });
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (origin !== ALLOWED_ORIGIN) {
      return json({ error: "Origin not allowed." }, 403, origin);
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed." }, 405, origin);
    }

    const adminPassword = Deno.env.get("ADMIN_PASSWORD") || "";
    const supabaseUrl = (Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
    const secretKey = getSecretKey();

    // Fail closed if any required server-side configuration is missing.
    if (!adminPassword || !supabaseUrl || !secretKey) {
      return json({ error: "Admin service is not configured." }, 500, origin);
    }

    const suppliedPassword = getBearer(request);
    if (!suppliedPassword) {
      return json({ error: "Unauthorized." }, 401, origin);
    }

    const expectedHash = await sha256(adminPassword);
    const suppliedHash = await sha256(suppliedPassword);

    if (!constantTimeEqual(expectedHash, suppliedHash)) {
      return json({ error: "Unauthorized." }, 401, origin);
    }

    const headers = {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/json",
    };

    const url =
      `${supabaseUrl}/rest/v1/${TABLE}?select=${encodeURIComponent(SELECT)}&order=created_at.desc`;

    try {
      const response = await fetch(url, { headers });

      if (!response.ok) {
        // Do not return Supabase's response body because it may contain
        // internal database details.
        return json({ error: "Could not read the sales log." }, 502, origin);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        return json({ error: "Invalid sales log response." }, 502, origin);
      }

      // Return only the already allowlisted fields. Never echo request headers,
      // environment variables, database errors, or secrets.
      return json({ ok: true, orders: data }, 200, origin);
    } catch {
      return json({ error: "Could not read the sales log." }, 502, origin);
    }
  },
};
