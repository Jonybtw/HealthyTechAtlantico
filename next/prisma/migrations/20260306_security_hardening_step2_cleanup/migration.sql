ALTER TABLE "students"
  DROP CONSTRAINT IF EXISTS "students_user_id_fkey";

DROP INDEX IF EXISTS "students_user_id_key";
DROP INDEX IF EXISTS "students_user_id_idx";

ALTER TABLE "students"
  DROP COLUMN IF EXISTS "user_id";
