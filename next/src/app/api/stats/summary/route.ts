import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

// GET /api/stats/summary
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const role = session.user.role as Role;

    if (role === "ADMIN" || role === "PROFESSOR") {
      const [studentCount, openSos, totalBiometrics, totalTests] =
        await Promise.all([
          prisma.student.count(),
          prisma.sosAlert.count({ where: { resolved: false } }),
          prisma.biometric.count(),
          prisma.test.count(),
        ]);

      return NextResponse.json({
        studentCount,
        openSos,
        totalBiometrics,
        totalTests,
      });
    }

    if (role === "PSICOLOGO") {
      const openSos = await prisma.sosAlert.count({
        where: { resolved: false },
      });
      return NextResponse.json({ openSos });
    }

    if (role === "ALUNO") {
      const student = await prisma.student.findFirst({
        where: { linkedUserId: session.user.id },
      });
      if (!student) return NextResponse.json({});

      const [biometricCount, testCount, questionnaireCount] =
        await Promise.all([
          prisma.biometric.count({ where: { studentId: student.id } }),
          prisma.test.count({ where: { studentId: student.id } }),
          prisma.questionnaire.count({ where: { studentId: student.id } }),
        ]);

      return NextResponse.json({
        biometricCount,
        testCount,
        questionnaireCount,
      });
    }

    if (role === "PAIS") {
      const guardianLinks = await prisma.studentGuardian.findMany({
        where: { guardianUserId: session.user.id },
        select: { studentId: true },
      });
      return NextResponse.json({
        linkedStudents: guardianLinks.length,
      });
    }

    return NextResponse.json({});
  } catch (error) {
    console.error("GET stats summary error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
