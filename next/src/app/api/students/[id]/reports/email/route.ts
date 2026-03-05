import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccessStudentByRole, PERMISSIONS } from "@/lib/rbac";
import { reportEmailSchema } from "@/lib/validations";
import { sendMail } from "@/lib/mailer";
import type { Role } from "@prisma/client";

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

    const { id } = await params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: { guardians: { select: { guardianUserId: true } } },
    });
    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const isOwner = student.userId === session.user.id;
    const isGuardian = student.guardians.some((g) => g.guardianUserId === session.user.id);

    if (!canAccessStudentByRole({ role: session.user.role as Role, permission: PERMISSIONS.SEND_REPORTS, isOwner, isGuardian })) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const data = reportEmailSchema.parse(body);

    // Save report metadata
    const report = await prisma.report.create({
      data: {
        studentId: id,
        title: data.title,
        emailedTo: data.emailedTo,
        schoolYear: data.schoolYear ?? null,
        createdById: session.user.id,
      },
    });

    // Send email (non-blocking)
    let emailSent = false;
    try {
      await sendMail({
        to: data.emailedTo,
        subject: `${data.title} — ${student.name}`,
        html: data.htmlContent || `<p>Relatório para ${student.name}.</p>`,
      });
      emailSent = true;
    } catch {
      // Email failure is non-critical
    }

    return NextResponse.json(
      { report, emailSent },
      { status: emailSent ? 201 : 207 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST report email error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
