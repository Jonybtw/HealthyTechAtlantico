import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccessStudentByRole, PERMISSIONS } from "@/lib/rbac";
import type { Role } from "@prisma/client";

// GET /api/students/[id]
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
    const role = session.user.role as Role;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        guardians: { select: { guardianUserId: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const isOwner = student.userId === session.user.id;
    const isGuardian = student.guardians.some(
      (g) => g.guardianUserId === session.user.id
    );

    if (
      !canAccessStudentByRole({
        role,
        permission: PERMISSIONS.LIST_STUDENTS,
        isOwner,
        isGuardian,
      })
    ) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("GET /api/students/[id] error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
