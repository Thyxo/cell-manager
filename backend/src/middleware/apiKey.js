const crypto = require("crypto");

// Shared-secret check via the `x-api-key` header. Disabled when API_KEY is unset,
// so existing deployments keep working until the key is configured.
function sameKey(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// protectReads: false → only POST/PUT/PATCH/DELETE need the key (GET stays public).
function requireApiKey({ protectReads = false } = {}) {
  return (req, res, next) => {
    const expected = process.env.API_KEY?.trim();
    if (!expected) return next();
    if (!protectReads && (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS")) {
      return next();
    }
    const given = req.get("x-api-key");
    if (given && sameKey(given.trim(), expected)) return next();
    res.status(401).json({ error: "Missing or invalid API key" });
  };
}

module.exports = { requireApiKey };
