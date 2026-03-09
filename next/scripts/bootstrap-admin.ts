import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function fail(message: string): never {
  throw new Error(
    `${message}\nUsage: npm run bootstrap:admin -- --email admin@example.com [--name "Admin User"] [--password "StrongPass123"]`
  );
}

async function main() {
  const email = getArg("--email")?.trim().toLowerCase();
  const name = getArg("--name")?.trim();
  const password = getArg("--password");

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
  });
