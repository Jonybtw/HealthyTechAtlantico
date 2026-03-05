import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import type { Role } from "@prisma/client";

// GET /api/classes/report?year=2025/2026
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!canRole(session.user.role as Role, PERMISSIONS.READ_CLASS_REPORTS)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const year = req.nextUrl.searchParams.get("year");
    if (!year) {
      return NextResponse.json({ error: "Parâmetro 'year' obrigatório" }, { status: 400 });
    }

    const students = await prisma.student.findMany({
      where: { schoolYear: year },
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
