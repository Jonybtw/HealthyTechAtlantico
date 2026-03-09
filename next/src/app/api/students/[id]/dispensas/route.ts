import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isStaffRole, PERMISSIONS } from "@/lib/rbac";
import { dispensaSchema } from "@/lib/validations";
import type { Role } from "@prisma/client";
import { getStudentAccessContext } from "@/lib/student-access";

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
    const access = await getStudentAccessContext(
      id,
      session.user.id,
      session.user.role as Role,
      PERMISSIONS.MANAGE_DISPENSAS
    );
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
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

    if (!isStaffRole(session.user.role as Role)) {
      return NextResponse.json({ error: "Apenas funcionários autorizados podem gerir dispensas" }, { status: 403 });
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
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST dispensas error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/students/[id]/dispensas  (body: { dispensaId })
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (!isStaffRole(session.user.role as Role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const dispensaId = body?.dispensaId as string | undefined;
    if (!dispensaId) {
      return NextResponse.json({ error: "dispensaId obrigatório" }, { status: 400 });
    }

    const dispensa = await prisma.dispensa.findUnique({ where: { id: dispensaId } });
    if (!dispensa || dispensa.studentId !== id) {
      return NextResponse.json({ error: "Dispensa não encontrada" }, { status: 404 });
    }

    await prisma.dispensa.delete({ where: { id: dispensaId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE dispensas error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
