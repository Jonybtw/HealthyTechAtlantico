import { type NextRequest } from "next/server";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  badRequest,
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
import { buildReportHtml } from "@/lib/report-email";
import { canRole, isStaffRole, PERMISSIONS } from "@/lib/rbac";
import { sendReportMail365 } from "@/lib/microsoft-365-mailer";

const classReportEmailSchema = z.object({
  classId: z.string().min(1),
  title: z.string().default("Relatorio HealthyTechAtlantico"),
});

// POST /api/classes/reports/email
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const role = session.user.role as Role;
    if (
      !isStaffRole(role) ||
      !canRole(role, PERMISSIONS.SEND_REPORTS) ||
      !canRole(role, PERMISSIONS.READ_CLASS_REPORTS)
    ) {
      return forbidden();
    }

    const body = await req.json();
    const data = classReportEmailSchema.parse(body);

    const schoolClass = await prisma.schoolClass.findUnique({
      where: { id: data.classId },
      include: { academicYear: { select: { label: true } } },
    });
    if (!schoolClass) {
      return notFound("Turma nao encontrada");
    }

    const students = await prisma.student.findMany({
      where: {
        schoolYear: schoolClass.academicYear.label,
        className: schoolClass.name,
      },
      orderBy: { name: "asc" },
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

    if (students.length === 0) {
      return badRequest("A turma selecionada nao tem alunos.");
    }

    let sent = 0;
    let failed = 0;
    let skippedNoGuardian = 0;
    let firstError: string | null = null;

    for (const student of students) {
      if (student.guardians.length === 0) {
        skippedNoGuardian += 1;
        continue;
      }

      for (const guardianLink of student.guardians) {
        await prisma.report.create({
          data: {
            studentId: student.id,
            title: data.title,
            emailedTo: guardianLink.guardian.email,
            schoolYear: student.schoolYear,
            createdById: session.user.id,
          },
        });

        try {
          await sendReportMail365({
            to: guardianLink.guardian.email,
            recipientName: guardianLink.guardian.name,
            subject: `${data.title} - ${student.name}`,
            html: buildReportHtml({
              studentName: student.name,
              guardianName: guardianLink.guardian.name,
              className: student.className,
              schoolYear: student.schoolYear,
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
          });
          sent += 1;
        } catch (error) {
          failed += 1;
          const message =
            error instanceof Error ? error.message : "Erro desconhecido";
          firstError ??= message;
          console.error("Class report email failed:", {
            studentId: student.id,
            guardianEmail: guardianLink.guardian.email,
            error: message,
          });
        }
      }

      await auditLog({
        userId: session.user.id,
        action: AUDIT_ACTIONS.SEND_REPORT,
        targetId: student.id,
      }).catch(console.error);
    }

    return ok(
      {
        classId: data.classId,
        className: schoolClass.name,
        schoolYear: schoolClass.academicYear.label,
        students: students.length,
        sent,
        failed,
        skippedNoGuardian,
        firstError,
      },
      failed > 0 ? 207 : 200,
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("POST class report email error:", error);
    return serverError();
  }
}
