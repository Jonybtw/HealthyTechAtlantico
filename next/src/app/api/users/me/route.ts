import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getRolePermissions } from "@/lib/rbac";
import { updateConsentSchema } from "@/lib/validations";
import { auditLog } from "@/lib/audit";

// GET /api/users/me — current user profile + permissions
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        consentRgpd: true,
        consentShare: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      permissions: getRolePermissions(user.role),
    });
  } catch (error) {
    console.error("GET /api/users/me error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PUT /api/users/me — update consent flags
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const data = updateConsentSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        consentRgpd: true,
        consentShare: true,
      },
    });

    await auditLog({
      userId: session.user.id,
      action: "update_consent",
      targetId: session.user.id,
    }).catch(() => {});

    return NextResponse.json(user);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("PUT /api/users/me error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
