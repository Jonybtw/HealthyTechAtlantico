import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { sosSchema } from "@/lib/validations";
import { sendMail } from "@/lib/mailer";
import { auditLog } from "@/lib/audit";
import type { Role } from "@prisma/client";
import { getStudentAccessContext } from "@/lib/student-access";

// GET /api/students/[id]/sos
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
      PERMISSIONS.READ_SOS
    );
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const student = await prisma.student.findUnique({
      where: { id },
    });
    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const alerts = await prisma.sosAlert.findMany({
      where: { studentId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("GET sos error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/students/[id]/sos — trigger SOS alert
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
    const access = await getStudentAccessContext(
      id,
      session.user.id,
      session.user.role as Role,
      PERMISSIONS.TRIGGER_SOS
    );
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const student = await prisma.student.findUnique({
      where: { id },
    });
    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const data = sosSchema.parse(body);

    const alert = await prisma.sosAlert.create({
      data: {
        studentId: id,
        psych: data.psych,
        teacher: data.teacher,
        psychEmail: data.psychEmail ?? null,
        teacherEmail: data.teacherEmail ?? null,
      },
    });

    await auditLog({ userId: session.user.id, action: "trigger_sos", targetId: id });

    // Send emails (non-blocking — don't fail if email fails)
    const emails = [data.psychEmail, data.teacherEmail].filter(Boolean) as string[];
    for (const to of emails) {
      try {
        await sendMail({
          to,
          subject: `⚠️ Alerta SOS — ${student.name}`,
          html: `<p>Foi ativado um alerta SOS para o/a aluno/a <strong>${student.name}</strong> (${student.className || ""}).</p><p>Por favor verifique a situação na plataforma AtlanticoFit.</p>`,
        });
      } catch {
        // Email failure is non-critical
      }
    }

    return NextResponse.json(alert, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST sos error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
