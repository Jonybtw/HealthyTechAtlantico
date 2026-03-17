import { type NextRequest } from "next/server";
import { compare, hash } from "bcryptjs";
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
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const body = await req.json();
    const data = changePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return notFound("Utilizador não encontrado");
    }

    const valid = await compare(data.currentPassword, user.passwordHash);
    if (!valid) {
      return badRequest("Password atual incorreta");
    }

    const passwordHash = await hash(data.newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    await auditLog({
      userId: session.user.id,
      action: "change_password",
      targetId: session.user.id,
    }).catch(console.error);

    return ok({ ok: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("PUT /api/users/me/password error:", error);
    return serverError();
  }
}
