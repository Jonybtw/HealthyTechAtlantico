-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ALUNO', 'PROFESSOR', 'PSICOLOGO', 'PAIS');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "QuestionnaireType" AS ENUM ('AUTOCONCEITO', 'AUTOESTIMA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "consent_rgpd" BOOLEAN NOT NULL DEFAULT false,
    "consent_share" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_email_role_check" CHECK (
        (
            position('@' in "email") > 1
            AND
            "role" IN ('ADMIN', 'ALUNO', 'PROFESSOR', 'PSICOLOGO')
            AND split_part(lower("email"), '@', 2) = 'colegioatlantico.pt'
        )
        OR (
            position('@' in "email") > 1
            AND
            "role" = 'PAIS'
            AND split_part(lower("email"), '@', 2) <> 'colegioatlantico.pt'
        )
    ),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "linked_user_id" TEXT,
    "created_by" TEXT,
    "name" TEXT NOT NULL,
    "sex" "Sex" NOT NULL,
    "birth_date" DATE,
    "age" SMALLINT,
    "school_year" TEXT,
    "class_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_classes" (
    "id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "school_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_sessions" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Avaliacao',
    "school_year" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biometrics" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "session_id" TEXT,
    "height_m" DECIMAL(4,2) NOT NULL,
    "weight_kg" DECIMAL(5,2) NOT NULL,
    "fat_pct" DECIMAL(4,1),
    "waist_cm" DECIMAL(5,1),
    "imc" DECIMAL(4,1) NOT NULL,
    "imc_zone" TEXT NOT NULL,
    "fat_zone" TEXT,
    "waist_zone" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "biometrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "session_id" TEXT,
    "test_id" TEXT NOT NULL,
    "value_num" DECIMAL,
    "value_text" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaires" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "type" "QuestionnaireType" NOT NULL,
    "payload" JSONB NOT NULL,
    "deferred_count" INTEGER NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questionnaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sos_alerts" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "psych" TEXT NOT NULL,
    "teacher" TEXT NOT NULL,
    "psych_email" TEXT,
    "teacher_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,

    CONSTRAINT "sos_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Relatorio HealthyTechAtlantico',
    "emailed_to" TEXT NOT NULL,
    "school_year" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispensas" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "medical_certificate" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "dispensas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_guardians" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "guardian_user_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'encarregado',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "target_id" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_linked_user_id_key" ON "students"("linked_user_id");

-- CreateIndex
CREATE INDEX "students_linked_user_id_idx" ON "students"("linked_user_id");

-- CreateIndex
CREATE INDEX "students_created_by_idx" ON "students"("created_by");

-- CreateIndex
CREATE INDEX "students_school_year_idx" ON "students"("school_year");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_label_key" ON "academic_years"("label");

-- CreateIndex
CREATE UNIQUE INDEX "school_classes_academic_year_id_name_key" ON "school_classes"("academic_year_id", "name");

-- CreateIndex
CREATE INDEX "biometrics_student_id_recorded_at_idx" ON "biometrics"("student_id", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "biometrics_student_id_session_id_idx" ON "biometrics"("student_id", "session_id");

-- CreateIndex
CREATE INDEX "tests_student_id_recorded_at_idx" ON "tests"("student_id", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "tests_student_id_session_id_idx" ON "tests"("student_id", "session_id");

-- CreateIndex
CREATE INDEX "questionnaires_student_id_submitted_at_idx" ON "questionnaires"("student_id", "submitted_at" DESC);

-- CreateIndex
CREATE INDEX "sos_alerts_student_id_resolved_idx" ON "sos_alerts"("student_id", "resolved");

-- CreateIndex
CREATE INDEX "reports_student_id_created_at_idx" ON "reports"("student_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "student_guardians_student_id_idx" ON "student_guardians"("student_id");

-- CreateIndex
CREATE INDEX "student_guardians_guardian_user_id_idx" ON "student_guardians"("guardian_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_guardians_student_id_guardian_user_id_key" ON "student_guardians"("student_id", "guardian_user_id");

-- CreateIndex
CREATE INDEX "audit_log_user_id_created_at_idx" ON "audit_log"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_linked_user_id_fkey" FOREIGN KEY ("linked_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_classes" ADD CONSTRAINT "school_classes_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_sessions" ADD CONSTRAINT "evaluation_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_sessions" ADD CONSTRAINT "evaluation_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometrics" ADD CONSTRAINT "biometrics_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometrics" ADD CONSTRAINT "biometrics_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "evaluation_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "evaluation_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaires" ADD CONSTRAINT "questionnaires_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensas" ADD CONSTRAINT "dispensas_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensas" ADD CONSTRAINT "dispensas_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_guardian_user_id_fkey" FOREIGN KEY ("guardian_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
