// Returns the same-origin admin proxy endpoint so both Vercel (echo-smpshop.vercel.app)
// and local/preview servers handle staff authentication and Supabase queries without CORS errors.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  return res.status(200).json({
    url: "/api/supabase-proxy",
  });
}
