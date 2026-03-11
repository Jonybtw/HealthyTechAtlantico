import { type NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createStaffSchema } from "@/lib/validations";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import type { Role } from "@prisma/client";

const createStaffWithNameSchema = createStaffSchema.extend({
  name: z.string().min(2).optional(),
});

// GET /api/admin/staff — list all PROFESSOR and PSICOLOGO accounts
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (!canRole(session.user.role as Role, PERMISSIONS.MANAGE_STAFF)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const staff = await prisma.user.findMany({
      where: { role: { in: ["PROFESSOR", "PSICOLOGO"] } },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("GET /api/admin/staff error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/admin/staff — create a new PROFESSOR or PSICOLOGO account (session-auth)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (!canRole(session.user.role as Role, PERMISSIONS.MANAGE_STAFF)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const data = createStaffWithNameSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email já registado" }, { status: 409 });
    }

    const passwordHash = await hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name ?? null,
        passwordHash,
        role: data.role,
        consentRgpd: true,
        consentShare: true,
      },
      select: { id: true, email: true, role: true, name: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST /api/admin/staff error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/admin/staff — remove a staff account (body: { userId })
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (!canRole(session.user.role as Role, PERMISSIONS.MANAGE_STAFF)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
    }
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Não pode remover a sua própria conta." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: userId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/admin/staff error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
