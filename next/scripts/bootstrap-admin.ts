import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { getPgSslConfig } from "../src/lib/database-ssl";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: getPgSslConfig(),
});

const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function getPositionalArgs(): string[] {
  return process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
}

function fail(message: string): never {
  throw new Error(
    `${message}\nUsage: npm run bootstrap:admin -- --email admin@example.com [--name "Admin User"] [--password "StrongPass123"]`
  );
}

async function main() {
  const positionalArgs = getPositionalArgs();
  const email =
    getArg("--email")?.trim().toLowerCase() ??
    positionalArgs[0]?.trim().toLowerCase();
  const name = getArg("--name")?.trim();
  const password = getArg("--password") ?? positionalArgs[1];

  if (!email) {
    fail("Missing required --email argument.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: Role.ADMIN,
        ...(name ? { name } : {}),
        consentRgpd: true,
        consentShare: true,
      },
    });

    console.log(`Promoted ${email} to ADMIN.`);
    return;
  }

  if (!password || password.length < 8) {
    fail("Creating a new admin requires --password with at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      name: name ?? "Administrator",
      passwordHash,
      role: Role.ADMIN,
      consentRgpd: true,
      consentShare: true,
    },
  });

  console.log(`Created ADMIN account for ${email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
