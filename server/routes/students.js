const express = require("express");
const pool = require("../db");
const { auth, requireConsent } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { auditLog } = require("../middleware/audit");
const { asyncHandler } = require("../utils/async-handler");
const { PERMISSIONS, canAccessStudentByRole } = require("../utils/rbac");
const { sendMail } = require("../services/mailer");

const router = express.Router();

// ── Helper: resolve student ownership / guardian link ───────────────────────
const resolveStudentAccess = async (studentId, user) => {
  const result = await pool.query("SELECT * FROM students WHERE id = $1", [studentId]);
  const student = result.rows[0];
  if (!student) return { student: null, isOwner: false, isGuardian: false };

  const isOwner = student.user_id === user.id;
  let isGuardian = false;
  if (!isOwner && user.role === "pais") {
    const g = await pool.query(
      "SELECT id FROM student_guardians WHERE student_id = $1 AND guardian_user_id = $2",
      [studentId, user.id]
    );
    isGuardian = g.rows.length > 0;
  }
  return { student, isOwner, isGuardian };
};

// ── GET /api/students ───────────────────────────────────────────────────────
router.get(
  "/",
  auth,
  requirePermission(PERMISSIONS.LIST_STUDENTS),
  asyncHandler(async (req, res) => {
    const { role, id } = req.user;
    // Pagination
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search ? `%${req.query.search}%` : null;
    const yearFilter = req.query.year || null;

    let rows;
    if (role === "professor" || role === "psicologo") {
      const conditions = [];
      const params = [];
      if (search) { params.push(search); conditions.push(`s.name ILIKE $${params.length}`); }
      if (yearFilter) { params.push(yearFilter); conditions.push(`s.school_year = $${params.length}`); }
      const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
      params.push(limit, offset);
      const result = await pool.query(
        `SELECT s.id, s.name, s.sex, s.age, s.birth_date, s.school_year, s.class_name, s.created_at,
                COUNT(*) OVER() AS total_count
         FROM students s ${where}
         ORDER BY s.name ASC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      const totalCount = result.rows[0] ? Number(result.rows[0].total_count) : 0;
      return res.json({ data: result.rows.map(r => { const { total_count, ...rest } = r; return rest; }), totalCount, limit, offset });
    } else if (role === "aluno") {
      const result = await pool.query(
        "SELECT id, name, sex, age, birth_date, school_year, class_name, created_at FROM students WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        [id, limit, offset]
      );
      return res.json({ data: result.rows, totalCount: result.rows.length, limit, offset });
    } else if (role === "pais") {
      const result = await pool.query(
        `SELECT s.id, s.name, s.sex, s.age, s.birth_date, s.school_year, s.class_name, s.created_at
         FROM students s
         INNER JOIN student_guardians sg ON sg.student_id = s.id
         WHERE sg.guardian_user_id = $1 ORDER BY s.name ASC LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      );
      return res.json({ data: result.rows, totalCount: result.rows.length, limit, offset });
    }
    return res.json({ data: [], totalCount: 0, limit, offset });
  })
);

// ── POST /api/students ──────────────────────────────────────────────────────
router.post(
  "/",
  auth,
  requirePermission(PERMISSIONS.CREATE_STUDENT),
  asyncHandler(async (req, res) => {
    const { name, sex, age, birthDate, schoolYear, class_name } = req.body;
    if (!name || !sex || (!age && !birthDate)) {
      return res.status(400).json({ error: "Nome, sexo e idade (ou data de nascimento) são obrigatórios." });
    }
    if (!["M", "F"].includes(sex)) {
      return res.status(400).json({ error: "Sexo deve ser 'M' ou 'F'." });
    }
    const parsedAge = age ? Number(age) : null;
    if (parsedAge !== null && (parsedAge < 5 || parsedAge > 25)) {
      return res.status(400).json({ error: "Idade deve ser entre 5 e 25 anos." });
    }
    const result = await pool.query(
      `INSERT INTO students (user_id, name, sex, age, birth_date, school_year, class_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, sex, age, birth_date, school_year, class_name, created_at`,
      [req.user.id, name.trim(), sex, parsedAge, birthDate || null, schoolYear || null, class_name || null]
    );
    return res.status(201).json(result.rows[0]);
  })
);

