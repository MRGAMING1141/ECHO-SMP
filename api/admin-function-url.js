// Returns only the public Supabase project URL needed to invoke the admin Edge Function.
// No Supabase key or password is exposed here.
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  if (!supabaseUrl) {
    return res.status(500).json({ error: "Supabase configuration is missing." });
  }

  return res.status(200).json({
    url: `${supabaseUrl}/functions/v1/admin-orders`,
  });
};
