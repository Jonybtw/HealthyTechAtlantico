import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import { auditLog } from "@/lib/audit";
import type { Role } from "@prisma/client";

// PATCH /api/sos/[alertId] — mark SOS resolved
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const role = session.user.role as Role;
    if (!canRole(role, PERMISSIONS.READ_SOS) || role === "ALUNO") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { alertId } = await params;

    await auditLog({ userId: session.user.id, action: "resolve_sos", targetId: alertId }).catch(() => {});

    const alert = await prisma.sosAlert.update({
      where: { id: alertId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedById: session.user.id,
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("PATCH sos error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
