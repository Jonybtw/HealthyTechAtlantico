import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { getPgSslConfig } from "../src/lib/database-ssl";

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: getPgSslConfig(),
  });

  const adapter = new PrismaPg(pool as any);
  const prisma = new PrismaClient({ adapter });

  try {
    const [
      users,
      students,
      years,
      classes,
      sessions,
      biometrics,
      tests,
      questionnaires,
      sosAlerts,
      exemptions,
      studentGuardians,
    ] =
      await Promise.all([
        prisma.user.count(),
        prisma.student.count(),
        prisma.academicYear.count(),
        prisma.schoolClass.count(),
        prisma.evaluationSession.count(),
        prisma.biometric.count(),
        prisma.test.count(),
        prisma.questionnaire.count(),
        prisma.sosAlert.count(),
        prisma.exemption.count(),
        prisma.studentGuardian.count(),
      ]);

    console.log(
      JSON.stringify(
        {
          users,
          students,
          years,
          classes,
          sessions,
          biometrics,
          tests,
          questionnaires,
          sosAlerts,
          exemptions,
          studentGuardians,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
