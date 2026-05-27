import { type NextRequest } from "next/server";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { canRole, PERMISSIONS } from "@/lib/rbac";

// GET /api/classes/report?classId=...
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    if (!canRole(session.user.role as Role, PERMISSIONS.READ_CLASS_REPORTS)) {
      return forbidden();
    }

    const classId = req.nextUrl.searchParams.get("classId");
    if (!classId) {
      return badRequest("Parâmetro 'classId' obrigatório");
    }

    const schoolClass = await prisma.schoolClass.findUnique({
      where: { id: classId },
      include: { academicYear: { select: { label: true } } },
    });
    if (!schoolClass) {
      return notFound("Turma não encontrada");
    }

    const students = await prisma.student.findMany({
      where: {
        schoolYear: schoolClass.academicYear.label,
        className: schoolClass.name,
      },
      orderBy: [{ className: "asc" }, { name: "asc" }],
      include: {
        biometrics: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
        tests: {
          orderBy: { recordedAt: "desc" },
        },
      },
    });

    const report = students.map((student) => ({
      id: student.id,
      name: student.name,
      sex: student.sex,
      className: student.className,
      processNumber: student.processNumber,
      birthDate: student.birthDate,
      latestBiometric: student.biometrics[0] ?? null,
      testCount: student.tests.length,
    }));

    return ok(report);
  } catch (error) {
    console.error("GET class report error:", error);
    return serverError();
  }
}
