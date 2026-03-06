CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  consent_rgpd BOOLEAN DEFAULT FALSE,
  consent_share BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
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

-- ── Academic years ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_years (
  id BIGSERIAL PRIMARY KEY,
  label TEXT UNIQUE NOT NULL  -- e.g. '2025/2026'
);

-- ── School classes ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school_classes (
  id BIGSERIAL PRIMARY KEY,
  academic_year_id BIGINT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,       -- e.g. '8A'
  UNIQUE(academic_year_id, name)
);

CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('M', 'F')),
  -- birth_date replaces age INT: age is now calculated dynamically
  birth_date DATE,
  -- Legacy age column kept for backwards compatibility; prefer birth_date
  age INT CHECK (age BETWEEN 5 AND 25),
  school_year TEXT,
  class_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ── Evaluation sessions ──────────────────────────────────────────────────────
-- Groups a set of biometrics + tests into a named evaluation period
CREATE TABLE IF NOT EXISTS evaluation_sessions (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Avaliação',  -- e.g. 'Diagnóstica Out/2025'
  school_year TEXT,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS biometrics (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id BIGINT REFERENCES evaluation_sessions(id) ON DELETE SET NULL,
  height_m NUMERIC(4,2) NOT NULL CHECK (height_m BETWEEN 0.50 AND 2.50),
  weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg BETWEEN 5 AND 300),
  fat_pct NUMERIC(4,1) CHECK (fat_pct BETWEEN 0 AND 70),
  waist_cm NUMERIC(5,1) CHECK (waist_cm BETWEEN 30 AND 200),
  imc NUMERIC(4,1) NOT NULL CHECK (imc BETWEEN 5 AND 70),
  imc_zone TEXT NOT NULL,
  fat_zone TEXT,
  waist_zone TEXT,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tests (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id BIGINT REFERENCES evaluation_sessions(id) ON DELETE SET NULL,
  test_id TEXT NOT NULL,
  -- value stored as NUMERIC where possible; TEXT kept for time values (mm:ss)
  value_num NUMERIC,
  value_text TEXT NOT NULL,
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
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by BIGINT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  -- Store only metadata; full content is ephemeral and must not be persisted in plain text
  title TEXT NOT NULL DEFAULT 'Relatório AtlanticoFit',
  emailed_to TEXT NOT NULL,
  school_year TEXT,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispensas (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date >= start_date),
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

-- ── Audit log (RGPD compliance) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,          -- e.g. 'read_biometrics', 'trigger_sos'
  target_id BIGINT,              -- student_id or other entity
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── Safe idempotent migrations (run on every startup; all use IF NOT EXISTS) ──
-- Adds new columns to existing tables without breaking a fresh install.

ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS psych_email TEXT;
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS teacher_email TEXT;
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS resolved_by BIGINT REFERENCES users(id);

ALTER TABLE biometrics ADD COLUMN IF NOT EXISTS session_id BIGINT REFERENCES evaluation_sessions(id) ON DELETE SET NULL;
ALTER TABLE biometrics ADD COLUMN IF NOT EXISTS fat_zone TEXT;

-- Rename tests.value → tests.value_text (only if 'value' column still exists)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'value'
  ) THEN
    ALTER TABLE tests RENAME COLUMN value TO value_text;
  END IF;
END $$;

ALTER TABLE tests ADD COLUMN IF NOT EXISTS session_id BIGINT REFERENCES evaluation_sessions(id) ON DELETE SET NULL;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS value_num NUMERIC;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS title TEXT;
UPDATE reports SET title = 'Relatório AtlanticoFit' WHERE title IS NULL;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS school_year TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id);
-- Make legacy content column nullable so new inserts (without content) succeed
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'content'
  ) THEN
    ALTER TABLE reports ALTER COLUMN content DROP NOT NULL;
  END IF;
