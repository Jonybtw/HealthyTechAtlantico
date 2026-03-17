import { type NextRequest } from "next/server";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  err,
  forbidden,
  noContent,
  notFound,
  ok,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { isStaffRole, PERMISSIONS } from "@/lib/rbac";
import { getStudentAccessContext } from "@/lib/student-access";
import { createStudentSchema } from "@/lib/validations";

// GET /api/students/[id]
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
      PERMISSIONS.READ_STUDENT_PROFILE,
    );

    if (!access.ok) {
      return err(access.error, access.status);
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        guardians: { select: { guardianUserId: true } },
      },
    });

    if (!student) {
      return notFound("Aluno não encontrado");
    }

    return ok(student);
  } catch (error) {
    console.error("GET /api/students/[id] error:", error);
    return serverError();
  }
}

// PUT /api/students/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    if (!isStaffRole(session.user.role as Role)) {
      return forbidden();
    }

    const { id } = await params;
    const body = await req.json();
    const data = createStudentSchema.partial().parse(body);

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.sex && { sex: data.sex }),
        ...(data.birthDate !== undefined && {
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
        }),
        ...(data.age !== undefined && { age: data.age }),
        ...(data.schoolYear !== undefined && { schoolYear: data.schoolYear }),
        ...(data.className !== undefined && { className: data.className }),
      },
    });

    return ok(student);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("PUT /api/students/[id] error:", error);
    return serverError();
  }
}

// DELETE /api/students/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    if (!isStaffRole(session.user.role as Role)) {
      return forbidden();
    }

    const { id } = await params;
    const existing = await prisma.student.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return notFound("Aluno não encontrado");
    }

    await prisma.student.delete({ where: { id } });
    return noContent();
  } catch (error) {
    console.error("DELETE /api/students/[id] error:", error);
    return serverError();
  }
}
