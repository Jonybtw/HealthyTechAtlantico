import { hash } from "bcryptjs";
import type { Role } from "@prisma/client";
import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { sendTemporaryPasswordEmail } from "@/lib/auth-emails";
import { generateTemporaryPassword } from "@/lib/password-policy";
import { prisma } from "@/lib/prisma";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import {
  buildForcePasswordResetIdentifier,
  issueVerificationToken,
} from "@/lib/verification-tokens";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    if (!canRole(session.user.role as Role, PERMISSIONS.MANAGE_STAFF)) {
      return forbidden();
    }

    const { id } = await params;

    if (id === session.user.id) {
      return badRequest("Nao pode forcar um reset de password para a sua propria conta.");
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      return notFound("Utilizador nao encontrado");
    }

    const temporaryPassword = generateTemporaryPassword(12);
    const passwordHash = await hash(temporaryPassword, 12);

    const identifier = buildForcePasswordResetIdentifier(user.email);

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          mustChangePassword: true,
        },
      });

      const { token } = await issueVerificationToken(identifier);
      const resetUrl = new URL(
        `/change-password?forced=1&email=${encodeURIComponent(
          user.email,
        )}&token=${encodeURIComponent(token)}`,
        _req.nextUrl.origin,
      ).toString();

      await sendTemporaryPasswordEmail({
        email: user.email,
        name: user.name,
        temporaryPassword,
        resetUrl,
      });
    } catch (error) {
      await prisma.user
        .update({
          where: { id: user.id },
          data: {
            passwordHash: user.passwordHash,
            mustChangePassword: user.mustChangePassword,
          },
        })
        .catch(console.error);
      await prisma.verificationToken
        .deleteMany({ where: { identifier } })
        .catch(console.error);

      console.error("POST /api/admin/users/[id]/force-reset-password reset error:", error);
      return serverError(
        "Nao foi possivel enviar a password temporaria por email.",
      );
    }

    await auditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.FORCE_PASSWORD_RESET,
      targetId: user.id,
    }).catch(console.error);

    return ok({ email: user.email });
  } catch (error) {
    console.error("POST /api/admin/users/[id]/force-reset-password error:", error);
    return serverError();
  }
}
