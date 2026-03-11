import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccessSosInbox } from "@/lib/rbac";

// GET /api/stats/sos-alerts
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    if (!canAccessSosInbox(session.user.role)) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const alerts = await prisma.sosAlert.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
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
      },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("GET sos-alerts error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