END $$;

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_student_guardians_student_id    ON student_guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_student_guardians_guardian_user ON student_guardians(guardian_user_id);
CREATE INDEX IF NOT EXISTS idx_biometrics_student_recorded     ON biometrics(student_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_tests_student_recorded          ON tests(student_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_sos_student                     ON sos_alerts(student_id, resolved);
CREATE INDEX IF NOT EXISTS idx_audit_log_user                  ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_school_year            ON students(school_year);
CREATE INDEX IF NOT EXISTS idx_students_user_id                ON students(user_id);

-- session_id indexes: only safe after the ALTER TABLE above has added the columns
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'session_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tests_student_session
      ON tests(student_id, session_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'biometrics' AND column_name = 'session_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_biometrics_student_session
      ON biometrics(student_id, session_id);
  END IF;
END $$;

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

-- ------------------------------------------------------------
-- Seed data for local development / demo ONLY
-- DO NOT run this in production.
-- Staff accounts must be created via: POST /api/auth/admin/create-staff
-- with the ADMIN_SECRET environment variable.
-- All demo passwords are: demo1234
-- ------------------------------------------------------------

-- ── Staff & parent accounts ──────────────────────────────────────────────────
INSERT INTO users (email, password_hash, role, consent_rgpd, consent_share)
VALUES
  ('prof.demo@colegio.pt',   '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'professor',  TRUE, TRUE),
  ('prof2.demo@colegio.pt',  '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'professor',  TRUE, TRUE),
  ('psi.demo@colegio.pt',    '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'psicologo',  TRUE, TRUE),
  ('pai.demo@colegio.pt',    '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'pais',       TRUE, TRUE),
  ('mae.demo@colegio.pt',    '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'pais',       TRUE, TRUE),
  ('pai2.demo@colegio.pt',   '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'pais',       TRUE, FALSE)
ON CONFLICT (email) DO NOTHING;

-- ── Aluno accounts (one per student for demo) ────────────────────────────────
INSERT INTO users (email, password_hash, role, consent_rgpd, consent_share) VALUES
  ('joao.silva@aluno.pt',       '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE),
  ('maria.costa@aluno.pt',      '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, FALSE),
  ('tiago.ferreira@aluno.pt',   '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE),
  ('beatriz.santos@aluno.pt',   '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE),
  ('miguel.pereira@aluno.pt',   '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE),
  ('ana.rodrigues@aluno.pt',    '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE),
  ('diogo.oliveira@aluno.pt',   '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, FALSE),
  ('carolina.mendes@aluno.pt',  '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE),
  ('rafael.almeida@aluno.pt',   '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE),
  ('ines.martins@aluno.pt',     '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE),
  ('pedro.sousa@aluno.pt',      '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE),
  ('leonor.ribeiro@aluno.pt',   '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, FALSE),
  ('gabriel.monteiro@aluno.pt', '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE),
  ('mariana.lopes@aluno.pt',    '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE),
  ('bernardo.cardoso@aluno.pt', '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE),
  ('sofia.tavares@aluno.pt',    '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE),
  ('andre.vieira@aluno.pt',     '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE),
  ('matilde.pinto@aluno.pt',    '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, FALSE),
  ('henrique.neves@aluno.pt',   '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE),
  ('alice.correia@aluno.pt',    '$2a$10$XPvpE8FdWlFJkMmrGJnLL.x96P.6Ajj9UcjfwumLBawaPt1oOTUUC', 'aluno', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- ── Academic years ───────────────────────────────────────────────────────────
INSERT INTO academic_years (label) VALUES
  ('2023/2024'), ('2024/2025'), ('2025/2026')
ON CONFLICT (label) DO NOTHING;

-- ── School classes ───────────────────────────────────────────────────────────
INSERT INTO school_classes (academic_year_id, name)
SELECT ay.id, c.name
FROM academic_years ay
JOIN (VALUES ('8A'), ('8B'), ('9A'), ('9B')) AS c(name) ON true
WHERE ay.label = '2025/2026'
ON CONFLICT (academic_year_id, name) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- 20 students: 5 per class (8A, 8B, 9A, 9B) — 2025/2026
-- birth_date used so age is computed dynamically
-- ══════════════════════════════════════════════════════════════════════════════

-- Helper: insert student only if not already present for that user
-- 8A — 5 students
INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Joao Silva', 'M', DATE '2012-03-15', 13, '2025/2026', '8A'
FROM users u WHERE u.email = 'joao.silva@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Joao Silva');

INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Maria Costa', 'F', DATE '2011-09-22', 14, '2025/2026', '8A'
FROM users u WHERE u.email = 'maria.costa@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Maria Costa');

INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Tiago Ferreira', 'M', DATE '2012-06-08', 13, '2025/2026', '8A'
FROM users u WHERE u.email = 'tiago.ferreira@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Tiago Ferreira');

INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Beatriz Santos', 'F', DATE '2012-01-30', 14, '2025/2026', '8A'
FROM users u WHERE u.email = 'beatriz.santos@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Beatriz Santos');

INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Miguel Pereira', 'M', DATE '2012-11-04', 13, '2025/2026', '8A'
FROM users u WHERE u.email = 'miguel.pereira@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Miguel Pereira');

-- 8B — 5 students
INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Ana Rodrigues', 'F', DATE '2012-04-18', 13, '2025/2026', '8B'
FROM users u WHERE u.email = 'ana.rodrigues@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Ana Rodrigues');

INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Diogo Oliveira', 'M', DATE '2012-08-25', 13, '2025/2026', '8B'
FROM users u WHERE u.email = 'diogo.oliveira@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Diogo Oliveira');

INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Carolina Mendes', 'F', DATE '2011-12-11', 14, '2025/2026', '8B'
FROM users u WHERE u.email = 'carolina.mendes@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Carolina Mendes');

INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Rafael Almeida', 'M', DATE '2012-02-14', 13, '2025/2026', '8B'
FROM users u WHERE u.email = 'rafael.almeida@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Rafael Almeida');

INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Ines Martins', 'F', DATE '2012-07-03', 13, '2025/2026', '8B'
FROM users u WHERE u.email = 'ines.martins@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Ines Martins');

-- 9A — 5 students
INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Pedro Sousa', 'M', DATE '2011-05-20', 14, '2025/2026', '9A'
FROM users u WHERE u.email = 'pedro.sousa@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Pedro Sousa');

INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Leonor Ribeiro', 'F', DATE '2011-10-16', 14, '2025/2026', '9A'
FROM users u WHERE u.email = 'leonor.ribeiro@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Leonor Ribeiro');

INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Gabriel Monteiro', 'M', DATE '2011-01-09', 15, '2025/2026', '9A'
FROM users u WHERE u.email = 'gabriel.monteiro@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Gabriel Monteiro');

INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Mariana Lopes', 'F', DATE '2011-06-27', 14, '2025/2026', '9A'
FROM users u WHERE u.email = 'mariana.lopes@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Mariana Lopes');

INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Bernardo Cardoso', 'M', DATE '2011-03-31', 14, '2025/2026', '9A'
FROM users u WHERE u.email = 'bernardo.cardoso@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Bernardo Cardoso');

-- 9B — 5 students
INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Sofia Tavares', 'F', DATE '2011-08-05', 14, '2025/2026', '9B'
FROM users u WHERE u.email = 'sofia.tavares@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Sofia Tavares');

INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Andre Vieira', 'M', DATE '2011-11-19', 14, '2025/2026', '9B'
FROM users u WHERE u.email = 'andre.vieira@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Andre Vieira');

INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Matilde Pinto', 'F', DATE '2011-04-12', 14, '2025/2026', '9B'
FROM users u WHERE u.email = 'matilde.pinto@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Matilde Pinto');

INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Henrique Neves', 'M', DATE '2011-02-23', 15, '2025/2026', '9B'
FROM users u WHERE u.email = 'henrique.neves@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Henrique Neves');

INSERT INTO students (user_id, name, sex, birth_date, age, school_year, class_name)
SELECT u.id, 'Alice Correia', 'F', DATE '2011-07-14', 14, '2025/2026', '9B'
FROM users u WHERE u.email = 'alice.correia@aluno.pt'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.name = 'Alice Correia');

-- ══════════════════════════════════════════════════════════════════════════════
-- Guardian links (3 families)
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO student_guardians (student_id, guardian_user_id, relationship, created_by)
SELECT s.id, gp.id, 'Pai', p.id
FROM students s
JOIN users gp ON gp.email = 'pai.demo@colegio.pt'
JOIN users p  ON p.email  = 'prof.demo@colegio.pt'
WHERE s.name = 'Joao Silva'
  AND NOT EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = s.id AND sg.guardian_user_id = gp.id);

INSERT INTO student_guardians (student_id, guardian_user_id, relationship, created_by)
SELECT s.id, gp.id, 'Mae', p.id
FROM students s
JOIN users gp ON gp.email = 'mae.demo@colegio.pt'
JOIN users p  ON p.email  = 'prof.demo@colegio.pt'
WHERE s.name = 'Beatriz Santos'
  AND NOT EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = s.id AND sg.guardian_user_id = gp.id);

INSERT INTO student_guardians (student_id, guardian_user_id, relationship, created_by)
SELECT s.id, gp.id, 'Pai', p.id
FROM students s
JOIN users gp ON gp.email = 'pai2.demo@colegio.pt'
JOIN users p  ON p.email  = 'prof.demo@colegio.pt'
WHERE s.name = 'Pedro Sousa'
  AND NOT EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = s.id AND sg.guardian_user_id = gp.id);

-- ══════════════════════════════════════════════════════════════════════════════
-- Biometrics — all 20 students, realistic values
-- ══════════════════════════════════════════════════════════════════════════════
-- 8A
INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.58, 50.2, 17.1, 70.0, 20.1, 'Zona Saudavel', 'Zona Saudavel'
FROM students s WHERE s.name = 'Joao Silva'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 20.1);

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.61, 66.0, 27.0, 83.0, 25.5, 'Zona de Melhoria', 'Zona de Melhoria'
FROM students s WHERE s.name = 'Maria Costa'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 25.5);

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.55, 48.0, 15.8, 68.0, 20.0, 'Zona Saudavel', 'Zona Saudavel'
FROM students s WHERE s.name = 'Tiago Ferreira'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 20.0);

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.60, 52.5, 22.4, 72.5, 20.5, 'Zona Saudavel', 'Zona Saudavel'
FROM students s WHERE s.name = 'Beatriz Santos'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 20.5);

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.62, 58.0, 19.5, 76.0, 22.1, 'Zona de Melhoria', 'Zona Saudavel'
FROM students s WHERE s.name = 'Miguel Pereira'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 22.1);

-- 8B
INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.57, 49.0, 21.0, 69.0, 19.9, 'Zona Saudavel', 'Zona Saudavel'
FROM students s WHERE s.name = 'Ana Rodrigues'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 19.9);

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.60, 55.3, 16.5, 73.0, 21.6, 'Zona de Melhoria', 'Zona Saudavel'
FROM students s WHERE s.name = 'Diogo Oliveira'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 21.6);

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.63, 54.0, 24.0, 71.0, 20.3, 'Zona Saudavel', 'Zona Saudavel'
FROM students s WHERE s.name = 'Carolina Mendes'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 20.3);

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.56, 47.5, 14.2, 67.0, 19.5, 'Zona Saudavel', 'Zona Saudavel'
FROM students s WHERE s.name = 'Rafael Almeida'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 19.5);

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.54, 51.0, 23.5, 74.0, 21.5, 'Zona de Melhoria', 'Zona Saudavel'
FROM students s WHERE s.name = 'Ines Martins'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 21.5);

