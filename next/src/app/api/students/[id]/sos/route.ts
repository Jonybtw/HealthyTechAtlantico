import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { sosSchema } from "@/lib/validations";
import { sendMail } from "@/lib/mailer";
import { auditLog } from "@/lib/audit";
import { escapeHtml } from "@/lib/utils";
import type { Role } from "@prisma/client";
import { getStudentAccessContext } from "@/lib/student-access";

const sosAlertInclude = {
  student: {
    select: {
      id: true,
      name: true,
      className: true,
      schoolYear: true,
    },
  },
  resolvedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} as const;

// GET /api/students/[id]/sos
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
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

    const alerts = await prisma.sosAlert.findMany({
      where: { studentId: id },
      orderBy: { createdAt: "desc" },
      include: sosAlertInclude,
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("GET sos error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/students/[id]/sos
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
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
      select: {
        id: true,
        name: true,
        className: true,
        schoolYear: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Aluno nao encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const data = sosSchema.parse(body);

    const existingAlert = await prisma.sosAlert.findFirst({
      where: {
        studentId: id,
        resolved: false,
      },
      include: sosAlertInclude,
    });

    if (existingAlert) {
      return NextResponse.json(
        {
          error: "Ja existe um alerta SOS pendente para este aluno.",
          alert: existingAlert,
        },
        { status: 409 }
      );
    }

    const alert = await prisma.sosAlert.create({
      data: {
        studentId: id,
        psych: data.psych,
        teacher: data.teacher,
        psychEmail: data.psychEmail ?? null,
        teacherEmail: data.teacherEmail ?? null,
      },
      include: sosAlertInclude,
    });

    await auditLog({
      userId: session.user.id,
      action: "trigger_sos",
      targetId: alert.id,
    }).catch(console.error);

    const emails = [data.psychEmail, data.teacherEmail].filter(Boolean) as string[];
    if (emails.length > 0) {
      const classLabel = student.className ? ` (${escapeHtml(student.className)})` : "";

      await Promise.allSettled(
        emails.map((to) =>
          sendMail({
            to,
            subject: `SOS alert - ${student.name}`,
            html: `<p>Foi ativado um alerta SOS para o/a aluno/a <strong>${escapeHtml(student.name)}</strong>${classLabel}.</p><p>Por favor verifique a situacao na plataforma HealthyTech Atlantico.</p>`,
          })
        )
      );
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
