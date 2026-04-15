import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clean DB...");
  await prisma.$transaction([
    prisma.test.deleteMany(),
    prisma.biometric.deleteMany(),
    prisma.evaluationSession.deleteMany(),
    prisma.student.deleteMany(),
    prisma.sosAlert.deleteMany(),
  ]);
  console.log("✅ Clean! Run: npx tsx prisma/seed.ts");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

