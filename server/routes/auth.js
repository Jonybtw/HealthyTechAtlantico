const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { JWT_SECRET } = require("../config/env");
const { asyncHandler } = require("../utils/async-handler");
const { getRolePermissions, isKnownRole } = require("../utils/rbac");

const router = express.Router();
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "7d";

// ── POST /api/auth/register ─────────────────────────────────────────────────
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, role, consent_rgpd, consent_share } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e palavra-passe são obrigatórios." });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "A palavra-passe deve ter pelo menos 8 caracteres." });
    }
    const roleToUse = role || "aluno";
    if (!isKnownRole(roleToUse)) {
      return res.status(400).json({ error: "Perfil inválido." });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Este email já está registado." });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, consent_rgpd, consent_share)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, role, consent_rgpd, consent_share`,
      [email.toLowerCase(), password_hash, roleToUse, Boolean(consent_rgpd), Boolean(consent_share)]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    return res.status(201).json({
      token,
      user: { ...user, permissions: getRolePermissions(user.role) },
    });
  })
);

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e palavra-passe são obrigatórios." });
    }

    const result = await pool.query(
      "SELECT id, email, role, password_hash, consent_rgpd, consent_share FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Email ou palavra-passe incorretos." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Email ou palavra-passe incorretos." });
    }

    const { password_hash: _omit, ...safeUser } = user;
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    return res.json({
      token,
      user: { ...safeUser, permissions: getRolePermissions(user.role) },
    });
  })
);

module.exports = router;