-- 9A
INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.70, 60.0, 15.0, 74.0, 20.8, 'Zona Saudavel', 'Zona Saudavel'
FROM students s WHERE s.name = 'Pedro Sousa'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 20.8);

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.62, 55.0, 25.0, 75.0, 21.0, 'Zona Saudavel', 'Zona Saudavel'
FROM students s WHERE s.name = 'Leonor Ribeiro'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 21.0);

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.73, 68.5, 18.0, 82.0, 22.9, 'Zona de Melhoria', 'Zona Saudavel'
FROM students s WHERE s.name = 'Gabriel Monteiro'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 22.9);

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.59, 50.5, 22.0, 70.0, 20.0, 'Zona Saudavel', 'Zona Saudavel'
FROM students s WHERE s.name = 'Mariana Lopes'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 20.0);

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.68, 63.0, 16.8, 78.0, 22.3, 'Zona de Melhoria', 'Zona Saudavel'
FROM students s WHERE s.name = 'Bernardo Cardoso'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 22.3);

-- 9B
INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.64, 57.0, 24.5, 73.0, 21.2, 'Zona Saudavel', 'Zona Saudavel'
FROM students s WHERE s.name = 'Sofia Tavares'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 21.2);

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.71, 62.0, 14.5, 76.0, 21.2, 'Zona Saudavel', 'Zona Saudavel'
FROM students s WHERE s.name = 'Andre Vieira'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 21.2);

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.58, 53.0, 26.0, 72.0, 21.2, 'Zona Saudavel', 'Zona Saudavel'
FROM students s WHERE s.name = 'Matilde Pinto'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 21.2);

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.75, 72.0, 17.5, 84.0, 23.5, 'Zona de Melhoria', 'Zona Saudavel'
FROM students s WHERE s.name = 'Henrique Neves'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 23.5);

