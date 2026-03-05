import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccessStudentByRole, PERMISSIONS } from "@/lib/rbac";
import { dispensaSchema } from "@/lib/validations";
import type { Role } from "@prisma/client";

// GET /api/students/[id]/dispensas
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

    if (!canAccessStudentByRole({ role: session.user.role as Role, permission: PERMISSIONS.MANAGE_DISPENSAS, isOwner, isGuardian })) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const dispensas = await prisma.dispensa.findMany({
      where: { studentId: id },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(dispensas);
  } catch (error) {
    console.error("GET dispensas error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/students/[id]/dispensas
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (session.user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Apenas professores podem gerir dispensas" }, { status: 403 });
    }

    const { id } = await params;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const data = dispensaSchema.parse(body);

    const dispensa = await prisma.dispensa.create({
      data: {
        studentId: id,
        reason: data.reason,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        medicalCertificate: data.medicalCertificate,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(dispensa, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST dispensas error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
