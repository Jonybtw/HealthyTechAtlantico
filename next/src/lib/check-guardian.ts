/* eslint-disable no-console */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "joao.ferreira@gmail.com";
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      guardianLinks: {
        include: {
          student: true
        }
      }
    }
  });

  if (!user) {
    console.log(`User with email ${email} not found.`);
    return;
  }

  console.log(`User ID: ${user.id}`);
  console.log(`Linked Students: ${user.guardianLinks.length}`);
  user.guardianLinks.forEach((link, i) => {
    console.log(`${i+1}. Student ID: ${link.student.id}, Name: ${link.student.name}`);
  });

  // Check if Ana Ferreira exists
  const ana = await prisma.student.findFirst({
    where: { name: { contains: "Ana Ferreira" } }
  });

  if (ana) {
    console.log(`Ana Ferreira found. ID: ${ana.id}`);
    if (user.guardianLinks.length === 0) {
        console.log("No students linked. Linking Ana Ferreira now...");
        await prisma.studentGuardian.create({
            data: {
                studentId: ana.id,
                guardianUserId: user.id,
                createdById: user.id
            }
        });
        console.log("Linked successfully.");
    }
  } else {
    console.log("Ana Ferreira not found in Student table.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
