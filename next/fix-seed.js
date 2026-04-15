import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Limpando dados órfãos...");
  await prisma.$transaction([
    prisma.test.deleteMany(),
    prisma.biometric.deleteMany(),
    prisma.evaluationSession.deleteMany(),
    prisma.student.deleteMany(),
  ]);
  
  console.log("✅ DB limpa! Execute npx tsx prisma/seed.ts agora");
}

main().finally(() => prisma.$disconnect());