INSERT INTO biometrics (student_id, height_m, weight_kg, fat_pct, waist_cm, imc, imc_zone, waist_zone)
SELECT s.id, 1.60, 48.0, 20.5, 66.0, 18.8, 'Zona Saudavel', 'Zona Saudavel'
FROM students s WHERE s.name = 'Alice Correia'
  AND NOT EXISTS (SELECT 1 FROM biometrics b WHERE b.student_id = s.id AND b.imc = 18.8);

-- ══════════════════════════════════════════════════════════════════════════════
-- Tests — full battery for 8A students, partial for the rest
-- ══════════════════════════════════════════════════════════════════════════════

-- Joao Silva — full battery
INSERT INTO tests (student_id, test_id, value_text, unit, zone)
SELECT s.id, t.test_id, t.val, t.unit, t.zone
FROM students s
JOIN (VALUES
  ('vai',   '38', 'percursos', 'Zona Saudavel'),
  ('milha', '09:45', 'mm:ss',  'Zona Saudavel'),
  ('abd',   '34', 'reps',      'Zona Saudavel'),
  ('ext',   '18', 'reps',      'Zona Saudavel'),
  ('senta', '26', 'cm',        'Zona Saudavel'),
  ('4x10',  '11.8', 's',       'Zona Saudavel')
) AS t(test_id, val, unit, zone) ON true
WHERE s.name = 'Joao Silva'
  AND NOT EXISTS (SELECT 1 FROM tests x WHERE x.student_id = s.id AND x.test_id = t.test_id AND x.value_text = t.val);

