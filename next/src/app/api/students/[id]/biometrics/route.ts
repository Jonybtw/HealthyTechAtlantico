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
import { PERMISSIONS, type Permission } from "@/lib/rbac";
import { getStudentAccessContext } from "@/lib/student-access";
import { biometricsSchema } from "@/lib/validations";

async function checkAccess(
  studentId: string,
  userId: string,
  role: Role,
  permission: Permission,
) {
  return getStudentAccessContext(studentId, userId, role, permission);
}

// GET /api/students/[id]/biometrics
export async function GET(
  _req: NextRequest,
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
    const access = await checkAccess(
      id,
      session.user.id,
      session.user.role as Role,
      PERMISSIONS.READ_BIOMETRICS,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    await auditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.READ_BIOMETRICS,
      targetId: id,
    }).catch(console.error);

    const biometrics = await prisma.biometric.findMany({
      where: { studentId: id },
      orderBy: { recordedAt: "desc" },
    });

    return ok(biometrics);
  } catch (error) {
    console.error("GET biometrics error:", error);
    return serverError();
  }
}

// POST /api/students/[id]/biometrics
export async function POST(
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
    const access = await checkAccess(
      id,
      session.user.id,
      session.user.role as Role,
      PERMISSIONS.RECORD_BIOMETRICS,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    const body = await req.json();
    const data = biometricsSchema.parse(body);

    const biometric = await prisma.biometric.create({
      data: {
        studentId: id,
        sessionId: data.sessionId ?? null,
        heightM: data.heightM,
        weightKg: data.weightKg,
        fatPct: data.fatPct ?? null,
        waistCm: data.waistCm ?? null,
        imc: data.imc,
        imcZone: data.imcZone,
        fatZone: data.fatZone ?? null,
        waistZone: data.waistZone ?? null,
      },
    });

    await auditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.RECORD_BIOMETRICS,
      targetId: id,
    }).catch(console.error);

    return created(biometric);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("POST biometrics error:", error);
    return serverError();
  }
}
