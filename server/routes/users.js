const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { auth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/async-handler");
const { getRolePermissions, isKnownRole } = require("../utils/rbac");

const router = express.Router();

router.get(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT id, email, role, consent_rgpd, consent_share FROM users WHERE id = $1",
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });
    return res.json({ ...user, permissions: getRolePermissions(user.role) });
  })
);

router.put(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    const { role, consent_rgpd, consent_share } = req.body;
    const current = await pool.query("SELECT role FROM users WHERE id = $1", [req.user.id]);
    if (!current.rows[0]) return res.status(404).json({ error: "Utilizador não encontrado" });
    const currentRole = current.rows[0].role;

    const nextRole = role || currentRole;
    if (!isKnownRole(nextRole)) return res.status(400).json({ error: "Perfil inválido" });
    if (nextRole !== currentRole) {
      return res.status(403).json({ error: "Alteração de perfil não permitida" });
    }

    const result = await pool.query(
      "UPDATE users SET role = $1, consent_rgpd = $2, consent_share = $3 WHERE id = $4 RETURNING id, email, role, consent_rgpd, consent_share",
      [nextRole, Boolean(consent_rgpd), Boolean(consent_share), req.user.id]
    );
    const user = result.rows[0];
    return res.json({ ...user, permissions: getRolePermissions(user.role) });
  })
);

// ── PUT /api/users/me/password ───────────────────────────────────────────────
router.put(
  "/me/password",
  auth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Palavra-passe atual e nova são obrigatórias." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "A nova palavra-passe deve ter pelo menos 8 caracteres." });
    }

    const result = await pool.query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: "Utilizador não encontrado." });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Palavra-passe atual incorreta." });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, req.user.id]);

    return res.json({ ok: true });
  })
);

module.exports = router;
