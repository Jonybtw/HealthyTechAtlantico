const jwt = require("jsonwebtoken");
const pool = require("../db");
const { JWT_SECRET } = require("../config/env");

const auth = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const result = await pool.query("SELECT id, email, role FROM users WHERE id = $1", [payload.id]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid token" });
    req.user = user;
    return next();
  } catch (_) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  return next();
};

module.exports = {
  auth,
  requireRole,
};
