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
import { studentSelfRegisterSchema } from "@/lib/validations";
import {
  buildStudentVerificationIdentifier,
  issueVerificationToken,
} from "@/lib/verification-tokens";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = studentSelfRegisterSchema.parse(body);

    const student = await prisma.student.findUnique({
      where: {
        processNumber: data.studentProcessNumber,
      },
      select: {
        id: true,
        processNumber: true,
        linkedUserId: true,
      },
    });

    if (!student?.processNumber) {
      return notFound("Não foi encontrado um aluno com esse número de processo.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (
      student.linkedUserId &&
      (!existingUser || student.linkedUserId !== existingUser.id)
    ) {
      return conflict("Este aluno já está associado a outra conta.");
    }

    if (
      existingUser &&
      (existingUser.role !== "ALUNO" || existingUser.emailVerified)
    ) {
      return conflict("E-mail já registado");
    }

    if (existingUser) {
      const existingLinkedStudent = await prisma.student.findUnique({
        where: {
          linkedUserId: existingUser.id,
        },
        select: {
          id: true,
        },
      });

      if (existingLinkedStudent && existingLinkedStudent.id !== student.id) {
        return conflict("Esta conta já está associada a outro aluno.");
      }
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
            role: "ALUNO",
            consentRgpd: data.consentRgpd,
          },
        });

    const identifier = buildStudentVerificationIdentifier(
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
      audience: "student",
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

    console.error("POST /api/auth/register/student error:", error);
    return serverError();
  }
}
