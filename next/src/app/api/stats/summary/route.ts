import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { ok, serverError, unauthorized } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

// GET /api/stats/summary
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
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

      return ok({
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
      return ok({ openSos });
    }

    if (role === "ALUNO") {
      const student = await prisma.student.findFirst({
        where: { linkedUserId: session.user.id },
      });
      if (!student) {
        return ok({});
      }

      const [biometricCount, testCount, questionnaireCount] =
        await Promise.all([
          prisma.biometric.count({ where: { studentId: student.id } }),
          prisma.test.count({ where: { studentId: student.id } }),
          prisma.questionnaire.count({ where: { studentId: student.id } }),
        ]);

      return ok({
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
      return ok({
        linkedStudents: guardianLinks.length,
      });
    }

    return ok({});
  } catch (error) {
    console.error("GET stats summary error:", error);
    return serverError();
  }
}
