import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  badRequest,
  notFound,
  ok,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import {
  changePasswordForUser,
  PasswordChangeInvalidCurrentPasswordError,
  PasswordChangePolicyError,
  PasswordChangeUserNotFoundError,
} from "@/lib/password-change";
import { prisma } from "@/lib/prisma";
import { publicChangePasswordSchema } from "@/lib/validations";
import { parseVerificationIdentifier } from "@/lib/verification-tokens";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const data = publicChangePasswordSchema.parse(body);

    let email = session?.user?.email;
    const userId = session?.user?.id;
    let resetTokenToDelete: string | null = null;

    if (!userId || !email) {
      if (!data.token) {
        return unauthorized(
          "Acesso não autorizado. Inicie sessão ou use o link de reset enviado por e-mail.",
        );
      }

      const verificationToken = await prisma.verificationToken.findUnique({
        where: { token: data.token },
      });

      if (!verificationToken) {
        return badRequest("Token invalido");
      }

      if (verificationToken.expires < new Date()) {
        await prisma.verificationToken
          .deleteMany({ where: { token: verificationToken.token } })
          .catch(console.error);

        return badRequest("Token expirado");
      }

      const parsedIdentifier = parseVerificationIdentifier(
        verificationToken.identifier,
      );

      if (
        !parsedIdentifier ||
        parsedIdentifier.kind !== "force_password_reset"
      ) {
        return badRequest("Token invalido");
      }

      email = parsedIdentifier.email;
      resetTokenToDelete = verificationToken.token;
    }

    const user = await changePasswordForUser({
      email,
      userId,
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });

    if (resetTokenToDelete) {
      await prisma.verificationToken.deleteMany({
        where: { token: resetTokenToDelete },
      });
    }

    await auditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.CHANGE_PASSWORD,
      targetId: user.id,
    }).catch(console.error);

    return ok({ ok: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    if (error instanceof PasswordChangeUserNotFoundError) {
      return notFound(error.message);
    }

    if (error instanceof PasswordChangeInvalidCurrentPasswordError) {
      return badRequest(error.message);
    }

    if (error instanceof PasswordChangePolicyError) {
      return badRequest(error.message);
    }

    console.error("POST /api/auth/change-password error:", error);
    return serverError();
  }
}
