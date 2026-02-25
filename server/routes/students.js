const express = require("express");
const pool = require("../db");
const { auth } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { asyncHandler } = require("../utils/async-handler");
const { sendMail } = require("../services/mailer");
const { PERMISSIONS, canAccessStudentByRole } = require("../utils/rbac");

const router = express.Router();

const parseStudentId = (raw) => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const loadStudent = async (studentId) => {
  const result = await pool.query("SELECT id, name, user_id, school_year FROM students WHERE id = $1", [studentId]);
  return result.rows[0] || null;
};

const isGuardianOfStudent = async (studentId, userId) => {
  const result = await pool.query(
    "SELECT 1 FROM student_guardians WHERE student_id = $1 AND guardian_user_id = $2 LIMIT 1",
    [studentId, userId]
  );
  return result.rows.length > 0;
};

const requireStudentAccess = async (req, res, permission) => {
  const studentId = parseStudentId(req.params.id);
  if (!studentId) {
    res.status(400).json({ error: "ID inválido" });
    return null;
  }

  const student = await loadStudent(studentId);
  if (!student) {
    res.status(404).json({ error: "Aluno nao encontrado" });
    return null;
  }

  const isOwner = student.user_id === req.user.id;
  const isGuardian = req.user.role === "pais" ? await isGuardianOfStudent(student.id, req.user.id) : false;

  if (!canAccessStudentByRole({ role: req.user.role, permission, isOwner, isGuardian })) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  return student;
};

router.post(
  "/",
  auth,
  requirePermission(PERMISSIONS.CREATE_STUDENT),
  asyncHandler(async (req, res) => {
    const { name, sex, age, schoolYear } = req.body;
    if (!name || !sex || !age) return res.status(400).json({ error: "Missing fields" });
    if (!["F", "M"].includes(sex)) return res.status(400).json({ error: "Sexo inválido" });

    const ownerUserId = req.user.role === "professor" ? Number(req.body.ownerUserId || req.user.id) : req.user.id;
    const result = await pool.query(
      "INSERT INTO students (user_id, name, sex, age, school_year) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [ownerUserId, name, sex, Number(age), schoolYear || null]
    );
    return res.json(result.rows[0]);
  })
);

