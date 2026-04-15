import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: false });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 Limpando FK violations...");
  await prisma.$transaction([
    prisma.test.deleteMany(),
    prisma.biometric.deleteMany(),
    prisma.evaluationSession.deleteMany(),
    prisma.student.deleteMany({ where: { name: { contains: "demo" } } }),
  ], { timeout: 60000 });
  
  console.log("✅ Limpo! Rode: cd next && npx tsx prisma/seed.ts");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

