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
import { dispensaSchema } from "@/lib/validations";

// GET /api/students/[id]/dispensas
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
      PERMISSIONS.MANAGE_DISPENSAS,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    const dispensas = await prisma.dispensa.findMany({
      where: { studentId: id },
      orderBy: { startDate: "desc" },
    });

    return ok(dispensas);
  } catch (error) {
    console.error("GET dispensas error:", error);
    return serverError();
  }
}

// POST /api/students/[id]/dispensas
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
      PERMISSIONS.MANAGE_DISPENSAS,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    const body = await req.json();
    const data = dispensaSchema.parse(body);

    const dispensa = await prisma.dispensa.create({
      data: {
        studentId: id,
        reason: data.reason,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        medicalCertificate: data.medicalCertificate,
        createdById: session.user.id,
      },
    });

    return created(dispensa);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("POST dispensas error:", error);
    return serverError();
  }
}

// DELETE /api/students/[id]/dispensas (body: { dispensaId })
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
      PERMISSIONS.MANAGE_DISPENSAS,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    const body = await req.json();
    const dispensaId = body?.dispensaId as string | undefined;
    if (!dispensaId) {
      return badRequest("dispensaId obrigatório");
    }

    const dispensa = await prisma.dispensa.findUnique({ where: { id: dispensaId } });
    if (!dispensa || dispensa.studentId !== id) {
      return notFound("Dispensa não encontrada");
    }

    await prisma.dispensa.delete({ where: { id: dispensaId } });
    return noContent();
  } catch (error) {
    console.error("DELETE dispensas error:", error);
    return serverError();
  }
}
