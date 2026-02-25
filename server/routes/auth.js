const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { JWT_SECRET } = require("../config/env");
const { asyncHandler } = require("../utils/async-handler");

const router = express.Router();
const ROLES = new Set(["aluno", "professor", "psicologo", "pais"]);

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, role, consent_rgpd, consent_share } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: "Missing fields" });
    }
    if (!ROLES.has(role)) {
      return res.status(400).json({ error: "Perfil inválido" });
    }

    const hash = await bcrypt.hash(password, 10);
    try {
      const result = await pool.query(
        "INSERT INTO users (email, password_hash, role, consent_rgpd, consent_share) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, consent_rgpd, consent_share",
        [email, hash, role, Boolean(consent_rgpd), Boolean(consent_share)]
      );
      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
        expiresIn: "7d",
      });
      return res.json({ token, user });
    } catch (err) {
      if (err.code === "23505") {
        return res.status(400).json({ error: "Email já registado. Faz login." });
      }
      throw err;
    }
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Credenciais inválidas" });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        consent_rgpd: user.consent_rgpd,
        consent_share: user.consent_share,
      },
    });
  })
);

module.exports = router;
