import { type NextRequest } from "next/server";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  conflict,
  created,
  err,
  notFound,
  ok,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { getStudentAccessContext } from "@/lib/student-access";
import { sendMail } from "@/lib/mailer";
import { escapeHtml } from "@/lib/utils";
import { sosSchema } from "@/lib/validations";

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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const { id } = await params;
    const access = await getStudentAccessContext(
      id,
      session.user.id,
      session.user.role as Role,
      PERMISSIONS.READ_SOS,
    );

    if (!access.ok) {
      return err(access.error, access.status);
    }

    const alerts = await prisma.sosAlert.findMany({
      where: { studentId: id },
      orderBy: { createdAt: "desc" },
      include: sosAlertInclude,
    });

    return ok(alerts);
  } catch (error) {
    console.error("GET sos error:", error);
    return serverError();
  }
}

// POST /api/students/[id]/sos
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const { id } = await params;
    const access = await getStudentAccessContext(
      id,
      session.user.id,
      session.user.role as Role,
      PERMISSIONS.TRIGGER_SOS,
    );

    if (!access.ok) {
      return err(access.error, access.status);
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
      return notFound("Aluno não encontrado");
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
      return conflict("Já existe um alerta SOS pendente para este aluno.");
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
            html: `<p>Foi ativado um alerta SOS para o/a aluno/a <strong>${escapeHtml(student.name)}</strong>${classLabel}.</p><p>Por favor verifique a situação na plataforma HealthyTech Atlantico.</p>`,
          }),
        ),
      );
    }

    return created(alert);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("POST sos error:", error);
    return serverError();
  }
}
