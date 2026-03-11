import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { questionnaireSchema } from "@/lib/validations";
import { auditLog } from "@/lib/audit";
import type { Role } from "@prisma/client";
import { getStudentAccessContext } from "@/lib/student-access";

// GET /api/students/[id]/questionnaires
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
      PERMISSIONS.READ_QUESTIONNAIRES
    );
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    await auditLog({ userId: session.user.id, action: "read_questionnaires", targetId: id }).catch(() => {});

    const questionnaires = await prisma.questionnaire.findMany({
      where: { studentId: id },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(questionnaires);
  } catch (error) {
    console.error("GET questionnaires error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/students/[id]/questionnaires
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
      PERMISSIONS.SUBMIT_QUESTIONNAIRES
    );
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await req.json();
    const data = questionnaireSchema.parse(body);

    await auditLog({ userId: session.user.id, action: "submit_questionnaire", targetId: id }).catch(() => {});

    const questionnaire = await prisma.questionnaire.create({
      data: {
        studentId: id,
        type: data.type,
        payload: data.payload as object,
        deferredCount: data.deferredCount,
      },
    });

    return NextResponse.json(questionnaire, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST questionnaires error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