// ── GET /api/students/:id ───────────────────────────────────────────────────
router.get(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const { student, isOwner, isGuardian } = await resolveStudentAccess(Number(req.params.id), req.user);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });
    if (!canAccessStudentByRole({ role: req.user.role, permission: PERMISSIONS.READ_BIOMETRICS, isOwner, isGuardian })) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return res.json(student);
  })
);

// ── POST /api/students/:id/biometrics ───────────────────────────────────────
router.post(
  "/:id/biometrics",
  auth,
  requireConsent,
  asyncHandler(async (req, res) => {
    const studentId = Number(req.params.id);
    const { student, isOwner, isGuardian } = await resolveStudentAccess(studentId, req.user);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });
    if (!canAccessStudentByRole({ role: req.user.role, permission: PERMISSIONS.RECORD_BIOMETRICS, isOwner, isGuardian })) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { height, weight, fat, waist, imc, imcZone, waistZone } = req.body;
    if (!height || !weight || !imc || !imcZone) {
      return res.status(400).json({ error: "height, weight, imc e imcZone são obrigatórios." });
    }
    const result = await pool.query(
      `INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, imc, imc_zone, waist_zone, recorded_at`,
      [studentId, height, weight, fat ?? null, waist ?? null, imc, imcZone, waistZone ?? null]
    );
    return res.status(201).json(result.rows[0]);
  })
);

// ── GET /api/students/:id/biometrics ────────────────────────────────────────
router.get(
  "/:id/biometrics",
  auth,
  requireConsent,
  auditLog("read_biometrics"),
  asyncHandler(async (req, res) => {
    const studentId = Number(req.params.id);
    const { student, isOwner, isGuardian } = await resolveStudentAccess(studentId, req.user);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });
    if (!canAccessStudentByRole({ role: req.user.role, permission: PERMISSIONS.READ_BIOMETRICS, isOwner, isGuardian })) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const result = await pool.query(
      "SELECT * FROM biometrics WHERE student_id = $1 ORDER BY recorded_at DESC",
      [studentId]
    );
    return res.json(result.rows);
  })
);

// ── POST /api/students/:id/tests ─────────────────────────────────────────────
router.post(
  "/:id/tests",
  auth,  requireConsent,  asyncHandler(async (req, res) => {
    const studentId = Number(req.params.id);
    const { student, isOwner, isGuardian } = await resolveStudentAccess(studentId, req.user);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });
    if (!canAccessStudentByRole({ role: req.user.role, permission: PERMISSIONS.RECORD_TESTS, isOwner, isGuardian })) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { tests, sessionId } = req.body;
    if (!Array.isArray(tests) || tests.length === 0) {
      return res.status(400).json({ error: "Array de testes obrigatório." });
    }

    // ─── NEVER delete old records — always INSERT new rows ───────────────────
    // Each call creates a new set of test records (preserves full history).
    // Use sessionId to group a batch of tests into an evaluation session.
    const inserted = [];
    for (const t of tests) {
      // Try to parse numeric value; keep null if it's a time string (mm:ss)
      const numVal = !isNaN(Number(t.value)) ? Number(t.value) : null;
      const row = await pool.query(
        `INSERT INTO tests (student_id, session_id, test_id, value_num, value_text, unit, zone)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, test_id, value_text AS value, unit, zone, recorded_at`,
        [studentId, sessionId || null, t.id, numVal, String(t.value), t.unit || "", t.zone || "-"]
      );
      inserted.push(row.rows[0]);
    }
    return res.status(201).json(inserted);
  })
);

