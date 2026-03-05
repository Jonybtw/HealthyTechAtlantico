import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccessStudentByRole, PERMISSIONS } from "@/lib/rbac";
import { testsSchema } from "@/lib/validations";
import type { Role } from "@prisma/client";

// GET /api/students/[id]/tests
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: { guardians: { select: { guardianUserId: true } } },
    });
    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const isOwner = student.userId === session.user.id;
    const isGuardian = student.guardians.some((g) => g.guardianUserId === session.user.id);

    if (!canAccessStudentByRole({ role: session.user.role as Role, permission: PERMISSIONS.READ_TESTS, isOwner, isGuardian })) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const tests = await prisma.test.findMany({
      where: { studentId: id },
      orderBy: { recordedAt: "desc" },
    });

    return NextResponse.json(tests);
  } catch (error) {
    console.error("GET tests error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/students/[id]/tests — batch insert
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: { guardians: { select: { guardianUserId: true } } },
    });
    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const isOwner = student.userId === session.user.id;
    const isGuardian = student.guardians.some((g) => g.guardianUserId === session.user.id);

    if (!canAccessStudentByRole({ role: session.user.role as Role, permission: PERMISSIONS.RECORD_TESTS, isOwner, isGuardian })) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const data = testsSchema.parse(body);

    const created = await prisma.test.createMany({
      data: data.tests.map((t) => ({
        studentId: id,
        sessionId: data.sessionId ?? null,
        testId: t.testId,
        valueNum: t.valueNum ?? null,
        valueText: t.valueText,
        unit: t.unit,
        zone: t.zone,
      })),
    });

    return NextResponse.json({ count: created.count }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST tests error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
