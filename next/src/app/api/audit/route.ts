import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import type { Role } from "@prisma/client";

// GET /api/audit — last 100 audit log entries (ADMIN only)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (!canRole(session.user.role as Role, PERMISSIONS.READ_AUDIT)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    return NextResponse.json(
      logs.map((l) => ({
        id: l.id,
        action: l.action,
        targetId: l.targetId,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt.toISOString(),
        userEmail: l.user?.email ?? null,
        userName: l.user?.name ?? null,
      }))
    );
  } catch (error) {
    console.error("GET /api/audit error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
