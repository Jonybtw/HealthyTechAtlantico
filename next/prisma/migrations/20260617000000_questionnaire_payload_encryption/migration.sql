-- Add encrypted payload column and make legacy payload nullable

ALTER TABLE "questionnaires"
ADD COLUMN "payload_encrypted" TEXT;

ALTER TABLE "questionnaires"
ALTER COLUMN "payload" DROP NOT NULL;

