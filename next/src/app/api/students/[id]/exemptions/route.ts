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
import { auditLog } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { getStudentAccessContext } from "@/lib/student-access";
import { exemptionSchema } from "@/lib/validations";

// GET /api/students/[id]/exemptions
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
      PERMISSIONS.MANAGE_EXEMPTIONS,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    const exemptions = await prisma.exemption.findMany({
      where: { studentId: id },
      orderBy: { startDate: "desc" },
    });

    return ok(exemptions);
  } catch (error) {
    console.error("GET exemptions error:", error);
    return serverError();
  }
}

// POST /api/students/[id]/exemptions
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
      PERMISSIONS.MANAGE_EXEMPTIONS,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    const body = await req.json();
    const data = exemptionSchema.parse(body);

    const exemption = await prisma.exemption.create({
      data: {
        studentId: id,
        reason: data.reason,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        medicalCertificate: data.medicalCertificate,
        createdById: session.user.id,
      },
    });

    await auditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.CREATE_EXEMPTION,
      targetId: exemption.id,
    }).catch(console.error);

    return created(exemption);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("POST exemptions error:", error);
    return serverError();
  }
}

// DELETE /api/students/[id]/exemptions (body: { exemptionId })
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
      PERMISSIONS.MANAGE_EXEMPTIONS,
    );
    if (!access.ok) {
      return err(access.error, access.status);
    }

    const body = await req.json();
    const exemptionId = body?.exemptionId as string | undefined;
    if (!exemptionId) {
      return badRequest("exemptionId obrigatório");
    }

    const exemption = await prisma.exemption.findUnique({
      where: { id: exemptionId },
    });
    if (!exemption || exemption.studentId !== id) {
      return notFound("Exemption não encontrada");
    }

    await prisma.exemption.delete({ where: { id: exemptionId } });

    await auditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.DELETE_EXEMPTION,
      targetId: exemptionId,
    }).catch(console.error);

    return noContent();
  } catch (error) {
    console.error("DELETE exemptions error:", error);
    return serverError();
  }
}
