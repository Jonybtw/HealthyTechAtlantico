/* eslint-disable no-console */
import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: false,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const students = await prisma.student.findMany({ take: 30 });
  
  if (students.length === 0) {
    console.log("No students! Please run the main seed first if the database is empty.");
    return;
  }
  
  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN }});
  const psych = await prisma.user.findFirst({ where: { role: Role.PSICOLOGO }});
  const prof = await prisma.user.findFirst({ where: { role: Role.PROFESSOR }});

  console.log("Seeding SOS Alerts...");

  for (const s of students) {
    // Make 2 alerts per student for 15 students
    if (Math.random() < 0.5) {
      const isResolved = Math.random() > 0.5;
      await prisma.sosAlert.create({
        data: {
          studentId: s.id,
          psych: psych?.name ?? "Dr. Psicólogo",
          teacher: prof?.name ?? "Prof. António",
          psychEmail: psych?.email ?? "psicologo@atlantico.pt",
          teacherEmail: prof?.email ?? "professor@atlantico.pt",
          createdAt: new Date(),
          resolved: isResolved,
          resolvedAt: isResolved ? new Date() : null,
          resolvedById: isResolved ? admin?.id : null, 
        }
      });
      
      // another alert!
      await prisma.sosAlert.create({
        data: {
          studentId: s.id,
          psych: psych?.name ?? "Dr. Psicólogo",
          teacher: prof?.name ?? "Prof. António",
          psychEmail: psych?.email ?? "psicologo@atlantico.pt",
          teacherEmail: prof?.email ?? "professor@atlantico.pt",
          createdAt: new Date(Date.now() - 100000000),
          resolved: true,
          resolvedAt: new Date(Date.now() - 50000000),
          resolvedById: admin?.id, 
        }
      });
    }
  }
  console.log("✅ Done seeding SOS alerts.");
}

main().catch(console.error).finally(()=> pool.end());
