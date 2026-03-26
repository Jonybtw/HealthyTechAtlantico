import { type NextRequest } from "next/server";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  forbidden,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { prisma } from "@/lib/prisma";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import { normalizeSosAlerts } from "@/lib/sos-alerts";

const sosAlertInclude = {
  student: {
    select: {
      id: true,
      name: true,
      className: true,
      schoolYear: true,
    },
  },
  resolvedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} as const;

// PATCH /api/sos/[alertId]
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ alertId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const role = session.user.role as Role;
    if (!canRole(role, PERMISSIONS.READ_SOS) || role === "ALUNO") {
      return forbidden();
    }

    const { alertId } = await params;
    const existingAlert = await prisma.sosAlert.findUnique({
      where: { id: alertId },
      include: sosAlertInclude,
    });

    if (!existingAlert) {
      return notFound("Alerta SOS não encontrado");
    }

    if (existingAlert.resolved) {
      return ok(existingAlert);
    }

    const alert = await prisma.sosAlert.update({
      where: { id: alertId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedById: session.user.id,
      },
      include: sosAlertInclude,
    });

    await auditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.RESOLVE_SOS,
      targetId: alertId,
    }).catch(console.error);

    const [normalizedAlert] = await normalizeSosAlerts([alert]);
    return ok(normalizedAlert);
  } catch (error) {
    console.error("PATCH sos error:", error);
    return serverError();
  }
}
