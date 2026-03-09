import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import type { Role } from "@prisma/client";

// GET /api/classes/report?classId=...
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!canRole(session.user.role as Role, PERMISSIONS.READ_CLASS_REPORTS)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const classId = req.nextUrl.searchParams.get("classId");
    if (!classId) {
      return NextResponse.json({ error: "Parâmetro 'classId' obrigatório" }, { status: 400 });
    }

    const schoolClass = await prisma.schoolClass.findUnique({
      where: { id: classId },
      include: { academicYear: { select: { label: true } } },
    });
    if (!schoolClass) {
      return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
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

    const report = students.map((s) => ({
      id: s.id,
      name: s.name,
      sex: s.sex,
      className: s.className,
      birthDate: s.birthDate,
      latestBiometric: s.biometrics[0] ?? null,
      testCount: s.tests.length,
    }));

    return NextResponse.json(report);
  } catch (error) {
    console.error("GET class report error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
