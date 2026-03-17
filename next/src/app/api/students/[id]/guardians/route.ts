import { type NextRequest } from "next/server";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  badRequest,
  created,
  err,
  noContent,
  notFound,
  ok,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { getStudentAccessContext } from "@/lib/student-access";
import { guardianSchema } from "@/lib/validations";

// GET /api/students/[id]/guardians - list guardians for a student
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const { id } = await params;
    const access = await getStudentAccessContext(
      id,
      session.user.id,
      session.user.role as Role,
      PERMISSIONS.MANAGE_GUARDIANS,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    const links = await prisma.studentGuardian.findMany({
      where: { studentId: id },
      include: { guardian: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });

    return ok(
      links.map((link) => ({
        id: link.guardianUserId,
        relationship: link.relationship,
        guardian: { name: link.guardian.name, email: link.guardian.email },
      })),
    );
  } catch (error) {
    console.error("GET guardians error:", error);
    return serverError();
  }
}

// POST /api/students/[id]/guardians - link a guardian by email
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const { id } = await params;
    const access = await getStudentAccessContext(
      id,
      session.user.id,
      session.user.role as Role,
      PERMISSIONS.MANAGE_GUARDIANS,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    const body = await req.json();
    const data = guardianSchema.parse(body);

    const guardianUser = await prisma.user.findUnique({
      where: { email: data.guardianEmail },
    });
    if (!guardianUser) {
      return notFound(`Nenhum utilizador com e-mail "${data.guardianEmail}".`);
    }
    if (guardianUser.role !== "PAIS") {
      return badRequest("O utilizador não tem o perfil de Encarregado de Educação.");
    }

    const link = await prisma.studentGuardian.upsert({
      where: {
        studentId_guardianUserId: { studentId: id, guardianUserId: guardianUser.id },
      },
      update: { relationship: data.relationship },
      create: {
        studentId: id,
        guardianUserId: guardianUser.id,
        relationship: data.relationship,
        createdById: session.user.id,
      },
    });

    return created(link);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("POST guardians error:", error);
    return serverError();
  }
}

// DELETE /api/students/[id]/guardians (body: { guardianUserId })
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const { id } = await params;
    const access = await getStudentAccessContext(
      id,
      session.user.id,
      session.user.role as Role,
      PERMISSIONS.MANAGE_GUARDIANS,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    const body = await req.json();
    const guardianUserId = body?.guardianUserId as string | undefined;
    if (!guardianUserId) {
      return badRequest("guardianUserId obrigatório");
    }

    await prisma.studentGuardian.deleteMany({
      where: { studentId: id, guardianUserId },
    });

    return noContent();
  } catch (error) {
    console.error("DELETE guardians error:", error);
    return serverError();
  }
}
