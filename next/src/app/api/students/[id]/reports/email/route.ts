import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import { reportEmailSchema } from "@/lib/validations";
import { sendMail } from "@/lib/mailer";
import { auditLog } from "@/lib/audit";
import type { Role } from "@prisma/client";

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
      <p><strong>IMC:</strong> ${params.latestBiometric.imc} (${params.latestBiometric.imcZone})</p>
    `
    : "<p>Sem dados biométricos recentes.</p>";

  const testsBlock = params.latestTests.length
    ? `<ul>${params.latestTests
        .map(
          (test) =>
            `<li><strong>${test.testId}</strong>: ${test.valueText} ${test.unit} (${test.zone})</li>`
        )
        .join("")}</ul>`
    : "<p>Sem testes físicos recentes.</p>";

  return `
    <div style="font-family: Arial, sans-serif; color: #14304c; line-height: 1.5;">
      <h2>${params.title}</h2>
      <p>Olá${params.guardianName ? ` ${params.guardianName}` : ""},</p>
      <p>Segue o resumo mais recente do aluno <strong>${params.studentName}</strong>.</p>
      <p><strong>Turma:</strong> ${params.className ?? "Sem turma"}<br /><strong>Ano letivo:</strong> ${params.schoolYear ?? "N/D"}</p>
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const role = session.user.role as Role;
    if (!canRole(role, PERMISSIONS.SEND_REPORTS)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id } = await params;
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
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const data = reportEmailSchema.parse(body);
    const guardianLink = student.guardians.find(
      (guardian) => guardian.guardianUserId === data.guardianUserId
    );
    if (!guardianLink) {
      return NextResponse.json(
        { error: "Encarregado não associado a este aluno" },
        { status: 404 }
      );
    }

    await auditLog({ userId: session.user.id, action: "send_report", targetId: id }).catch(() => {});

    // Save report metadata
    const report = await prisma.report.create({
      data: {
        studentId: id,
        title: data.title,
        emailedTo: guardianLink.guardian.email,
        schoolYear: data.schoolYear ?? null,
        createdById: session.user.id,
      },
    });

    // Send email (non-blocking)
    let emailSent = false;
    try {
      await sendMail({
        to: guardianLink.guardian.email,
        subject: `${data.title} — ${student.name}`,
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
      // Email failure is non-critical
    }

    return NextResponse.json(
      { report, emailSent },
      { status: emailSent ? 201 : 207 }
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST report email error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