-- Maria Costa — full battery (some zone de melhoria)
INSERT INTO tests (student_id, test_id, value_text, unit, zone)
SELECT s.id, t.test_id, t.val, t.unit, t.zone
FROM students s
JOIN (VALUES
  ('vai',   '22', 'percursos', 'Zona de Melhoria'),
  ('milha', '12:30', 'mm:ss',  'Zona de Melhoria'),
  ('abd',   '20', 'reps',      'Zona Saudavel'),
  ('ext',   '10', 'reps',      'Zona de Melhoria'),
  ('senta', '30', 'cm',        'Zona Saudavel'),
  ('4x10',  '13.2', 's',       'Zona de Melhoria')
) AS t(test_id, val, unit, zone) ON true
WHERE s.name = 'Maria Costa'
  AND NOT EXISTS (SELECT 1 FROM tests x WHERE x.student_id = s.id AND x.test_id = t.test_id AND x.value_text = t.val);

-- Tiago Ferreira
INSERT INTO tests (student_id, test_id, value_text, unit, zone)
SELECT s.id, t.test_id, t.val, t.unit, t.zone
FROM students s
JOIN (VALUES
  ('vai',   '45', 'percursos', 'Zona Saudavel'),
  ('milha', '08:55', 'mm:ss',  'Zona Saudavel'),
  ('abd',   '40', 'reps',      'Zona Saudavel'),
  ('senta', '22', 'cm',        'Zona Saudavel')
) AS t(test_id, val, unit, zone) ON true
WHERE s.name = 'Tiago Ferreira'
  AND NOT EXISTS (SELECT 1 FROM tests x WHERE x.student_id = s.id AND x.test_id = t.test_id AND x.value_text = t.val);

