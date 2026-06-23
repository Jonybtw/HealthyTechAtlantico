import { type NextRequest } from "next/server";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  created,
  err,
  forbidden,
  notFound,
  ok,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { prisma } from "@/lib/prisma";
import { isStaffRole, PERMISSIONS } from "@/lib/rbac";
import { getStudentAccessContext } from "@/lib/student-access";
import { sendReportMail365 } from "@/lib/microsoft-365-mailer";
import { buildReportHtml } from "@/lib/report-email";
import { reportEmailSchema } from "@/lib/validations";

// POST /api/students/[id]/reports/email
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const role = session.user.role as Role;
    if (!isStaffRole(role)) {
      return forbidden();
    }

    const { id } = await params;
    const access = await getStudentAccessContext(
      id,
      session.user.id,
      role,
      PERMISSIONS.SEND_REPORTS,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        guardians: {
          include: {
            guardian: {
              select: { email: true, name: true },
            },
          },
        },
        biometrics: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
        tests: {
          orderBy: { recordedAt: "desc" },
          take: 3,
        },
      },
    });
    if (!student) {
      return notFound("Aluno não encontrado");
    }

    const body = await req.json();
    const data = reportEmailSchema.parse(body);
    const guardianLink = student.guardians.find(
      (guardian) => guardian.guardianUserId === data.guardianUserId,
    );
    if (!guardianLink) {
      return notFound("Encarregado não associado a este aluno");
    }

    await auditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.SEND_REPORT,
      targetId: id,
    }).catch(console.error);

    const report = await prisma.report.create({
      data: {
        studentId: id,
        title: data.title,
        emailedTo: guardianLink.guardian.email,
        schoolYear: data.schoolYear ?? null,
        createdById: session.user.id,
      },
    });

    let emailSent = false;
    try {
      await sendReportMail365({
        to: guardianLink.guardian.email,
        recipientName: guardianLink.guardian.name,
        subject: `${data.title} - ${student.name}`,
        html: buildReportHtml({
          studentName: student.name,
          guardianName: guardianLink.guardian.name,
          className: student.className,
          schoolYear: data.schoolYear ?? student.schoolYear ?? null,
          title: data.title,
          latestBiometric: student.biometrics[0]
            ? {
                heightM: Number(student.biometrics[0].heightM),
                weightKg: Number(student.biometrics[0].weightKg),
                imc: Number(student.biometrics[0].imc),
                imcZone: student.biometrics[0].imcZone,
              }
            : null,
          latestTests: student.tests.map((test) => ({
            testId: test.testId,
            valueText: test.valueText,
            unit: test.unit,
            zone: test.zone,
          })),
        }),
        attachments: data.pdfAttachment ? [data.pdfAttachment] : undefined,
      });
      emailSent = true;
    } catch (error) {
      emailSent = false;
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Report email failed:", {
        studentId: id,
        guardianEmail: guardianLink.guardian.email,
        error: message,
      });
    }

    if (emailSent) {
      return created({ report, emailSent });
    }

    return ok({ report, emailSent }, 207);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("POST report email error:", error);
    return serverError();
  }
}
