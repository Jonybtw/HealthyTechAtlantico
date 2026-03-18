import "dotenv/config";
import { PrismaClient, Role, Sex, QuestionnaireType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import { getPgSslConfig } from "../src/lib/database-ssl";
import { INTERNAL_EMAIL_DOMAIN } from "../src/lib/email-rules";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: false,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TEST_OPTIONS = [
  { id: "vai", unit: "percursos" },
  { id: "cooper", unit: "m" },
  { id: "milha", unit: "mm:ss" },
  { id: "velocidade", unit: "s" },
  { id: "agilidade", unit: "s" },
  { id: "abd", unit: "reps" },
  { id: "bracos", unit: "reps" },
  { id: "senta", unit: "cm" },
];

async function main() {
  console.log("🌱 Advanced Seeding database with massive realistic demo data...");

  // 1. CLEAR EXISTING DATA FOR A CLEAN STATE
  console.log("Cleaning existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.studentGuardian.deleteMany();
  await prisma.dispensa.deleteMany();
  await prisma.report.deleteMany();
  await prisma.sosAlert.deleteMany();
  await prisma.questionnaire.deleteMany();
  await prisma.test.deleteMany();
  await prisma.biometric.deleteMany();
  await prisma.evaluationSession.deleteMany();
  await prisma.student.deleteMany();
  await prisma.schoolClass.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: {
        notIn: [`admin@${INTERNAL_EMAIL_DOMAIN}`, `professor@${INTERNAL_EMAIL_DOMAIN}`, `psicologo@${INTERNAL_EMAIL_DOMAIN}`, "joao.ferreira@gmail.com"]
      }
    }
  });

  const adminEmail = `admin@${INTERNAL_EMAIL_DOMAIN}`;
  const professorEmail = `professor@${INTERNAL_EMAIL_DOMAIN}`;
  const psychologistEmail = `psicologo@${INTERNAL_EMAIL_DOMAIN}`;
  const parentEmail = "joao.ferreira@gmail.com";
  const hash = await bcrypt.hash("Password1", 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: "Admin Atlântico", passwordHash: hash, role: Role.ADMIN, consentRgpd: true, consentShare: true },
  });

  const professor = await prisma.user.upsert({
    where: { email: professorEmail },
    update: {},
    create: { email: professorEmail, name: "Prof. Carlos Silva", passwordHash: hash, role: Role.PROFESSOR, consentRgpd: true },
  });

  await prisma.user.upsert({
    where: { email: psychologistEmail },
    update: {},
    create: { email: psychologistEmail, name: "Dr. Ana Rodrigues", passwordHash: hash, role: Role.PSICOLOGO, consentRgpd: true },
  });

  const parentUser = await prisma.user.upsert({
    where: { email: parentEmail },
    update: {},
    create: { email: parentEmail, name: "João Ferreira", passwordHash: hash, role: Role.PAIS, consentRgpd: true },
  });

  const years = ["2024/2025", "2025/2026"];
  const dbYears = [];
  for (const y of years) {
    const ay = await prisma.academicYear.create({ data: { label: y } });
    dbYears.push(ay);
  }

  const classesConfig = ["7ºA", "7ºB", "8ºA", "8ºB", "9ºA"];
  const clsMap = new Map();
  
  for (const year of dbYears) {
    for (const c of classesConfig) {
      const cls = await prisma.schoolClass.create({
        data: { name: c, academicYearId: year.id }
      });
      clsMap.set(`${year.label}-${c}`, cls);
    }
  }

  const firstNamesM = ["Diogo", "João", "Tiago", "Miguel", "Gonçalo", "Pedro", "Rui", "Tomás", "Martim", "Dinis", "Rodrigo", "Guilherme", "Afonso", "Francisco"];
  const firstNamesF = ["Maria", "Ana", "Beatriz", "Inês", "Sofia", "Margarida", "Leonor", "Carolina", "Mariana", "Matilde", "Laura", "Lara", "Joana"];
  const lastNames = ["Silva", "Santos", "Ferreira", "Pereira", "Oliveira", "Costa", "Rodrigues", "Martins", "Jesus", "Sousa", "Fernandes", "Gomes", "Marques", "Almeida", "Ribeiro"];

  const students = [];
  let studentCounter = 1;

  for (const className of classesConfig) {
    const numStudents = 15; 
    for (let i = 0; i < numStudents; i++) {
      const isM = Math.random() > 0.5;
      const firstName = isM ? firstNamesM[Math.floor(Math.random() * firstNamesM.length)] : firstNamesF[Math.floor(Math.random() * firstNamesF.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const sex = isM ? Sex.M : Sex.F;
      
      const ageOff = className.startsWith('7') ? 12 : className.startsWith('8') ? 13 : 14;
      const birthYear = 2025 - ageOff;
      const birthDate = new Date(`${birthYear}-0${Math.floor(Math.random()*8)+1}-15`);

      const email = `aluno.demo.${studentCounter}@${INTERNAL_EMAIL_DOMAIN}`;
      studentCounter++;
      
      const user = await prisma.user.create({
        data: { email, name, passwordHash: hash, role: Role.ALUNO, consentRgpd: true }
      });

      const student = await prisma.student.create({
        data: {
          name,
          sex,
          birthDate,
          linkedUserId: user.id,
          createdById: admin.id,
          schoolYear: "2025/2026",
          className,
        }
      });
      students.push({ student, ageOff });
    }
  }

  const terms = [
    { year: "2024/2025", term: "1º Período" },
    { year: "2024/2025", term: "2º Período" },
    { year: "2024/2025", term: "3º Período" },
    { year: "2025/2026", term: "1º Período" },
    { year: "2025/2026", term: "2º Período" },
  ];

  let progress = 0;
  console.log(`Generating records for ${students.length} students across 5 evaluation sessions...`);

  for (const {student, ageOff} of students) {
    let baseHeight = student.sex === "M" ? 1.45 + (ageOff - 12) * 0.05 + Math.random() * 0.1 : 1.48 + (ageOff - 12) * 0.02 + Math.random() * 0.1;
    let baseWeight = student.sex === "M" ? 38 + (ageOff - 12) * 5 + Math.random() * 10 : 40 + (ageOff - 12) * 3 + Math.random() * 8;
    
    let baseVai = Math.floor(20 + Math.random() * 40);
    let baseCooper = Math.floor(1600 + Math.random() * 800);
    let baseVelocidade = 8.5 - Math.random() * 1.5;

    for (let t = 0; t < terms.length; t++) {
      const sessionLabel = terms[t].term;
      const schoolYear = terms[t].year;

      const sessionDate = new Date();
      sessionDate.setFullYear(parseInt(schoolYear.substring(0, 4)) + (sessionLabel.includes("1º") ? 0 : 1));
      sessionDate.setMonth(sessionLabel.includes("1º") ? 10 : sessionLabel.includes("2º") ? 2 : 5);
      sessionDate.setDate(15 + Math.floor(Math.random() * 10));

      const session = await prisma.evaluationSession.create({
        data: {
          studentId: student.id,
          label: sessionLabel,
          schoolYear: schoolYear,
          createdById: professor.id,
          createdAt: sessionDate
        },
      });

      baseHeight += 0.01 + Math.random() * 0.01;
      baseWeight += 0.5 + Math.random() * 1.5;
      baseVai += Math.floor(Math.random() * 3);
      baseCooper += Math.floor(Math.random() * 50);
      baseVelocidade -= Math.random() * 0.1;

      const bmi = baseWeight / (baseHeight * baseHeight);

      await prisma.biometric.create({
        data: {
          studentId: student.id,
          sessionId: session.id,
          heightM: Math.round(baseHeight * 100) / 100,
          weightKg: Math.round(baseWeight * 10) / 10,
          waistCm: Math.round((55 + Math.random() * 15) * 10) / 10,
          fatPct: Math.round((12 + Math.random() * 12) * 10) / 10,
          imc: Math.round(bmi * 10) / 10,
          imcZone: bmi < 18 ? "ZMF - Zona de Melhoria" : bmi < 24 ? "ZSAF - Zona Saudável" : "ZMF - Zona de Melhoria",
          waistZone: Math.random() > 0.8 ? "ZMF - Zona de Melhoria" : "ZSAF - Zona Saudável",
          fatZone: Math.random() > 0.8 ? "ZMF - Zona de Melhoria" : "ZSAF - Zona Saudável",
          recordedAt: sessionDate
        },
      });

      for (const opt of TEST_OPTIONS) {
        let valNum = 0;
        let strVal = "";
        
        switch (opt.id) {
          case "vai": valNum = baseVai; break;
          case "cooper": valNum = baseCooper; break;
          case "milha": 
            valNum = 8 + Math.random() * 4; 
            const m = Math.floor(valNum); 
            const s = Math.floor((valNum - m) * 60);
            strVal = `${m}:${s < 10 ? '0' : ''}${s}`; 
            break;
          case "velocidade": valNum = baseVelocidade; break;
          case "agilidade": valNum = 11 + Math.random() * 3; break;
          case "abd": valNum = Math.floor(15 + Math.random() * 35); break;
          case "bracos": valNum = Math.floor(5 + Math.random() * 25); break;
          case "senta": valNum = Math.round((15 + Math.random() * 20) * 10) / 10; break;
        }

        if(valNum > 0 && opt.id !== "milha") {
           valNum = Math.round(valNum * 10) / 10;
           strVal = valNum.toString();
        }

        const isGood = Math.random() > 0.3;

        await prisma.test.create({
          data: {
            studentId: student.id,
            sessionId: session.id,
            testId: opt.id,
            valueNum: valNum,
            valueText: strVal,
            unit: opt.unit,
            zone: isGood ? "ZSAF - Zona Saudável" : "ZMF - Zona de Melhoria",
            recordedAt: sessionDate
          }
        });
      }
      
      if (t > 1) { 
        await prisma.questionnaire.create({
          data: {
            studentId: student.id,
            type: QuestionnaireType.AUTOCONCEITO,
            payload: {
              sleepHours: 7 + Math.round(Math.random() * 2),
              screenHours: 1 + Math.round(Math.random() * 4),
              stressLevel: Math.floor(Math.random() * 6),
              wellnessLevel: 5 + Math.floor(Math.random() * 5),
            },
            submittedAt: sessionDate
          },
        });
      }
    }
    progress++;
    if (progress % 10 === 0) console.log(`  ...${progress} students processed`);
  }

  console.log("✅ Advanced demo data seed complete!");
  console.log(`Generated ${students.length} students across 5 classes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });