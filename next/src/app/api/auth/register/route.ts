import { type NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { type Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { isStaffRole } from "@/lib/rbac";
import {
  conflict,
  created,
  forbidden,
  serverError,
  validationError,
} from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    if (data.role === "ALUNO" || data.role === "PAIS") {
      const session = await auth();
      if (!session?.user?.id || !isStaffRole(session.user.role as Role)) {
        return forbidden("A criação de contas ALUNO/PAIS requer privilégios na plataforma.");
      }
    }

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return conflict("Email já registado");
    }

    const passwordHash = await hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        emailVerified: new Date(),
        name: data.name,
        passwordHash,
        role: data.role,
        consentRgpd: data.consentRgpd,
      },
    });

    await auditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.REGISTER,
      targetId: user.id,
    }).catch(console.error);

    return created({ id: user.id, email: user.email, role: user.role });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("Register error:", error);
    return serverError();
  }
}
