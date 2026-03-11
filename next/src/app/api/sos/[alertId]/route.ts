import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import { auditLog } from "@/lib/audit";
import type { Role } from "@prisma/client";

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
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const role = session.user.role as Role;
    if (!canRole(role, PERMISSIONS.READ_SOS) || role === "ALUNO") {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const { alertId } = await params;
    const existingAlert = await prisma.sosAlert.findUnique({
      where: { id: alertId },
      include: sosAlertInclude,
    });

    if (!existingAlert) {
      return NextResponse.json({ error: "Alerta SOS nao encontrado" }, { status: 404 });
    }

    if (existingAlert.resolved) {
      return NextResponse.json(existingAlert);
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
      action: "resolve_sos",
      targetId: alertId,
    }).catch(() => {});

    return NextResponse.json(alert);
  } catch (error) {
    console.error("PATCH sos error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