// ── GET /api/students/:id/tests ──────────────────────────────────────────────
router.get(
  "/:id/tests",
  auth,  requireConsent,  asyncHandler(async (req, res) => {
    const studentId = Number(req.params.id);
    const { student, isOwner, isGuardian } = await resolveStudentAccess(studentId, req.user);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });
    if (!canAccessStudentByRole({ role: req.user.role, permission: PERMISSIONS.READ_TESTS, isOwner, isGuardian })) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const result = await pool.query(
      `SELECT id, student_id, session_id, test_id,
              COALESCE(value_text, value_num::TEXT) AS value,
              value_text, value_num, unit, zone, recorded_at
       FROM tests WHERE student_id = $1 ORDER BY recorded_at DESC`,
      [studentId]
    );
    return res.json(result.rows);
  })
);

// ── POST /api/students/:id/questionnaires ────────────────────────────────────
router.post(
  "/:id/questionnaires",
  auth,
  asyncHandler(async (req, res) => {
    const studentId = Number(req.params.id);
    const { student, isOwner, isGuardian } = await resolveStudentAccess(studentId, req.user);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });
    if (!canAccessStudentByRole({ role: req.user.role, permission: PERMISSIONS.SUBMIT_QUESTIONNAIRES, isOwner, isGuardian })) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { type, payload, deferredCount } = req.body;
    if (!type || !payload) {
      return res.status(400).json({ error: "type e payload são obrigatórios." });
    }
    const result = await pool.query(
      `INSERT INTO questionnaires (student_id, type, payload, deferred_count)
       VALUES ($1,$2,$3,$4) RETURNING id, type, submitted_at`,
      [studentId, type, JSON.stringify(payload), deferredCount ?? 0]
    );
    return res.status(201).json(result.rows[0]);
  })
);

// ── GET /api/students/:id/questionnaires ─────────────────────────────────────
router.get(
  "/:id/questionnaires",
  auth,
  asyncHandler(async (req, res) => {
    const studentId = Number(req.params.id);
    const { student, isOwner, isGuardian } = await resolveStudentAccess(studentId, req.user);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });
    if (!canAccessStudentByRole({ role: req.user.role, permission: PERMISSIONS.READ_QUESTIONNAIRES, isOwner, isGuardian })) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const result = await pool.query(
      "SELECT id, type, payload, deferred_count, submitted_at FROM questionnaires WHERE student_id = $1 ORDER BY submitted_at DESC",
      [studentId]
    );
    return res.json(result.rows);
  })
);

// ── GET /api/students/:id/sos ─────────────────────────────────────────────────
router.get(
  "/:id/sos",
  auth,
  asyncHandler(async (req, res) => {
    const studentId = Number(req.params.id);
    const { student, isOwner, isGuardian } = await resolveStudentAccess(studentId, req.user);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });
    if (!canAccessStudentByRole({ role: req.user.role, permission: PERMISSIONS.READ_SOS, isOwner, isGuardian }) &&
        req.user.role !== "professor" && req.user.role !== "psicologo") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const result = await pool.query(
      "SELECT id, psych, teacher, created_at, resolved FROM sos_alerts WHERE student_id = $1 ORDER BY created_at DESC",
      [studentId]
    );
    return res.json(result.rows);
  })
);

// ── POST /api/students/:id/sos ────────────────────────────────────────────────
router.post(
  "/:id/sos",
  auth,
  asyncHandler(async (req, res) => {
    const studentId = Number(req.params.id);
    const { student, isOwner, isGuardian } = await resolveStudentAccess(studentId, req.user);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });
    if (!canAccessStudentByRole({ role: req.user.role, permission: PERMISSIONS.TRIGGER_SOS, isOwner, isGuardian })) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { psych, teacher, psychEmail, teacherEmail } = req.body;
    if (!psych || !teacher) {
      return res.status(400).json({ error: "psych e teacher são obrigatórios." });
    }
    const result = await pool.query(
      `INSERT INTO sos_alerts (student_id, psych, teacher, psych_email, teacher_email)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at`,
      [studentId, psych, teacher, psychEmail || null, teacherEmail || null]
    );

    // Send emails if configured
    const emailsSent = [];
    const emailBody = `Alerta SOS AtlanticoFit\n\nUm aluno necessita de apoio emocional urgente.\n\nEste alerta é confidencial.\n\nPor favor contacte o aluno com a maior brevidade possível.\n\nAtlanticoFit — Colégio Atlântico`;

    if (psychEmail) {
      try {
        await sendMail({ to: psychEmail, subject: "⚠️ Alerta SOS AtlanticoFit", text: emailBody });
        emailsSent.push(psychEmail);
      } catch (_) {}
    }
    if (teacherEmail) {
      try {
        await sendMail({ to: teacherEmail, subject: "⚠️ Alerta SOS AtlanticoFit", text: emailBody });
        emailsSent.push(teacherEmail);
      } catch (_) {}
    }

    return res.status(201).json({ ...result.rows[0], emailsSent });
  })
);

