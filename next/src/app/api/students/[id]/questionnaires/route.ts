import { type NextRequest } from "next/server";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  conflict,
  created,
  err,
  ok,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { prisma } from "@/lib/prisma";
import {
  evaluateKidmed,
  getSchoolPeriodInfo,
  KIDMED_INSTRUMENT_VERSION,
} from "@/lib/questionnaires";
import { PERMISSIONS } from "@/lib/rbac";
import { getStudentAccessContext } from "@/lib/student-access";
import {
  listQuestionnairesQuerySchema,
  questionnaireSchema,
} from "@/lib/validations";

// GET /api/students/[id]/questionnaires
export async function GET(
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
      PERMISSIONS.READ_QUESTIONNAIRES,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    const { searchParams } = new URL(req.url);
    const { type, limit } = listQuestionnairesQuerySchema.parse(
      Object.fromEntries(searchParams.entries()),
    );

    await auditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.READ_QUESTIONNAIRES,
      targetId: id,
    }).catch(console.error);

    const questionnaires = await prisma.questionnaire.findMany({
      where: {
        studentId: id,
        ...(type ? { type } : {}),
      },
      orderBy: { submittedAt: "desc" },
      ...(limit ? { take: limit } : {}),
    });

    return ok(questionnaires);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

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

    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        kidmedConsentAt: true,
      },
    });

    if (!student) {
      return err("Aluno nao encontrado", 404);
    }

    const questionnaireData =
      data.type === "KIDMED"
        ? await (async () => {
            if (!student.kidmedConsentAt) {
              return err(
                "Consentimento parental obrigatorio para o KIDMED",
                403,
              );
            }

            const period = getSchoolPeriodInfo();
            const duplicate = await prisma.questionnaire.findFirst({
              where: {
                studentId: id,
                type: data.type,
                schoolYear: period.schoolYear,
                periodKey: period.periodKey,
              },
              select: { id: true },
            });

            if (duplicate) {
              return conflict("O KIDMED ja foi submetido neste periodo letivo");
            }

            const result = evaluateKidmed(data.payload);

            return {
              studentId: id,
              type: data.type,
              instrumentVersion: KIDMED_INSTRUMENT_VERSION,
              schoolYear: period.schoolYear,
              periodKey: period.periodKey,
              score: result.score,
              classification: result.classification,
              payload: data.payload,
              deferredCount: 0,
            };
          })()
        : {
            studentId: id,
            type: data.type,
            payload: data.payload,
            deferredCount: data.deferredCount,
          };

    if (questionnaireData instanceof Response) {
      return questionnaireData;
    }

    const questionnaire = await prisma.questionnaire.create({
      data: questionnaireData,
    });

    await auditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.SUBMIT_QUESTIONNAIRE,
      targetId: id,
    }).catch(console.error);

    return created(questionnaire);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("POST questionnaires error:", error);
    return serverError();
  }
}
