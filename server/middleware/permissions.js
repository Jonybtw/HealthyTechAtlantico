const { canRole } = require("../utils/rbac");

const requirePermission = (permission) => (req, res, next) => {
  if (!req.user || !canRole(req.user.role, permission)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  return next();
};

module.exports = {
  requirePermission,
};
