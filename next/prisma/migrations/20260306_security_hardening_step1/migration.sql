DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'Role' AND e.enumlabel = 'ADMIN'
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'ADMIN';
  END IF;
END $$;

ALTER TABLE "students"
  ADD COLUMN IF NOT EXISTS "linked_user_id" TEXT,
  ADD COLUMN IF NOT EXISTS "created_by" TEXT;

ALTER TABLE "students"
  ALTER COLUMN "user_id" DROP NOT NULL;

DROP INDEX IF EXISTS "students_user_id_key";

CREATE UNIQUE INDEX IF NOT EXISTS "students_linked_user_id_key"
  ON "students"("linked_user_id");

CREATE INDEX IF NOT EXISTS "students_created_by_idx"
  ON "students"("created_by");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_linked_user_id_fkey'
  ) THEN
    ALTER TABLE "students"
      ADD CONSTRAINT "students_linked_user_id_fkey"
      FOREIGN KEY ("linked_user_id")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_created_by_fkey'
  ) THEN
    ALTER TABLE "students"
      ADD CONSTRAINT "students_created_by_fkey"
      FOREIGN KEY ("created_by")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

UPDATE "students" AS s
SET "linked_user_id" = s."user_id"
FROM "users" AS u
WHERE s."user_id" = u."id"
  AND u."role" = 'ALUNO'
  AND s."linked_user_id" IS NULL;

UPDATE "students" AS s
SET "created_by" = s."user_id"
FROM "users" AS u
WHERE s."user_id" = u."id"
  AND u."role" <> 'ALUNO'
  AND s."created_by" IS NULL;

UPDATE "students"
SET "user_id" = NULL
WHERE "user_id" IS NOT NULL;
