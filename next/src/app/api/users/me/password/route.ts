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
import { changePasswordSchema } from "@/lib/validations";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const body = await req.json();
    const data = changePasswordSchema.parse(body);

    const user = await changePasswordForUser({
      userId: session.user.id,
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });

    await auditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.CHANGE_PASSWORD,
      targetId: session.user.id,
    }).catch(console.error);

    return ok({ ok: true, userId: user.id });
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

    console.error("PUT /api/users/me/password error:", error);
    return serverError();
  }
}
