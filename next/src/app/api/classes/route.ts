import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import type { Role } from "@prisma/client";

// GET /api/classes — list distinct school years
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const years = await prisma.academicYear.findMany({
      orderBy: { label: "desc" },
      include: {
        classes: {
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(years);
  } catch (error) {
    console.error("GET classes error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
