DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'QuestionnaireType' AND e.enumlabel = 'KIDMED'
  ) THEN
    ALTER TYPE "QuestionnaireType" ADD VALUE 'KIDMED';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'QuestionnaireClassification'
  ) THEN
    CREATE TYPE "QuestionnaireClassification" AS ENUM ('OPTIMAL', 'AVERAGE', 'VERY_LOW');
  END IF;
END $$;

ALTER TABLE "students"
  ADD COLUMN IF NOT EXISTS "kidmed_consent_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "kidmed_consent_recorded_by" TEXT;

CREATE INDEX IF NOT EXISTS "students_kidmed_consent_recorded_by_idx"
  ON "students"("kidmed_consent_recorded_by");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_kidmed_consent_recorded_by_fkey'
  ) THEN
    ALTER TABLE "students"
      ADD CONSTRAINT "students_kidmed_consent_recorded_by_fkey"
      FOREIGN KEY ("kidmed_consent_recorded_by")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "questionnaires"
  ADD COLUMN IF NOT EXISTS "instrument_version" TEXT,
  ADD COLUMN IF NOT EXISTS "school_year" TEXT,
  ADD COLUMN IF NOT EXISTS "period_key" TEXT,
  ADD COLUMN IF NOT EXISTS "score" INTEGER,
  ADD COLUMN IF NOT EXISTS "classification" "QuestionnaireClassification";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'questionnaires_student_id_type_school_year_period_key_key'
  ) THEN
    ALTER TABLE "questionnaires"
      ADD CONSTRAINT "questionnaires_student_id_type_school_year_period_key_key"
      UNIQUE ("student_id", "type", "school_year", "period_key");
  END IF;
END $$;
