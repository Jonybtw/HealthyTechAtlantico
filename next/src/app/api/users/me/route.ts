import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  ok,
  notFound,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { recordConsentHistory } from "@/lib/consent-history";
import { prisma } from "@/lib/prisma";
import { getRolePermissions } from "@/lib/rbac";
import { updateConsentSchema } from "@/lib/validations";

// GET /api/users/me - current user profile + permissions
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        consentRgpd: true,
        consentShare: true,
        createdAt: true,
      },
    });

    if (!user) {
      return notFound("Utilizador não encontrado");
    }

    return ok({
      ...user,
      permissions: getRolePermissions(user.role),
    });
  } catch (error) {
    console.error("GET /api/users/me error:", error);
    return serverError();
  }
}

// PUT /api/users/me - update consent flags
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const body = await req.json();
    const data = updateConsentSchema.parse(body);

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        consentRgpd: true,
        consentShare: true,
      },
    });

    if (!currentUser) {
      return notFound("Utilizador nÃ£o encontrado");
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        consentRgpd: true,
        consentShare: true,
      },
    });

    await auditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.UPDATE_CONSENT,
      targetId: session.user.id,
    }).catch(console.error);

    const consentChanges = [
      {
        field: "consentRgpd" as const,
        previousValue: currentUser.consentRgpd,
        nextValue: data.consentRgpd,
      },
      {
        field: "consentShare" as const,
        previousValue: currentUser.consentShare,
        nextValue: data.consentShare,
      },
    ].filter(
      (
        change,
      ): change is {
        field: "consentRgpd" | "consentShare";
        previousValue: boolean;
        nextValue: boolean;
      } =>
        change.nextValue !== undefined &&
        change.previousValue !== change.nextValue,
    );

    await Promise.all(
      consentChanges.map((change) =>
        recordConsentHistory({
          subjectUserId: session.user.id,
          changedById: session.user.id,
          field: change.field,
          previousValue: change.previousValue,
          nextValue: change.nextValue,
          reason: "profile_update",
        }),
      ),
    ).catch(console.error);

    return ok(user);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("PUT /api/users/me error:", error);
    return serverError();
  }
}