router.get(
  "/",
  auth,
  requirePermission(PERMISSIONS.LIST_STUDENTS),
  asyncHandler(async (req, res) => {
    if (req.user.role === "professor" || req.user.role === "psicologo") {
      const result = await pool.query("SELECT * FROM students ORDER BY created_at DESC");
      return res.json(result.rows);
    }

    if (req.user.role === "pais") {
      const result = await pool.query(
        `SELECT s.*
         FROM students s
         JOIN student_guardians sg ON s.id = sg.student_id
         WHERE sg.guardian_user_id = $1
         ORDER BY s.created_at DESC`,
        [req.user.id]
      );
      return res.json(result.rows);
    }

    const result = await pool.query("SELECT * FROM students WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]);
    return res.json(result.rows);
  })
);

router.get(
  "/linked",
  auth,
  requirePermission(PERMISSIONS.READ_LINKED_STUDENTS),
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT s.*, sg.relationship
       FROM students s
       JOIN student_guardians sg ON s.id = sg.student_id
       WHERE sg.guardian_user_id = $1
       ORDER BY s.name ASC`,
      [req.user.id]
    );
    return res.json(result.rows);
  })
);

router.get(
  "/:id/guardians",
  auth,
  requirePermission(PERMISSIONS.MANAGE_GUARDIANS),
  asyncHandler(async (req, res) => {
    const studentId = parseStudentId(req.params.id);
    if (!studentId) return res.status(400).json({ error: "ID inválido" });

    const student = await loadStudent(studentId);
    if (!student) return res.status(404).json({ error: "Aluno nao encontrado" });

    const result = await pool.query(
      `SELECT sg.id, sg.relationship, sg.created_at, u.id AS user_id, u.email
       FROM student_guardians sg
       JOIN users u ON u.id = sg.guardian_user_id
       WHERE sg.student_id = $1
       ORDER BY sg.created_at DESC`,
      [studentId]
    );
    return res.json(result.rows);
  })
);

router.post(
  "/:id/guardians",
  auth,
  requirePermission(PERMISSIONS.MANAGE_GUARDIANS),
  asyncHandler(async (req, res) => {
    const studentId = parseStudentId(req.params.id);
    if (!studentId) return res.status(400).json({ error: "ID inválido" });

    const student = await loadStudent(studentId);
    if (!student) return res.status(404).json({ error: "Aluno nao encontrado" });

    const { guardianEmail, relationship } = req.body;
    if (!guardianEmail) return res.status(400).json({ error: "guardianEmail é obrigatório" });

    const userRow = await pool.query("SELECT id, role FROM users WHERE email = $1", [guardianEmail]);
    const guardian = userRow.rows[0];
    if (!guardian) return res.status(404).json({ error: "Utilizador encarregado não encontrado" });
    if (guardian.role !== "pais") return res.status(400).json({ error: "O utilizador tem de ter perfil 'pais'" });

    const result = await pool.query(
      `INSERT INTO student_guardians (student_id, guardian_user_id, relationship, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (student_id, guardian_user_id)
       DO UPDATE SET relationship = EXCLUDED.relationship
       RETURNING *`,
      [studentId, guardian.id, relationship || "encarregado", req.user.id]
    );
    return res.json(result.rows[0]);
  })
);

router.post(
  "/:id/biometrics",
  auth,
  asyncHandler(async (req, res) => {
    const student = await requireStudentAccess(req, res, PERMISSIONS.RECORD_BIOMETRICS);
    if (!student) return;

    const { height, weight, fat, waist, imc, imcZone, waistZone } = req.body;
    if (!height || !weight || !imc || !imcZone) return res.status(400).json({ error: "Missing fields" });

    const result = await pool.query(
      "INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [student.id, height, weight, fat || null, waist || null, imc, imcZone, waistZone || null]
    );
    return res.json(result.rows[0]);
  })
);

router.get(
  "/:id/biometrics",
  auth,
  asyncHandler(async (req, res) => {
    const student = await requireStudentAccess(req, res, PERMISSIONS.READ_BIOMETRICS);
    if (!student) return;
    const result = await pool.query("SELECT * FROM biometrics WHERE student_id = $1 ORDER BY recorded_at DESC LIMIT 30", [
      student.id,
    ]);
    return res.json(result.rows);
  })
);

router.post(
  "/:id/tests",
  auth,
  asyncHandler(async (req, res) => {
    const student = await requireStudentAccess(req, res, PERMISSIONS.RECORD_TESTS);
    if (!student) return;
    const { tests } = req.body;
    if (!Array.isArray(tests) || tests.length === 0) return res.status(400).json({ error: "Tests invalid" });

    const inserted = [];
    for (const test of tests) {
      if (!test?.id || test?.value === undefined || !test?.unit || !test?.zone) continue;
      const result = await pool.query(
        "INSERT INTO tests (student_id, test_id, value, unit, zone) VALUES ($1,$2,$3,$4,$5) RETURNING *",
        [student.id, test.id, String(test.value), test.unit, test.zone]
      );
      inserted.push(result.rows[0]);
    }
    return res.json(inserted);
  })
);

router.get(
  "/:id/tests",
  auth,
  asyncHandler(async (req, res) => {
    const student = await requireStudentAccess(req, res, PERMISSIONS.READ_TESTS);
    if (!student) return;
    const result = await pool.query("SELECT * FROM tests WHERE student_id = $1 ORDER BY recorded_at DESC LIMIT 80", [
      student.id,
    ]);
    return res.json(result.rows);
  })
);

router.post(
  "/:id/questionnaires",
  auth,
  asyncHandler(async (req, res) => {
    const student = await requireStudentAccess(req, res, PERMISSIONS.SUBMIT_QUESTIONNAIRES);
    if (!student) return;
    const { type, payload, deferredCount } = req.body;
    if (!type || !payload) return res.status(400).json({ error: "Missing fields" });

    const result = await pool.query(
      "INSERT INTO questionnaires (student_id, type, payload, deferred_count) VALUES ($1,$2,$3,$4) RETURNING *",
      [student.id, type, payload, deferredCount || 0]
    );
    return res.json(result.rows[0]);
  })
);

router.get(
  "/:id/questionnaires",
  auth,
  asyncHandler(async (req, res) => {
    const student = await requireStudentAccess(req, res, PERMISSIONS.READ_QUESTIONNAIRES);
    if (!student) return;
    const result = await pool.query(
      "SELECT * FROM questionnaires WHERE student_id = $1 ORDER BY submitted_at DESC LIMIT 50",
      [student.id]
    );
    return res.json(result.rows);
  })
);

router.post(
  "/:id/sos",
  auth,
  asyncHandler(async (req, res) => {
    const student = await requireStudentAccess(req, res, PERMISSIONS.TRIGGER_SOS);
    if (!student) return;

    const { psych, teacher, psychEmail, teacherEmail } = req.body;
    if (!psych || !teacher) return res.status(400).json({ error: "Missing fields" });

    const result = await pool.query(
      "INSERT INTO sos_alerts (student_id, psych, teacher, psych_email, teacher_email) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [student.id, psych, teacher, psychEmail || null, teacherEmail || null]
    );

    const now = new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" });
    const studentName = student.name || "Aluno";
    const sosText = `ALERTA SOS - SAUDE MENTAL\nAluno: ${studentName}\nData/Hora: ${now}\nPsicologo: ${psych}\nProfessor: ${teacher}`;
    const sosHtml = `<p><strong>Alerta SOS Saúde Mental</strong></p><p>Aluno: ${studentName}</p><p>Data/Hora: ${now}</p>`;

    const emailsSent = [];
    for (const [recipientEmail, recipientName] of [
      [psychEmail, psych],
      [teacherEmail, teacher],
    ]) {
      if (!recipientEmail) continue;
      try {
        await sendMail({
          to: `${recipientName} <${recipientEmail}>`,
          subject: `Alerta SOS Saude Mental - ${studentName} - AtlanticoFit`,
          text: sosText,
          html: sosHtml,
          priority: "high",
        });
        emailsSent.push(recipientEmail);
      } catch (_) {}
    }

    return res.json({ ...result.rows[0], emailsSent });
  })
);

router.get(
  "/:id/sos",
  auth,
  asyncHandler(async (req, res) => {
    const student = await requireStudentAccess(req, res, PERMISSIONS.READ_SOS);
    if (!student) return;
    const result = await pool.query("SELECT * FROM sos_alerts WHERE student_id = $1 ORDER BY created_at DESC LIMIT 50", [
      student.id,
    ]);
    return res.json(result.rows);
  })
);

router.post(
  "/:id/reports/email",
  auth,
  asyncHandler(async (req, res) => {
    const student = await requireStudentAccess(req, res, PERMISSIONS.SEND_REPORTS);
    if (!student) return;
    const { content, email } = req.body;
    if (!content || !email) return res.status(400).json({ error: "Missing fields" });

    await sendMail({
      to: email,
      subject: "Relatorio AtlanticoFit - Avaliacao Fisica",
      text: content,
      html: `<pre style="white-space:pre-wrap">${String(content).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`,
    });

    const result = await pool.query(
      "INSERT INTO reports (student_id, content, emailed_to) VALUES ($1,$2,$3) RETURNING *",
      [student.id, content, email]
    );
    return res.json(result.rows[0]);
  })
);

router.get(
  "/:id/reports",
  auth,
  asyncHandler(async (req, res) => {
    const student = await requireStudentAccess(req, res, PERMISSIONS.READ_REPORTS);
    if (!student) return;
    const result = await pool.query("SELECT * FROM reports WHERE student_id = $1 ORDER BY created_at DESC LIMIT 20", [
      student.id,
    ]);
    return res.json(result.rows);
  })
);

router.post(
  "/:id/dispensas",
  auth,
  requirePermission(PERMISSIONS.MANAGE_DISPENSAS),
  asyncHandler(async (req, res) => {
    const studentId = parseStudentId(req.params.id);
    if (!studentId) return res.status(400).json({ error: "ID inválido" });
    const student = await loadStudent(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const { reason, startDate, endDate, hasMedicalCertificate } = req.body;
    if (!reason || !startDate || !endDate) return res.status(400).json({ error: "Missing fields" });

    const result = await pool.query(
      "INSERT INTO dispensas (student_id, reason, start_date, end_date, medical_certificate, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [student.id, reason, startDate, endDate, Boolean(hasMedicalCertificate), req.user.id]
    );
    return res.json(result.rows[0]);
  })
);

router.get(
  "/:id/dispensas",
  auth,
  requirePermission(PERMISSIONS.MANAGE_DISPENSAS),
  asyncHandler(async (req, res) => {
    const studentId = parseStudentId(req.params.id);
    if (!studentId) return res.status(400).json({ error: "ID inválido" });
    const result = await pool.query(
      "SELECT d.*, u.email as created_by_email FROM dispensas d LEFT JOIN users u ON d.created_by = u.id WHERE d.student_id = $1 ORDER BY d.created_at DESC",
      [studentId]
    );
    return res.json(result.rows);
  })
);

module.exports = router;
