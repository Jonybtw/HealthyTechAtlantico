import { type NextRequest } from "next/server";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  created,
  err,
  forbidden,
  ok,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { getStudentAccessContext } from "@/lib/student-access";
import { testsSchema } from "@/lib/validations";

// GET /api/students/[id]/tests
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    if (!session.user.consentRgpd) {
      return forbidden("Consentimento RGPD necessário");
    }

    const { id } = await params;
    const access = await getStudentAccessContext(
      id,
      session.user.id,
      session.user.role as Role,
      PERMISSIONS.READ_TESTS,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    await auditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.READ_TESTS,
      targetId: id,
    }).catch(console.error);

    const latestOnly = req.nextUrl.searchParams.get("latest") === "true";

    const tests = await prisma.test.findMany({
      where: { studentId: id },
      orderBy: { recordedAt: "desc" },
    });

    const result = latestOnly
      ? Object.values(
          tests.reduce<Record<string, (typeof tests)[number]>>((acc, test) => {
            if (!acc[test.testId]) {
              acc[test.testId] = test;
            }
            return acc;
          }, {}),
        )
      : tests;

    return ok(result);
  } catch (error) {
    console.error("GET tests error:", error);
    return serverError();
  }
}

// POST /api/students/[id]/tests - batch insert
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
      PERMISSIONS.RECORD_TESTS,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    if (!session.user.consentRgpd) {
      return forbidden("Consentimento RGPD necessário");
    }

    const body = await req.json();
    const data = testsSchema.parse(body);

    await auditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.RECORD_TESTS,
      targetId: id,
    }).catch(console.error);

    const createdTests = await prisma.$transaction(
      data.tests.map((test) =>
        prisma.test.create({
          data: {
            studentId: id,
            sessionId: data.sessionId ?? null,
            testId: test.testId,
            valueNum: test.valueNum ?? null,
            valueText: test.valueText,
            unit: test.unit,
            zone: test.zone,
          },
        }),
      ),
    );

    return created({
      count: createdTests.length,
      tests: createdTests,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("POST tests error:", error);
    return serverError();
  }
}