-- Beatriz Santos
INSERT INTO tests (student_id, test_id, value_text, unit, zone)
SELECT s.id, t.test_id, t.val, t.unit, t.zone
FROM students s
JOIN (VALUES
  ('vai',   '30', 'percursos', 'Zona Saudavel'),
  ('abd',   '28', 'reps',      'Zona Saudavel'),
  ('ext',   '14', 'reps',      'Zona Saudavel'),
  ('senta', '32', 'cm',        'Zona Saudavel')
) AS t(test_id, val, unit, zone) ON true
WHERE s.name = 'Beatriz Santos'
  AND NOT EXISTS (SELECT 1 FROM tests x WHERE x.student_id = s.id AND x.test_id = t.test_id AND x.value_text = t.val);

-- Miguel Pereira
INSERT INTO tests (student_id, test_id, value_text, unit, zone)
SELECT s.id, t.test_id, t.val, t.unit, t.zone
FROM students s
JOIN (VALUES
  ('vai',   '25', 'percursos', 'Zona de Melhoria'),
  ('milha', '11:20', 'mm:ss',  'Zona de Melhoria'),
  ('abd',   '22', 'reps',      'Zona Saudavel')
) AS t(test_id, val, unit, zone) ON true
WHERE s.name = 'Miguel Pereira'
  AND NOT EXISTS (SELECT 1 FROM tests x WHERE x.student_id = s.id AND x.test_id = t.test_id AND x.value_text = t.val);

-- Pedro Sousa (9A)
INSERT INTO tests (student_id, test_id, value_text, unit, zone)
SELECT s.id, t.test_id, t.val, t.unit, t.zone
FROM students s
JOIN (VALUES
  ('vai',   '52', 'percursos', 'Zona Saudavel'),
  ('milha', '08:10', 'mm:ss',  'Zona Saudavel'),
  ('abd',   '42', 'reps',      'Zona Saudavel'),
  ('ext',   '25', 'reps',      'Zona Saudavel'),
  ('senta', '28', 'cm',        'Zona Saudavel'),
  ('4x10',  '10.9', 's',       'Zona Saudavel')
) AS t(test_id, val, unit, zone) ON true
WHERE s.name = 'Pedro Sousa'
  AND NOT EXISTS (SELECT 1 FROM tests x WHERE x.student_id = s.id AND x.test_id = t.test_id AND x.value_text = t.val);

-- Gabriel Monteiro (9A)
INSERT INTO tests (student_id, test_id, value_text, unit, zone)
SELECT s.id, t.test_id, t.val, t.unit, t.zone
FROM students s
JOIN (VALUES
  ('vai',   '35', 'percursos', 'Zona Saudavel'),
  ('milha', '10:15', 'mm:ss',  'Zona de Melhoria'),
  ('abd',   '30', 'reps',      'Zona Saudavel'),
  ('ext',   '15', 'reps',      'Zona Saudavel')
) AS t(test_id, val, unit, zone) ON true
WHERE s.name = 'Gabriel Monteiro'
  AND NOT EXISTS (SELECT 1 FROM tests x WHERE x.student_id = s.id AND x.test_id = t.test_id AND x.value_text = t.val);

-- Sofia Tavares (9B)
INSERT INTO tests (student_id, test_id, value_text, unit, zone)
SELECT s.id, t.test_id, t.val, t.unit, t.zone
FROM students s
JOIN (VALUES
  ('vai',   '33', 'percursos', 'Zona Saudavel'),
  ('milha', '10:50', 'mm:ss',  'Zona Saudavel'),
  ('abd',   '26', 'reps',      'Zona Saudavel'),
  ('senta', '35', 'cm',        'Zona Saudavel')
) AS t(test_id, val, unit, zone) ON true
WHERE s.name = 'Sofia Tavares'
  AND NOT EXISTS (SELECT 1 FROM tests x WHERE x.student_id = s.id AND x.test_id = t.test_id AND x.value_text = t.val);

-- Henrique Neves (9B)
INSERT INTO tests (student_id, test_id, value_text, unit, zone)
SELECT s.id, t.test_id, t.val, t.unit, t.zone
FROM students s
JOIN (VALUES
  ('vai',   '28', 'percursos', 'Zona de Melhoria'),
  ('milha', '11:45', 'mm:ss',  'Zona de Melhoria'),
  ('abd',   '18', 'reps',      'Zona de Melhoria'),
  ('ext',   '12', 'reps',      'Zona de Melhoria')
) AS t(test_id, val, unit, zone) ON true
WHERE s.name = 'Henrique Neves'
  AND NOT EXISTS (SELECT 1 FROM tests x WHERE x.student_id = s.id AND x.test_id = t.test_id AND x.value_text = t.val);

