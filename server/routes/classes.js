const express = require("express");
const pool = require("../db");
const { auth } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { asyncHandler } = require("../utils/async-handler");
const { PERMISSIONS } = require("../utils/rbac");

const router = express.Router();

// ── GET /api/classes/:year/report ───────────────────────────────────────────
// Returns all students for a given school year with latest biometrics and test count
router.get(
  "/:year/report",
  auth,
  requirePermission(PERMISSIONS.READ_CLASS_REPORTS),
  asyncHandler(async (req, res) => {
    const year = decodeURIComponent(req.params.year);

    // Students for this year with their latest biometrics
    const result = await pool.query(
      `SELECT
         s.id,
         s.name,
         s.sex,
         s.age,
         s.school_year,
         s.class_name,
         b.imc,
         b.imc_zone,
         b.waist_cm,
         b.waist_zone,
         (SELECT COUNT(*) FROM tests t WHERE t.student_id = s.id) AS num_tests
       FROM students s
       LEFT JOIN LATERAL (
         SELECT imc, imc_zone, waist_cm, waist_zone
         FROM biometrics
         WHERE student_id = s.id
         ORDER BY recorded_at DESC
         LIMIT 1
       ) b ON TRUE
       WHERE s.school_year = $1
       ORDER BY s.name ASC`,
      [year]
    );

    return res.json(result.rows);
  })
);

// ── GET /api/classes ─────────────────────────────────────────────────────────
// Returns a list of distinct school years that have students
router.get(
  "/",
  auth,
  requirePermission(PERMISSIONS.READ_CLASS_REPORTS),
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT DISTINCT school_year FROM students WHERE school_year IS NOT NULL ORDER BY school_year DESC"
    );
    return res.json(result.rows.map((r) => r.school_year));
  })
);

module.exports = router;
