import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { guardianSchema } from "@/lib/validations";

// GET /api/students/[id]/guardians — list guardians for a student
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (session.user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id } = await params;
    const links = await prisma.studentGuardian.findMany({
      where: { studentId: id },
      include: { guardian: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      links.map((l) => ({
        id: l.guardianUserId,
        relationship: l.relationship,
        guardian: { name: l.guardian.name, email: l.guardian.email },
      }))
    );
  } catch (error) {
    console.error("GET guardians error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/students/[id]/guardians  — link a guardian by email
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
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id } = await params;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const data = guardianSchema.parse(body);

    // Find or 404 the guardian user by email
    const guardianUser = await prisma.user.findUnique({ where: { email: data.guardianEmail } });
    if (!guardianUser) {
      return NextResponse.json(
        { error: `Nenhum utilizador com e-mail "${data.guardianEmail}".` },
        { status: 404 }
      );
    }
    if (guardianUser.role !== "PAIS") {
      return NextResponse.json(
        { error: "O utilizador não tem o perfil de Encarregado de Educação." },
        { status: 400 }
      );
    }

    // Upsert to avoid duplicate links
    const link = await prisma.studentGuardian.upsert({
      where: {
        studentId_guardianUserId: { studentId: id, guardianUserId: guardianUser.id },
      },
      update: { relationship: data.relationship },
      create: {
        studentId: id,
        guardianUserId: guardianUser.id,
        relationship: data.relationship,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST guardians error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/students/[id]/guardians  (body: { guardianUserId })
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (session.user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const guardianUserId = body?.guardianUserId as string | undefined;
    if (!guardianUserId) {
      return NextResponse.json({ error: "guardianUserId obrigatório" }, { status: 400 });
    }

    await prisma.studentGuardian.deleteMany({
      where: { studentId: id, guardianUserId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE guardians error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