-- ══════════════════════════════════════════════════════════════════════════════
-- Questionnaires — varied responses across students
-- ══════════════════════════════════════════════════════════════════════════════

-- Joao Silva — initial + routine
INSERT INTO questionnaires (student_id, type, payload, deferred_count)
SELECT s.id, 'initial', '{"activity":"3","sleep":"7-8","sport":"futsal"}'::jsonb, 1
FROM students s WHERE s.name = 'Joao Silva'
  AND NOT EXISTS (SELECT 1 FROM questionnaires q WHERE q.student_id = s.id AND q.type = 'initial');

INSERT INTO questionnaires (student_id, type, payload, deferred_count)
SELECT s.id, 'routine', '{"stress":"4","food":"sim","mood":"4","energy":"4","screen":"2-4","hydration":"boa"}'::jsonb, 0
FROM students s WHERE s.name = 'Joao Silva'
  AND NOT EXISTS (SELECT 1 FROM questionnaires q WHERE q.student_id = s.id AND q.type = 'routine');

-- Maria Costa — initial only
INSERT INTO questionnaires (student_id, type, payload, deferred_count)
SELECT s.id, 'initial', '{"activity":"1","sleep":"lt6","sport":""}'::jsonb, 2
FROM students s WHERE s.name = 'Maria Costa'
  AND NOT EXISTS (SELECT 1 FROM questionnaires q WHERE q.student_id = s.id AND q.type = 'initial');

-- Tiago Ferreira — initial + routine
INSERT INTO questionnaires (student_id, type, payload, deferred_count)
SELECT s.id, 'initial', '{"activity":"5","sleep":"8-9","sport":"natacao, atletismo"}'::jsonb, 0
FROM students s WHERE s.name = 'Tiago Ferreira'
  AND NOT EXISTS (SELECT 1 FROM questionnaires q WHERE q.student_id = s.id AND q.type = 'initial');

INSERT INTO questionnaires (student_id, type, payload, deferred_count)
SELECT s.id, 'routine', '{"stress":"2","food":"sim","mood":"5","energy":"5","screen":"lt2","hydration":"boa"}'::jsonb, 0
FROM students s WHERE s.name = 'Tiago Ferreira'
  AND NOT EXISTS (SELECT 1 FROM questionnaires q WHERE q.student_id = s.id AND q.type = 'routine');

-- Pedro Sousa — initial + routine
INSERT INTO questionnaires (student_id, type, payload, deferred_count)
SELECT s.id, 'initial', '{"activity":"4","sleep":"7-8","sport":"basquetebol"}'::jsonb, 0
FROM students s WHERE s.name = 'Pedro Sousa'
  AND NOT EXISTS (SELECT 1 FROM questionnaires q WHERE q.student_id = s.id AND q.type = 'initial');

INSERT INTO questionnaires (student_id, type, payload, deferred_count)
SELECT s.id, 'routine', '{"stress":"3","food":"parcial","mood":"4","energy":"4","screen":"2-4","hydration":"medio"}'::jsonb, 0
FROM students s WHERE s.name = 'Pedro Sousa'
  AND NOT EXISTS (SELECT 1 FROM questionnaires q WHERE q.student_id = s.id AND q.type = 'routine');

-- Beatriz Santos — routine only (deferred initial)
INSERT INTO questionnaires (student_id, type, payload, deferred_count)
SELECT s.id, 'routine', '{"stress":"6","food":"nao","mood":"2","energy":"2","screen":"gt6","hydration":"baixo"}'::jsonb, 0
FROM students s WHERE s.name = 'Beatriz Santos'
  AND NOT EXISTS (SELECT 1 FROM questionnaires q WHERE q.student_id = s.id AND q.type = 'routine');

