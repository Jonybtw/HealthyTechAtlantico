CREATE TABLE "consent_history" (
  "id" TEXT NOT NULL,
  "subject_user_id" TEXT,
  "subject_student_id" TEXT,
  "changed_by" TEXT,
  "field" TEXT NOT NULL,
  "previous_value" BOOLEAN,
  "next_value" BOOLEAN NOT NULL,
  "reason" TEXT,
  "ip_address" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "consent_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consent_history_subject_user_id_created_at_idx"
  ON "consent_history"("subject_user_id", "created_at" DESC);

CREATE INDEX "consent_history_subject_student_id_created_at_idx"
  ON "consent_history"("subject_student_id", "created_at" DESC);

CREATE INDEX "consent_history_changed_by_idx"
  ON "consent_history"("changed_by");

ALTER TABLE "consent_history"
  ADD CONSTRAINT "consent_history_subject_user_id_fkey"
  FOREIGN KEY ("subject_user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "consent_history"
  ADD CONSTRAINT "consent_history_subject_student_id_fkey"
  FOREIGN KEY ("subject_student_id") REFERENCES "students"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "consent_history"
  ADD CONSTRAINT "consent_history_changed_by_fkey"
  FOREIGN KEY ("changed_by") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
