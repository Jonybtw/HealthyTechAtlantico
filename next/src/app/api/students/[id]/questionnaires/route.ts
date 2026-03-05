import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccessStudentByRole, PERMISSIONS } from "@/lib/rbac";
import { questionnaireSchema } from "@/lib/validations";
import type { Role } from "@prisma/client";

// GET /api/students/[id]/questionnaires
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

    if (!canAccessStudentByRole({ role: session.user.role as Role, permission: PERMISSIONS.READ_QUESTIONNAIRES, isOwner, isGuardian })) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const questionnaires = await prisma.questionnaire.findMany({
      where: { studentId: id },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(questionnaires);
  } catch (error) {
    console.error("GET questionnaires error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/students/[id]/questionnaires
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
    if (!canAccessStudentByRole({ role: session.user.role as Role, permission: PERMISSIONS.SUBMIT_QUESTIONNAIRES, isOwner, isGuardian: false })) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const data = questionnaireSchema.parse(body);

    const questionnaire = await prisma.questionnaire.create({
      data: {
        studentId: id,
        type: data.type,
        payload: data.payload as object,
        deferredCount: data.deferredCount,
      },
    });

    return NextResponse.json(questionnaire, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST questionnaires error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
