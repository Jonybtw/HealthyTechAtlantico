CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  consent_rgpd BOOLEAN DEFAULT FALSE,
  consent_share BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  role_key TEXT PRIMARY KEY,
  role_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
  permission_key TEXT PRIMARY KEY,
  description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_key TEXT NOT NULL REFERENCES roles(role_key) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES permissions(permission_key) ON DELETE CASCADE,
  PRIMARY KEY (role_key, permission_key)
);

CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sex TEXT NOT NULL,
  age INT NOT NULL,
  school_year TEXT,
  class_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS biometrics (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  height_m NUMERIC(4,2) NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  fat_pct NUMERIC(4,1),
  waist_cm NUMERIC(5,1),
  imc NUMERIC(4,1) NOT NULL,
  imc_zone TEXT NOT NULL,
  waist_zone TEXT,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tests (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT NOT NULL,
  zone TEXT NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questionnaires (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  deferred_count INT DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sos_alerts (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  psych TEXT NOT NULL,
  teacher TEXT NOT NULL,
  psych_email TEXT,
  teacher_email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  emailed_to TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispensas (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  medical_certificate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by BIGINT NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS student_guardians (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  guardian_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'encarregado',
  created_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, guardian_user_id)
);

CREATE INDEX IF NOT EXISTS idx_student_guardians_student_id ON student_guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_student_guardians_guardian_user_id ON student_guardians(guardian_user_id);

INSERT INTO roles (role_key, role_name)
VALUES
  ('aluno', 'Aluno'),
  ('professor', 'Professor'),
  ('psicologo', 'Psicologo'),
  ('pais', 'Pais')
ON CONFLICT (role_key) DO NOTHING;

INSERT INTO permissions (permission_key, description)
VALUES
  ('create_student', 'Criar aluno'),
  ('list_students', 'Listar alunos'),
  ('record_biometrics', 'Registar biometria'),
  ('read_biometrics', 'Ler biometria'),
  ('record_tests', 'Registar testes'),
  ('read_tests', 'Ler testes'),
  ('submit_questionnaires', 'Submeter questionarios'),
  ('read_questionnaires', 'Ler questionarios'),
  ('trigger_sos', 'Ativar SOS'),
  ('read_sos', 'Ler SOS'),
  ('send_reports', 'Enviar relatorios'),
  ('read_reports', 'Ler relatorios'),
  ('manage_dispensas', 'Gerir dispensas'),
  ('read_class_reports', 'Ler relatorios de turma'),
  ('manage_guardians', 'Gerir encarregados'),
  ('read_linked_students', 'Ler alunos ligados')
ON CONFLICT (permission_key) DO NOTHING;

INSERT INTO role_permissions (role_key, permission_key)
VALUES
  ('aluno', 'create_student'),
  ('aluno', 'list_students'),
  ('aluno', 'record_biometrics'),
  ('aluno', 'read_biometrics'),
  ('aluno', 'record_tests'),
  ('aluno', 'read_tests'),
  ('aluno', 'submit_questionnaires'),
  ('aluno', 'read_questionnaires'),
  ('aluno', 'trigger_sos'),
  ('aluno', 'read_sos'),
  ('aluno', 'send_reports'),
  ('aluno', 'read_reports'),

  ('professor', 'create_student'),
  ('professor', 'list_students'),
  ('professor', 'record_biometrics'),
  ('professor', 'read_biometrics'),
  ('professor', 'record_tests'),
  ('professor', 'read_tests'),
  ('professor', 'submit_questionnaires'),
  ('professor', 'read_questionnaires'),
  ('professor', 'trigger_sos'),
  ('professor', 'read_sos'),
  ('professor', 'send_reports'),
  ('professor', 'read_reports'),
  ('professor', 'manage_dispensas'),
  ('professor', 'read_class_reports'),
  ('professor', 'manage_guardians'),
  ('professor', 'read_linked_students'),

  ('psicologo', 'list_students'),
  ('psicologo', 'read_sos'),
  ('psicologo', 'read_reports'),

  ('pais', 'list_students'),
  ('pais', 'read_biometrics'),
  ('pais', 'read_tests'),
  ('pais', 'read_questionnaires'),
  ('pais', 'read_reports'),
  ('pais', 'read_linked_students')
ON CONFLICT (role_key, permission_key) DO NOTHING;

-- Migration: run these if upgrading an existing database
-- ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS psych_email TEXT;
-- ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS teacher_email TEXT;
-- ALTER TABLE students ADD COLUMN IF NOT EXISTS class_name TEXT;
-- CREATE TABLE IF NOT EXISTS student_guardians (...);

-- ------------------------------------------------------------
-- Seed data (optional) for local testing
-- Password for all test users: Password123!
-- ------------------------------------------------------------

INSERT INTO users (email, password_hash, role, consent_rgpd, consent_share)
VALUES
  ('prof.demo@colegio.pt', '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'professor', TRUE, TRUE),
  ('aluno.demo@colegio.pt', '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE),
  ('aluna.demo@colegio.pt', '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, FALSE),
  ('psi.demo@colegio.pt', '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'psicologo', TRUE, TRUE),
  ('pai.demo@colegio.pt', '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'pais', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO students (user_id, name, sex, age, school_year, class_name)
SELECT u.id, 'Joao Silva', 'M', 13, '2025/2026', '8A'
FROM users u
WHERE u.email = 'aluno.demo@colegio.pt'
  AND NOT EXISTS (
    SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Joao Silva'
  );

INSERT INTO students (user_id, name, sex, age, school_year, class_name)
SELECT u.id, 'Maria Costa', 'F', 14, '2025/2026', '8A'
FROM users u
WHERE u.email = 'prof.demo@colegio.pt'
  AND NOT EXISTS (
    SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Maria Costa'
  );

INSERT INTO student_guardians (student_id, guardian_user_id, relationship, created_by)
SELECT s.id, gp.id, 'Pai', p.id
FROM students s
JOIN users gp ON gp.email = 'pai.demo@colegio.pt'
JOIN users p ON p.email = 'prof.demo@colegio.pt'
WHERE s.name = 'Joao Silva'
  AND NOT EXISTS (
    SELECT 1 FROM student_guardians sg
    WHERE sg.student_id = s.id AND sg.guardian_user_id = gp.id
  );

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.58, 50.2, 17.1, 70.0, 20.1, 'Zona Saudavel', 'Zona Saudavel'
FROM students s
WHERE s.name = 'Joao Silva'
  AND NOT EXISTS (
    SELECT 1 FROM biometrics b
    WHERE b.student_id = s.id AND b.imc = 20.1
  );

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.61, 66.0, 27.0, 83.0, 25.5, 'Zona de Melhoria', 'Zona de Melhoria'
FROM students s
WHERE s.name = 'Maria Costa'
  AND NOT EXISTS (
    SELECT 1 FROM biometrics b
    WHERE b.student_id = s.id AND b.imc = 25.5
  );

INSERT INTO tests (student_id, test_id, value, unit, zone)
SELECT s.id, t.test_id, t.value, t.unit, t.zone
FROM students s
JOIN (
  VALUES
    ('vai', '38', 'percursos', 'Zona Saudavel'),
    ('milha', '09:45', 'mm:ss', 'Zona Saudavel'),
    ('abd', '34', 'reps', 'Zona Saudavel'),
    ('senta', '26', 'cm', 'Zona Saudavel')
) AS t(test_id, value, unit, zone) ON true
WHERE s.name = 'Joao Silva'
  AND NOT EXISTS (
    SELECT 1 FROM tests x
    WHERE x.student_id = s.id AND x.test_id = t.test_id AND x.value = t.value
  );

INSERT INTO questionnaires (student_id, type, payload, deferred_count)
SELECT s.id, 'initial', '{"activity":"3","sleep":"7-8","sport":"futsal"}'::jsonb, 1
FROM students s
WHERE s.name = 'Joao Silva'
  AND NOT EXISTS (
    SELECT 1 FROM questionnaires q
    WHERE q.student_id = s.id AND q.type = 'initial'
  );

INSERT INTO questionnaires (student_id, type, payload, deferred_count)
SELECT s.id, 'routine', '{"stress":"4","food":"sim","mood":"4","energy":"4","screen":"2-4","hydration":"boa"}'::jsonb, 1
FROM students s
WHERE s.name = 'Joao Silva'
  AND NOT EXISTS (
    SELECT 1 FROM questionnaires q
    WHERE q.student_id = s.id AND q.type = 'routine'
  );

INSERT INTO sos_alerts (student_id, psych, teacher, psych_email, teacher_email, resolved)
SELECT s.id, 'Dra. Sofia Rocha', 'Prof. Nuno Melo', 'psi.demo@colegio.pt', 'prof.demo@colegio.pt', FALSE
FROM students s
WHERE s.name = 'Joao Silva'
  AND NOT EXISTS (
    SELECT 1 FROM sos_alerts a
    WHERE a.student_id = s.id
  );

INSERT INTO reports (student_id, content, emailed_to)
SELECT s.id, 'Relatorio de teste AtlanticoFit para validacao de fluxo.', 'pai.demo@colegio.pt'
FROM students s
WHERE s.name = 'Joao Silva'
  AND NOT EXISTS (
    SELECT 1 FROM reports r
    WHERE r.student_id = s.id
  );

INSERT INTO dispensas (student_id, reason, start_date, end_date, medical_certificate, created_by)
SELECT s.id, 'Lesao no tornozelo', DATE '2026-01-12', DATE '2026-01-26', TRUE, p.id
FROM students s
JOIN users p ON p.email = 'prof.demo@colegio.pt'
WHERE s.name = 'Maria Costa'
  AND NOT EXISTS (
    SELECT 1 FROM dispensas d
    WHERE d.student_id = s.id AND d.reason = 'Lesao no tornozelo'
  );
