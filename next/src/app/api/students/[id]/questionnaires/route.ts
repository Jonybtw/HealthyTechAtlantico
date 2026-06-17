import { type NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma, Role } from "@prisma/client";
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
import {
  decryptQuestionnairePayload,
  encryptQuestionnairePayload,
} from "@/lib/questionnaire-payload-codec";

function enrichEmotionalPayload(payload: Extract<
  z.infer<typeof questionnaireSchema>,
  { type: "EMOCIONAL" }
>["payload"]) {
  const who5Score = Object.values(payload.who5).reduce(
    (total, value) => total + value,
    0,
  );
  const symptomDailyCount = Object.values(payload.symptoms).filter(
    (value) => value === 4,
  ).length;
  const socialValues = Object.values(payload.social);
  const socialAverage =
    Math.round(
      (socialValues.reduce((total, value) => total + value, 0) /
        socialValues.length) *
        10,
    ) / 10;
  const riskSignal =
    who5Score < 10 ||
    symptomDailyCount >= 3 ||
    payload.lifeSatisfaction <= 3 ||
    payload.futureExpectation <= 3;

  return {
    ...payload,
    who5Score,
    symptomDailyCount,
    socialAverage,
    riskSignal,
  };
}

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

    const decoded = questionnaires.map(
      ({ payloadEncrypted, payload, ...questionnaire }) => ({
        ...questionnaire,
        payload: decryptQuestionnairePayload(payloadEncrypted, payload),
      }),
    );

    return ok(decoded);
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
    let payloadForClient: unknown = data.payload;

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

    const questionnaireData: Prisma.QuestionnaireUncheckedCreateInput | Response =
      data.type === "KIDMED"
        ? await (async (): Promise<
            Prisma.QuestionnaireUncheckedCreateInput | Response
          > => {
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
              payloadEncrypted: encryptQuestionnairePayload(data.payload),
              deferredCount: 0,
            };
          })()
        : await (async (): Promise<Prisma.QuestionnaireUncheckedCreateInput> => {
            if (data.type === "EMOCIONAL") {
              const payload = enrichEmotionalPayload(data.payload);
              payloadForClient = payload;

              return {
                studentId: id,
                type: data.type,
                payloadEncrypted: encryptQuestionnairePayload(payload),
                score: payload.who5Score,
                deferredCount: data.deferredCount,
              };
            }

            return {
              studentId: id,
              type: data.type,
              payloadEncrypted: encryptQuestionnairePayload(data.payload),
              deferredCount: data.deferredCount,
            };
          })();

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

    // Nunca devolvemos payload cifrado ao cliente.
    // Mantemos o formato esperado pelo frontend (`payload` como objeto).
    const { payloadEncrypted: _payloadEncrypted, ...safeQuestionnaire } =
      questionnaire;
    return created({ ...safeQuestionnaire, payload: payloadForClient });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("POST questionnaires error:", error);
    return serverError();
  }
}
