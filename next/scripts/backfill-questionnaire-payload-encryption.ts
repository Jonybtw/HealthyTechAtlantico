import "dotenv/config";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { encryptQuestionnairePayload } from "../src/lib/questionnaire-payload-codec";

async function main() {
  const rows = await prisma.questionnaire.findMany({
    where: {
      payloadEncrypted: null,
      payload: { not: Prisma.DbNull },
    },
    select: { id: true, payload: true },
  });

  let updated = 0;
  for (const row of rows) {
    await prisma.questionnaire.update({
      where: { id: row.id },
      data: {
        payloadEncrypted: encryptQuestionnairePayload(row.payload),
        payload: Prisma.DbNull,
      },
    });
    updated += 1;
  }

  console.warn(
    `[backfill] Questionnaires atualizados: ${updated} (de ${rows.length})`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
