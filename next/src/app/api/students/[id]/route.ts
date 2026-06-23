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
import { auditLog } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { recordConsentHistory } from "@/lib/consent-history";
import { prisma } from "@/lib/prisma";
import { isStaffRole, PERMISSIONS } from "@/lib/rbac";
import { getStudentAccessContext } from "@/lib/student-access";
import { updateStudentSchema } from "@/lib/validations";

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
    const access = await getStudentAccessContext(
      id,
      session.user.id,
      session.user.role as Role,
      PERMISSIONS.UPDATE_STUDENT
    );

    if (!access.ok) {
      return err(access.error, access.status);
    }

    const body = await req.json();
    const data = updateStudentSchema.parse(body);

    const shouldLogStudentUpdate =
      data.name !== undefined ||
      data.sex !== undefined ||
      data.birthDate !== undefined ||
      data.age !== undefined ||
      data.schoolYear !== undefined ||
      data.className !== undefined;
    const shouldLogConsentUpdate = data.kidmedConsentGranted !== undefined;

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
        ...(data.kidmedConsentGranted !== undefined && {
          kidmedConsentAt: data.kidmedConsentGranted ? new Date() : null,
          kidmedConsentRecordedById: data.kidmedConsentGranted
            ? session.user.id
            : null,
        }),
      },
    });

    if (shouldLogStudentUpdate) {
      await auditLog({
        userId: session.user.id,
        action: AUDIT_ACTIONS.UPDATE_STUDENT,
        targetId: student.id,
      }).catch(console.error);
    }

    if (shouldLogConsentUpdate) {
      await auditLog({
        userId: session.user.id,
        action: AUDIT_ACTIONS.UPDATE_CONSENT,
        targetId: student.id,
      }).catch(console.error);

      await recordConsentHistory({
        subjectStudentId: student.id,
        changedById: session.user.id,
        field: "kidmedConsent",
        previousValue: Boolean(existingStudent.kidmedConsentAt),
        nextValue: Boolean(student.kidmedConsentAt),
        reason: "student_detail_update",
      }).catch(console.error);
    }

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

    try {
      await prisma.student.delete({ where: { id } });
    } catch (deleteError: unknown) {
      if (
        typeof deleteError === "object" &&
        deleteError !== null &&
        "code" in deleteError &&
        deleteError.code === "P2025"
      ) {
        return notFound("Aluno não encontrado");
      }
      throw deleteError;
    }

    await auditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.DELETE_STUDENT,
      targetId: id,
    }).catch(console.error);

    return noContent();
  } catch (error) {
    console.error("DELETE /api/students/[id] error:", error);
    return serverError();
  }
}
