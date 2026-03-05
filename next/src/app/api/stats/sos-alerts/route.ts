import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import type { Role } from "@prisma/client";

// GET /api/stats/sos-alerts
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!canRole(session.user.role as Role, PERMISSIONS.READ_SOS)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const alerts = await prisma.sosAlert.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: { name: true, className: true, schoolYear: true },
        },
      },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("GET sos-alerts error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
