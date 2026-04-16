import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  created,
  notFound,
  ok,
  serverError,
  unauthorized,
  conflict,
  validationError,
} from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { prisma } from "@/lib/prisma";
import { normalizeSosAlerts } from "@/lib/sos-alerts";
import { sendMail } from "@/lib/mailer";
import { escapeHtml } from "@/lib/utils";
import { sosSchema } from "@/lib/validations";
import { getLinkedStudentByUserId } from "@/lib/student-access";

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

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const student = await getLinkedStudentByUserId(session.user.id);
    if (!student) {
      return notFound("Aluno ligado não encontrado");
    }

    const alerts = await prisma.sosAlert.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      include: sosAlertInclude,
    });

    await auditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.READ_SOS,
      targetId: student.id,
    }).catch(console.error);

    const normalizedAlerts = await normalizeSosAlerts(alerts);
    return ok(normalizedAlerts);
  } catch (error) {
    console.error("GET /api/me/sos error:", error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const student = await getLinkedStudentByUserId(session.user.id);
    if (!student) {
      return notFound("Aluno ligado não encontrado");
    }

    const body = await req.json();
    const data = sosSchema.parse(body);

    const existingAlert = await prisma.sosAlert.findFirst({
      where: {
        studentId: student.id,
        resolved: false,
      },
      include: sosAlertInclude,
    });

    if (existingAlert) {
      return conflict("Já existe um alerta SOS pendente para este aluno.");
    }

    const alert = await prisma.sosAlert.create({
      data: {
        studentId: student.id,
        psych: data.psych,
        teacher: data.teacher,
        psychEmail: data.psychEmail ?? null,
        teacherEmail: data.teacherEmail ?? null,
      },
      include: sosAlertInclude,
    });

    await auditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.TRIGGER_SOS,
      targetId: alert.id,
    }).catch(console.error);

    const emails = [data.psychEmail, data.teacherEmail].filter(
      Boolean,
    ) as string[];
    if (emails.length > 0) {
      const classLabel = student.className
        ? ` (${escapeHtml(student.className)})`
        : "";

      await Promise.allSettled(
        emails.map((to) =>
          sendMail({
            to,
            subject: `SOS alert - ${student.name}`,
            html: `<p>Foi ativado um alerta SOS para o/a aluno/a <strong>${escapeHtml(
              student.name,
            )}</strong>${classLabel}.</p><p>Por favor verifique a situação na plataforma HealthyTech Atlantico.</p>`,
          }),
        ),
      );
    }

    const [normalizedAlert] = await normalizeSosAlerts([alert]);
    return created(normalizedAlert);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("POST /api/me/sos error:", error);
    return serverError();
  }
}
