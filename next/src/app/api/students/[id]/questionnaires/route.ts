import { type NextRequest } from "next/server";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  created,
  err,
  ok,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { getStudentAccessContext } from "@/lib/student-access";
import { questionnaireSchema } from "@/lib/validations";

// GET /api/students/[id]/questionnaires
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
      PERMISSIONS.READ_QUESTIONNAIRES,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    await auditLog({
      userId: session.user.id,
      action: "read_questionnaires",
      targetId: id,
    }).catch(console.error);

    const questionnaires = await prisma.questionnaire.findMany({
      where: { studentId: id },
      orderBy: { submittedAt: "desc" },
    });

    return ok(questionnaires);
  } catch (error) {
    console.error("GET questionnaires error:", error);
    return serverError();
  }
}

// POST /api/students/[id]/questionnaires
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
      PERMISSIONS.SUBMIT_QUESTIONNAIRES,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    const body = await req.json();
    const data = questionnaireSchema.parse(body);

    await auditLog({
      userId: session.user.id,
      action: "submit_questionnaire",
      targetId: id,
    }).catch(console.error);

    const questionnaire = await prisma.questionnaire.create({
      data: {
        studentId: id,
        type: data.type,
        payload: data.payload as object,
        deferredCount: data.deferredCount,
      },
    });

    return created(questionnaire);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("POST questionnaires error:", error);
    return serverError();
  }
}
