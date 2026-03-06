const express = require("express");
const pool = require("../db");
const { auth } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { asyncHandler } = require("../utils/async-handler");
const { PERMISSIONS } = require("../utils/rbac");

const router = express.Router();

// ── GET /api/stats/summary ──────────────────────────────────────────────────
// Single aggregated request replacing N+1 pattern in topbar stats
router.get(
  "/summary",
  auth,
  asyncHandler(async (req, res) => {
    const { role, id } = req.user;

    if (role === "professor" || role === "psicologo") {
      const result = await pool.query(
        `SELECT
           (SELECT COUNT(*) FROM students) AS student_count,
           (SELECT COUNT(*) FROM sos_alerts WHERE resolved = FALSE) AS open_sos_count`
      );
      const row = result.rows[0];
      return res.json({
        studentCount: Number(row.student_count),
        openSosCount: Number(row.open_sos_count),
      });
    }

    if (role === "pais") {
      const result = await pool.query(
        `SELECT COUNT(*) AS student_count
         FROM students s
         INNER JOIN student_guardians sg ON sg.student_id = s.id
         WHERE sg.guardian_user_id = $1`,
        [id]
      );
      return res.json({
        studentCount: Number(result.rows[0].student_count),
        openSosCount: 0,
      });
    }

    if (role === "aluno") {
      const result = await pool.query(
        "SELECT COUNT(*) AS student_count FROM students WHERE user_id = $1",
        [id]
      );
      return res.json({
        studentCount: Number(result.rows[0].student_count),
        openSosCount: 0,
      });
    }

    return res.json({ studentCount: 0, openSosCount: 0 });
  })
);

// ── GET /api/stats/sos-alerts ───────────────────────────────────────────────
// All SOS alerts (with student name) for staff — single query, no N+1
router.get(
  "/sos-alerts",
  auth,
  requirePermission(PERMISSIONS.READ_SOS),
  asyncHandler(async (req, res) => {
    const resolved = req.query.resolved === "true" ? true : req.query.resolved === "false" ? false : null;
    const params = [];
    let where = "";
    if (resolved !== null) {
      params.push(resolved);
      where = `WHERE a.resolved = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT
         a.id, a.psych, a.teacher, a.psych_email, a.teacher_email,
         a.resolved, a.resolved_at, a.created_at,
         s.id AS student_id, s.name AS student_name, s.class_name, s.school_year
       FROM sos_alerts a
       INNER JOIN students s ON s.id = a.student_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT 200`,
      params
    );
    return res.json(result.rows);
  })
);

module.exports = router;
