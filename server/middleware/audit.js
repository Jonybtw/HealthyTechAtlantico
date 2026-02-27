const pool = require("../db");

/**
 * Audit log middleware — call after auth to record sensitive data access.
 * Usage: router.get("/:id/biometrics", auth, auditLog("read_biometrics"), ...)
 */
const auditLog = (action) => async (req, res, next) => {
  // Non-blocking: we fire-and-forget, never delay the request
  const userId = req.user?.id ?? null;
  const targetId = req.params?.id ?? null;
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    null;

  pool.query(
    `INSERT INTO audit_log (user_id, action, target_id, ip_address, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [userId, action, targetId ? Number(targetId) : null, ip]
  ).catch((err) => {
    // Never crash the app due to audit failure — just log
    console.error("[audit] Failed to write audit log:", err.message);
  });

  return next();
};

module.exports = { auditLog };
