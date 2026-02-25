const express = require("express");
const pool = require("../db");
const { auth } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { asyncHandler } = require("../utils/async-handler");
const { PERMISSIONS } = require("../utils/rbac");

const router = express.Router();

router.get(
  "/:classId/students",
  auth,
  requirePermission(PERMISSIONS.READ_CLASS_REPORTS),
  asyncHandler(async (req, res) => {
    const classId = decodeURIComponent(req.params.classId);
    const result = await pool.query(
      "SELECT s.*, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE s.school_year = $1 ORDER BY s.name ASC",
      [classId]
    );
    return res.json(result.rows);
  })
);

router.get(
  "/:classId/report",
  auth,
  requirePermission(PERMISSIONS.READ_CLASS_REPORTS),
  asyncHandler(async (req, res) => {
    const classId = decodeURIComponent(req.params.classId);
    const result = await pool.query(
      `SELECT
        s.id, s.name, s.sex, s.age,
        b.imc, b.imc_zone, b.waist_cm, b.waist_zone,
        COUNT(t.id) as num_tests
      FROM students s
      LEFT JOIN LATERAL (
        SELECT imc, imc_zone, waist_cm, waist_zone
        FROM biometrics WHERE student_id = s.id
        ORDER BY recorded_at DESC LIMIT 1
      ) b ON true
      LEFT JOIN tests t ON s.id = t.student_id
      WHERE s.school_year = $1
      GROUP BY s.id, b.imc, b.imc_zone, b.waist_cm, b.waist_zone
      ORDER BY s.name ASC`,
      [classId]
    );
    return res.json(result.rows);
  })
);

module.exports = router;