// ── POST /api/students/:id/reports/email ─────────────────────────────────────
router.post(
  "/:id/reports/email",
  auth,
  asyncHandler(async (req, res) => {
    const studentId = Number(req.params.id);
    const { student, isOwner, isGuardian } = await resolveStudentAccess(studentId, req.user);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });
    if (!canAccessStudentByRole({ role: req.user.role, permission: PERMISSIONS.SEND_REPORTS, isOwner, isGuardian })) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { content, email, schoolYear } = req.body;
    if (!content || !email) {
      return res.status(400).json({ error: "content e email são obrigatórios." });
    }

    // Save report metadata only — do NOT persist plain-text health data in the DB
    const saved = await pool.query(
      "INSERT INTO reports (student_id, title, emailed_to, school_year, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at",
      [studentId, `Relatório AtlanticoFit — ${student.name}`, email, schoolYear || null, req.user.id]
    );

    // Attempt email delivery
    try {
      await sendMail({
        to: email,
        subject: `Relatório AtlanticoFit — ${student.name}`,
        text: content,
      });
    } catch (err) {
      return res.status(207).json({ saved: saved.rows[0], emailError: err.message });
    }

    return res.json({ saved: saved.rows[0], emailSent: true });
  })
);

// ── POST /api/students/:id/dispensas ─────────────────────────────────────────
router.post(
  "/:id/dispensas",
  auth,
  requirePermission(PERMISSIONS.MANAGE_DISPENSAS),
  asyncHandler(async (req, res) => {
    const studentId = Number(req.params.id);
    const studentCheck = await pool.query("SELECT id FROM students WHERE id = $1", [studentId]);
    if (!studentCheck.rows[0]) return res.status(404).json({ error: "Aluno não encontrado." });

    const { reason, startDate, endDate, hasMedicalCertificate } = req.body;
    if (!reason || !startDate || !endDate) {
      return res.status(400).json({ error: "reason, startDate e endDate são obrigatórios." });
    }
    const result = await pool.query(
      `INSERT INTO dispensas (student_id, reason, start_date, end_date, medical_certificate, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, reason, start_date, end_date, medical_certificate, created_at`,
      [studentId, reason, startDate, endDate, Boolean(hasMedicalCertificate), req.user.id]
    );
    return res.status(201).json(result.rows[0]);
  })
);

// ── GET /api/students/:id/dispensas ──────────────────────────────────────────
router.get(
  "/:id/dispensas",
  auth,
  asyncHandler(async (req, res) => {
    const studentId = Number(req.params.id);
    const { student, isOwner, isGuardian } = await resolveStudentAccess(studentId, req.user);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });
    if (req.user.role !== "professor" && !isOwner && !isGuardian) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const result = await pool.query(
      "SELECT * FROM dispensas WHERE student_id = $1 ORDER BY start_date DESC",
      [studentId]
    );
    return res.json(result.rows);
  })
);

// ── PATCH /api/students/sos/:alertId — mark alert resolved ─────────────────
router.patch(
  "/sos/:alertId",
  auth,
  asyncHandler(async (req, res) => {
    const { role, id: userId } = req.user;
    if (role !== "professor" && role !== "psicologo") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const alertId = Number(req.params.alertId);
    const result = await pool.query(
      "UPDATE sos_alerts SET resolved = true, resolved_at = NOW(), resolved_by = $1 WHERE id = $2 RETURNING id, resolved, resolved_at",
      [userId, alertId]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Alerta não encontrado." });
    return res.json(result.rows[0]);
  })
);

module.exports = router;
