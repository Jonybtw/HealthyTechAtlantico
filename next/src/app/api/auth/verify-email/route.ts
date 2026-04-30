import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseVerificationIdentifier } from "@/lib/verification-tokens";

function redirectToLogin(req: NextRequest) {
  const url = new URL("/login", req.url);
  url.searchParams.set("verified", "1");
  return NextResponse.redirect(url);
}

function redirectToVerifyPage(
  req: NextRequest,
  status: "missing" | "invalid" | "expired" | "student_not_found",
) {
  const url = new URL("/verify-email", req.url);
  url.searchParams.set("status", status);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return redirectToVerifyPage(req, "missing");
  }

  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return redirectToVerifyPage(req, "invalid");
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken
        .delete({
          where: { token: verificationToken.token },
        })
        .catch(console.error);

      return redirectToVerifyPage(req, "expired");
    }

    const parsedIdentifier = parseVerificationIdentifier(
      verificationToken.identifier,
    );

    if (!parsedIdentifier) {
      return redirectToVerifyPage(req, "invalid");
    }

    if (parsedIdentifier.kind === "force_password_reset") {
      return redirectToVerifyPage(req, "invalid");
    }

    const user = await prisma.user.findUnique({
      where: { email: parsedIdentifier.email },
      select: {
        id: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return redirectToVerifyPage(req, "invalid");
    }

    if (
      (parsedIdentifier.kind === "student_register" && user.role !== "ALUNO") ||
      (parsedIdentifier.kind === "guardian_register" && user.role !== "PAIS")
    ) {
      return redirectToVerifyPage(req, "invalid");
    }

    if (parsedIdentifier.kind === "guardian_register") {
      const student = await prisma.student.findUnique({
        where: {
          processNumber: parsedIdentifier.studentProcessNumber,
        },
        select: { id: true },
      });

      if (!student) {
        return redirectToVerifyPage(req, "student_not_found");
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: user.emailVerified ?? new Date(),
          },
        }),
        prisma.studentGuardian.upsert({
          where: {
            studentId_guardianUserId: {
              studentId: student.id,
              guardianUserId: user.id,
            },
          },
          update: {
            relationship: "encarregado",
            createdById: user.id,
          },
          create: {
            studentId: student.id,
            guardianUserId: user.id,
            relationship: "encarregado",
            createdById: user.id,
          },
        }),
        prisma.verificationToken.delete({
          where: { token: verificationToken.token },
        }),
      ]);

      return redirectToLogin(req);
    }

    if (parsedIdentifier.kind === "student_register") {
      const student = await prisma.student.findUnique({
        where: {
          processNumber: parsedIdentifier.studentProcessNumber,
        },
        select: {
          id: true,
          linkedUserId: true,
        },
      });

      if (!student) {
        return redirectToVerifyPage(req, "student_not_found");
      }

      if (student.linkedUserId && student.linkedUserId !== user.id) {
        return redirectToVerifyPage(req, "invalid");
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: user.emailVerified ?? new Date() },
        }),
        prisma.student.update({
          where: { id: student.id },
          data: { linkedUserId: user.id },
        }),
        prisma.verificationToken.delete({
          where: { token: verificationToken.token },
        }),
      ]);
      return redirectToLogin(req);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: user.emailVerified ?? new Date(),
        },
      }),
      prisma.verificationToken.delete({
        where: { token: verificationToken.token },
      }),
    ]);

    return redirectToLogin(req);
  } catch (error) {
    console.error("GET /api/auth/verify-email error:", error);
    return redirectToVerifyPage(req, "invalid");
  }
}
