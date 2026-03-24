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
import { sendMail } from "@/lib/mailer";
import { escapeHtml } from "@/lib/utils";
import { reportEmailSchema } from "@/lib/validations";

function buildReportHtml(params: {
  studentName: string;
  guardianName: string | null;
  className: string | null;
  schoolYear: string | null;
  title: string;
  latestBiometric: {
    heightM: number;
    weightKg: number;
    imc: number;
    imcZone: string;
  } | null;
  latestTests: { testId: string; valueText: string; unit: string; zone: string }[];
}) {
  const biometricBlock = params.latestBiometric
    ? `
      <p><strong>Altura:</strong> ${params.latestBiometric.heightM} m</p>
      <p><strong>Peso:</strong> ${params.latestBiometric.weightKg} kg</p>
      <p><strong>IMC:</strong> ${params.latestBiometric.imc} (${escapeHtml(params.latestBiometric.imcZone)})</p>
    `
    : "<p>Sem dados biométricos recentes.</p>";

  const testsBlock = params.latestTests.length
    ? `<ul>${params.latestTests
        .map(
          (test) =>
            `<li><strong>${escapeHtml(test.testId)}</strong>: ${escapeHtml(test.valueText)} ${escapeHtml(test.unit)} (${escapeHtml(test.zone)})</li>`,
        )
        .join("")}</ul>`
    : "<p>Sem testes físicos recentes.</p>";

  return `
    <div style="font-family: Arial, sans-serif; color: #14304c; line-height: 1.5;">
      <h2>${escapeHtml(params.title)}</h2>
      <p>Olá${params.guardianName ? ` ${escapeHtml(params.guardianName)}` : ""},</p>
      <p>Segue o resumo mais recente do aluno <strong>${escapeHtml(params.studentName)}</strong>.</p>
      <p><strong>Turma:</strong> ${escapeHtml(params.className ?? "Sem turma")}<br /><strong>Ano letivo:</strong> ${escapeHtml(params.schoolYear ?? "N/D")}</p>
      <h3>Biometria</h3>
      ${biometricBlock}
      <h3>Testes físicos</h3>
      ${testsBlock}
    </div>
  `;
}

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
      await sendMail({
        to: guardianLink.guardian.email,
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
      });
      emailSent = true;
    } catch {
      emailSent = false;
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
