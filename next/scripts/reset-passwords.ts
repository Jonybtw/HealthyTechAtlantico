import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import { INTERNAL_EMAIL_DOMAIN } from "../src/lib/email-rules";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash("Password1", 12);
  const emails = [
    `professor@${INTERNAL_EMAIL_DOMAIN}`,
    `psicologo@${INTERNAL_EMAIL_DOMAIN}`,
    "joao.ferreira@gmail.com",
  ];
  for (const email of emails) {
    try {
      const u = await prisma.user.update({
        where: { email },
        data: { passwordHash: hash },
      });
      console.log("✓ reset:", u.email);
    } catch {
      console.log("✗ not found:", email);
    }
  }
  await prisma.$disconnect();
}

main().catch(console.error);
