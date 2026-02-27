const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { JWT_SECRET } = require("../config/env");
const { asyncHandler } = require("../utils/async-handler");
const { getRolePermissions, isKnownRole } = require("../utils/rbac");

const router = express.Router();
const SALT_ROUNDS = 12; // increased from 10 for production
const TOKEN_EXPIRY = "8h"; // reduced from 7d — force daily re-auth

// Roles that can self-register publicly. Staff roles require admin invite.
const SELF_REGISTER_ROLES = new Set(["aluno", "pais"]);

// ── POST /api/auth/register ─────────────────────────────────────────────────
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, role, consent_rgpd, consent_share } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e palavra-passe são obrigatórios." });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Formato de email inválido." });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "A palavra-passe deve ter pelo menos 8 caracteres." });
    }

    const roleToUse = (role || "aluno").toLowerCase();
    if (!isKnownRole(roleToUse)) {
      return res.status(400).json({ error: "Perfil inválido." });
    }

    // Block self-registration for staff roles — must be created by admin
    if (!SELF_REGISTER_ROLES.has(roleToUse)) {
      return res.status(403).json({
        error: "Este perfil não pode ser criado self-service. Contacta o administrador do sistema.",
      });
    }

    // RGPD consent is mandatory for health data of minors
    if (!consent_rgpd) {
      return res.status(400).json({ error: "O consentimento RGPD é obrigatório para criar conta." });
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
      [email.toLowerCase(), password_hash, roleToUse, true, Boolean(consent_share)]
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

    // Use constant-time comparison even when user doesn't exist (prevent timing attacks)
    const dummyHash = "$2a$12$invalidhashusedtopreventtimingattacks000000000000000000";
    const hashToCheck = user ? user.password_hash : dummyHash;
    const valid = await bcrypt.compare(password, hashToCheck);

    if (!user || !valid) {
      // Generic message — don't reveal whether email exists
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

// ── POST /api/auth/admin/create-staff ───────────────────────────────────────
// Only accessible with a valid ADMIN_SECRET env var (for initial staff setup)
router.post(
  "/admin/create-staff",
  asyncHandler(async (req, res) => {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      return res.status(503).json({ error: "Criação de staff desativada." });
    }
    const { secret, email, password, role } = req.body;
    if (!secret || secret !== adminSecret) {
      return res.status(403).json({ error: "Segredo administrativo inválido." });
    }
    if (!email || !password || !role) {
      return res.status(400).json({ error: "email, password e role são obrigatórios." });
    }
    const staffRoles = new Set(["professor", "psicologo"]);
    if (!staffRoles.has(role)) {
      return res.status(400).json({ error: "Role inválida para staff. Use: professor, psicologo." });
    }
    if (password.length < 12) {
      return res.status(400).json({ error: "A palavra-passe de staff deve ter pelo menos 12 caracteres." });
    }
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Este email já está registado." });
    }
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, consent_rgpd, consent_share)
       VALUES ($1, $2, $3, TRUE, TRUE)
       RETURNING id, email, role`,
      [email.toLowerCase(), password_hash, role]
    );
    return res.status(201).json({ created: result.rows[0] });
  })
);

module.exports = router;

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
