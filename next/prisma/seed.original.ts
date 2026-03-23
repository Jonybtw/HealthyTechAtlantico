import { PrismaClient, Role, Sex, QuestionnaireType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import { getPgSslConfig } from "../src/lib/database-ssl";
import { INTERNAL_EMAIL_DOMAIN } from "../src/lib/email-rules";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: getPgSslConfig(),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.warn("🌱 Seeding database…");
  const adminEmail = `admin@${INTERNAL_EMAIL_DOMAIN}`;
  const professorEmail = `professor@${INTERNAL_EMAIL_DOMAIN}`;
  const psychologistEmail = `psicologo@${INTERNAL_EMAIL_DOMAIN}`;
  const parentEmail = "joao.ferreira@gmail.com";

  // ── Academic Year ──
  const year = await prisma.academicYear.upsert({
    where: { label: "2025/2026" },
    update: {},
    create: { label: "2025/2026" },
  });

  // ── Classes ──
  const class7A = await prisma.schoolClass.upsert({
    where: { academicYearId_name: { name: "7ºA", academicYearId: year.id } },
    update: {},
    create: { name: "7ºA", academicYearId: year.id },
  });
  const class8B = await prisma.schoolClass.upsert({
    where: { academicYearId_name: { name: "8ºB", academicYearId: year.id } },
    update: {},
    create: { name: "8ºB", academicYearId: year.id },
  });

  // ── Staff accounts (password = Password1) ──
  const hash = await bcrypt.hash("Password1", 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin Atlântico",
      passwordHash: hash,
      role: Role.ADMIN,
      consentRgpd: true,
      consentShare: true,
    },
  });

  const professor = await prisma.user.upsert({
    where: { email: professorEmail },
    update: {},
    create: {
      email: professorEmail,
      name: "Prof. Carlos Silva",
      passwordHash: hash,
      role: Role.PROFESSOR,
      consentRgpd: true,
    },
  });

  await prisma.user.upsert({
    where: { email: psychologistEmail },
    update: {},
    create: {
      email: psychologistEmail,
      name: "Dr. Ana Rodrigues",
      passwordHash: hash,
      role: Role.PSICOLOGO,
      consentRgpd: true,
    },
  });

  const parentUser = await prisma.user.upsert({
    where: { email: parentEmail },
    update: {},
    create: {
      email: parentEmail,
      name: "João Ferreira",
      passwordHash: hash,
      role: Role.PAIS,
      consentRgpd: true,
    },
  });

  // ── Student accounts + profiles ──
  const studentNames = [
    { name: "Maria Santos", sex: Sex.F, birth: "2011-03-15" },
    { name: "Pedro Costa", sex: Sex.M, birth: "2011-07-22" },
    { name: "Ana Oliveira", sex: Sex.F, birth: "2012-01-10" },
    { name: "Tiago Pereira", sex: Sex.M, birth: "2011-11-30" },
    { name: "Sofia Mendes", sex: Sex.F, birth: "2012-05-18" },
    { name: "Diogo Almeida", sex: Sex.M, birth: "2011-09-03" },
    { name: "Beatriz Gomes", sex: Sex.F, birth: "2012-02-28" },
    { name: "Rui Fernandes", sex: Sex.M, birth: "2011-06-14" },
    { name: "Inês Martins", sex: Sex.F, birth: "2012-08-07" },
    { name: "Miguel Ribeiro", sex: Sex.M, birth: "2011-12-25" },
  ];

  const students: { id: string; name: string; sex: Sex }[] = [];

  for (let i = 0; i < studentNames.length; i++) {
    const s = studentNames[i];
    const email = `aluno${i + 1}@${INTERNAL_EMAIL_DOMAIN}`;
    const className = i < 5 ? class7A.name : class8B.name;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: s.name,
        passwordHash: hash,
        role: Role.ALUNO,
        consentRgpd: true,
      },
    });

    const student = await prisma.student.upsert({
      where: { linkedUserId: user.id },
      update: { className, schoolYear: "2025/2026" },
      create: {
        name: s.name,
        sex: s.sex,
        birthDate: new Date(s.birth),
        linkedUserId: user.id,
        createdById: admin.id,
        schoolYear: "2025/2026",
        className,
      },
    });

    students.push({ id: student.id, name: student.name, sex: student.sex });
  }

  // ── Evaluation Sessions (per student) + Biometrics + Tests ──
  for (const st of students) {
    const existingSession = await prisma.evaluationSession.findFirst({
      where: { studentId: st.id, label: "1ª Avaliação 2025/2026" },
    });
    if (existingSession) continue;

    const session = await prisma.evaluationSession.create({
      data: {
        studentId: st.id,
        label: "1ª Avaliação 2025/2026",
        schoolYear: "2025/2026",
        createdById: professor.id,
      },
    });

    // Biometric
    const h = st.sex === "M" ? 1.55 + Math.random() * 0.2 : 1.50 + Math.random() * 0.15;
    const w = st.sex === "M" ? 45 + Math.random() * 15 : 40 + Math.random() * 12;
    const bmi = Math.round((w / (h * h)) * 10) / 10;

    await prisma.biometric.create({
      data: {
        studentId: st.id,
        sessionId: session.id,
        heightM: Math.round(h * 100) / 100,
        weightKg: Math.round(w * 10) / 10,
        waistCm: Math.round((55 + Math.random() * 20) * 10) / 10,
        fatPct: Math.round((12 + Math.random() * 10) * 10) / 10,
        imc: bmi,
        imcZone: bmi < 24 ? "ZSAF" : "FZSAF",
        waistZone: "ZSAF",
      },
    });

    // Tests (EAV-style: one row per test)
    const testEntries = [
      { testId: "vaivem", value: Math.floor(20 + Math.random() * 60), unit: "percursos" },
      { testId: "cooper", value: Math.floor(1500 + Math.random() * 1000), unit: "m" },
      { testId: "velocidade", value: Math.round((7 + Math.random() * 4) * 10) / 10, unit: "seg" },
      { testId: "agilidade", value: Math.round((12 + Math.random() * 5) * 10) / 10, unit: "seg" },
      { testId: "abdominais", value: Math.floor(15 + Math.random() * 30), unit: "rep" },
      { testId: "extensoes", value: Math.floor(5 + Math.random() * 25), unit: "rep" },
      { testId: "senta_alcanca", value: Math.round((15 + Math.random() * 20) * 10) / 10, unit: "cm" },
    ];

    for (const entry of testEntries) {
      await prisma.test.create({
        data: {
          studentId: st.id,
          sessionId: session.id,
          testId: entry.testId,
          valueNum: entry.value,
          valueText: String(entry.value),
          unit: entry.unit,
          zone: "ZSAF",
        },
      });
    }

    // Questionnaire
    await prisma.questionnaire.create({
      data: {
        studentId: st.id,
        type: QuestionnaireType.AUTOCONCEITO,
        payload: {
          sleepHours: 7 + Math.round(Math.random() * 2),
          screenHours: 1 + Math.round(Math.random() * 4),
          stressLevel: Math.floor(Math.random() * 6),
          wellnessLevel: 5 + Math.floor(Math.random() * 5),
        },
      },
    });
  }

  // ── SOS Alerts (skip if already exist for these students) ──
  const existingSos = await prisma.sosAlert.findMany({
    where: { studentId: { in: [students[0].id, students[3].id] } },
    select: { studentId: true },
  });
  const sosStudentIds = new Set(existingSos.map((s) => s.studentId));

  if (!sosStudentIds.has(students[0].id)) {
    await prisma.sosAlert.create({
      data: {
        studentId: students[0].id,
        psych: "Dr. Ana Rodrigues",
        teacher: "Prof. Carlos Silva",
        psychEmail: psychologistEmail,
        teacherEmail: professorEmail,
        resolved: false,
      },
    });
  }

  if (!sosStudentIds.has(students[3].id)) {
    await prisma.sosAlert.create({
      data: {
        studentId: students[3].id,
        psych: "Dr. Ana Rodrigues",
        teacher: "Prof. Carlos Silva",
        psychEmail: psychologistEmail,
        teacherEmail: professorEmail,
        resolved: false,
      },
    });
  }

  // ── Dispensas (skip if already exists) ──
  const existingDispensa = await prisma.dispensa.findFirst({
    where: { studentId: students[2].id },
  });
  if (!existingDispensa) {
    await prisma.dispensa.create({
      data: {
        studentId: students[2].id,
        reason: "Entorse do tornozelo direito",
        startDate: new Date("2025-10-01"),
        endDate: new Date("2025-10-20"),
        createdById: professor.id,
      },
    });
  }

  // ── Guardian link (upsert via unique constraint) ──
  await prisma.studentGuardian.upsert({
    where: {
      studentId_guardianUserId: {
        studentId: students[0].id,
        guardianUserId: parentUser.id,
      },
    },
    update: {},
    create: {
      studentId: students[0].id,
      guardianUserId: parentUser.id,
      relationship: "Pai",
      createdById: professor.id,
    },
  });


  console.warn("✅ Seed complete!");
  console.warn(`   ${students.length} students, 1 admin, 1 professor, 1 psicólogo, 1 encarregado`);
  console.warn(`   Login: any email above / Password1`);
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
