import { hash } from "bcryptjs";
import { type NextRequest } from "next/server";
import { z } from "zod";
import {
  conflict,
  created,
  notFound,
  ok,
  serverError,
  validationError,
} from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { sendVerificationEmail } from "@/lib/auth-emails";
import { prisma } from "@/lib/prisma";
import { guardianSelfRegisterSchema } from "@/lib/validations";
import {
  buildGuardianVerificationIdentifier,
  issueVerificationToken,
} from "@/lib/verification-tokens";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = guardianSelfRegisterSchema.parse(body);

    const student = await prisma.student.findUnique({
      where: {
        processNumber: data.studentProcessNumber,
      },
      select: {
        id: true,
        processNumber: true,
      },
    });

    if (!student?.processNumber) {
      return notFound("Não foi encontrado um aluno com esse número de processo.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (
      existingUser &&
      (existingUser.role !== "PAIS" || existingUser.emailVerified)
    ) {
      return conflict("Email já registado");
    }

    const passwordHash = await hash(data.password, 12);

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: data.name,
            passwordHash,
            consentRgpd: data.consentRgpd,
            mustChangePassword: false,
          },
        })
      : await prisma.user.create({
          data: {
            email: data.email,
            name: data.name,
            passwordHash,
            role: "PAIS",
            consentRgpd: data.consentRgpd,
          },
        });

    const identifier = buildGuardianVerificationIdentifier(
      student.processNumber,
      user.email,
    );
    const { token } = await issueVerificationToken(identifier);
    const verificationUrl = new URL(
      `/verify-email?token=${encodeURIComponent(token)}`,
      req.nextUrl.origin,
    ).toString();

    await sendVerificationEmail({
      email: user.email,
      name: user.name,
      verificationUrl,
      audience: "guardian",
    });

    await auditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.REGISTER,
      targetId: user.id,
    }).catch(console.error);

    if (existingUser) {
      return ok({ email: user.email, verificationSent: true });
    }

    return created({ email: user.email, verificationSent: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("POST /api/auth/register/guardian error:", error);
    return serverError();
  }
}