-- Sofia Tavares — initial + routine
INSERT INTO questionnaires (student_id, type, payload, deferred_count)
SELECT s.id, 'initial', '{"activity":"3","sleep":"6-7","sport":"danca"}'::jsonb, 0
FROM students s WHERE s.name = 'Sofia Tavares'
  AND NOT EXISTS (SELECT 1 FROM questionnaires q WHERE q.student_id = s.id AND q.type = 'initial');

INSERT INTO questionnaires (student_id, type, payload, deferred_count)
SELECT s.id, 'routine', '{"stress":"5","food":"parcial","mood":"3","energy":"3","screen":"2-4","hydration":"medio"}'::jsonb, 1
FROM students s WHERE s.name = 'Sofia Tavares'
  AND NOT EXISTS (SELECT 1 FROM questionnaires q WHERE q.student_id = s.id AND q.type = 'routine');

-- ══════════════════════════════════════════════════════════════════════════════
-- SOS alerts — 3 alerts (1 resolved, 2 pending)
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO sos_alerts (student_id, psych, teacher, psych_email, teacher_email, resolved)
SELECT s.id, 'Dra. Sofia Rocha', 'Prof. Nuno Melo', 'psi.demo@colegio.pt', 'prof.demo@colegio.pt', FALSE
FROM students s WHERE s.name = 'Joao Silva'
  AND NOT EXISTS (SELECT 1 FROM sos_alerts a WHERE a.student_id = s.id AND a.resolved = FALSE);

INSERT INTO sos_alerts (student_id, psych, teacher, psych_email, teacher_email, resolved)
SELECT s.id, 'Dra. Sofia Rocha', 'Prof. Nuno Melo', 'psi.demo@colegio.pt', 'prof.demo@colegio.pt', TRUE
FROM students s WHERE s.name = 'Beatriz Santos'
  AND NOT EXISTS (SELECT 1 FROM sos_alerts a WHERE a.student_id = s.id AND a.resolved = TRUE);

INSERT INTO sos_alerts (student_id, psych, teacher, psych_email, teacher_email, resolved)
SELECT s.id, 'Dra. Sofia Rocha', 'Prof.a Ana Torres', 'psi.demo@colegio.pt', 'prof2.demo@colegio.pt', FALSE
FROM students s WHERE s.name = 'Leonor Ribeiro'
  AND NOT EXISTS (SELECT 1 FROM sos_alerts a WHERE a.student_id = s.id AND a.resolved = FALSE);

-- ══════════════════════════════════════════════════════════════════════════════
-- Reports — 2 sample reports
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO reports (student_id, content, emailed_to)
SELECT s.id, 'Relatorio de teste AtlanticoFit para validacao de fluxo.', 'pai.demo@colegio.pt'
FROM students s WHERE s.name = 'Joao Silva'
  AND NOT EXISTS (SELECT 1 FROM reports r WHERE r.student_id = s.id);

INSERT INTO reports (student_id, content, emailed_to)
SELECT s.id, 'Relatorio trimestral — Pedro Sousa, 9A.', 'pai2.demo@colegio.pt'
FROM students s WHERE s.name = 'Pedro Sousa'
  AND NOT EXISTS (SELECT 1 FROM reports r WHERE r.student_id = s.id);

-- ══════════════════════════════════════════════════════════════════════════════
-- Dispensas — 2 medical exemptions
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO dispensas (student_id, reason, start_date, end_date, medical_certificate, created_by)
SELECT s.id, 'Lesao no tornozelo', DATE '2026-01-12', DATE '2026-01-26', TRUE, p.id
FROM students s
JOIN users p ON p.email = 'prof.demo@colegio.pt'
WHERE s.name = 'Maria Costa'
  AND NOT EXISTS (SELECT 1 FROM dispensas d WHERE d.student_id = s.id AND d.reason = 'Lesao no tornozelo');

INSERT INTO dispensas (student_id, reason, start_date, end_date, medical_certificate, created_by)
SELECT s.id, 'Asma — crise aguda', DATE '2026-02-03', DATE '2026-02-10', TRUE, p.id
FROM students s
JOIN users p ON p.email = 'prof.demo@colegio.pt'
WHERE s.name = 'Henrique Neves'
  AND NOT EXISTS (SELECT 1 FROM dispensas d WHERE d.student_id = s.id AND d.reason = 'Asma — crise aguda');
