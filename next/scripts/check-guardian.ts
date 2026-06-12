/**
 * Debug helper: list a guardian's links and (optionally) link a student by name.
 *
 * Usage (from `next/`):
 *   npx tsx scripts/check-guardian.ts --email you@example.com --student "Ana Ferreira"
 *
 * No personal data is hard-coded; both the email and the student name are
 * command-line arguments.
 */
/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseArgs(): { email?: string; studentName?: string } {
  const args = process.argv.slice(2);
  const out: { email?: string; studentName?: string } = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--email") out.email = args[++i];
    else if (arg === "--student") out.studentName = args[++i];
  }
  return out;
}

async function main() {
  const { email, studentName } = parseArgs();
  if (!email) {
    console.error("Missing --email <guardian@example.com>");
    process.exit(2);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      guardianLinks: {
        include: {
          student: true,
        },
      },
    },
  });

  if (!user) {
    console.log(`User with email ${email} not found.`);
    return;
  }

  console.log(`User ID: ${user.id}`);
  console.log(`Linked Students: ${user.guardianLinks.length}`);
  user.guardianLinks.forEach((link, i) => {
    console.log(`${i + 1}. Student ID: ${link.student.id}, Name: ${link.student.name}`);
  });

  if (!studentName) return;

  const student = await prisma.student.findFirst({
    where: { name: { contains: studentName } },
  });
  if (!student) {
    console.log(`Student matching "${studentName}" not found.`);
    return;
  }
  console.log(`Student found. ID: ${student.id}`);

  if (user.guardianLinks.length === 0) {
    console.log("No students linked. Linking now...");
    await prisma.studentGuardian.create({
      data: {
        studentId: student.id,
        guardianUserId: user.id,
        createdById: user.id,
      },
    });
    console.log("Linked successfully.");
  } else {
    console.log("Guardian already has links; skipping create.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
