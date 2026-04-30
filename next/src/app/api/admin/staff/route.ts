import { type NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  badRequest,
  conflict,
  created,
  forbidden,
  noContent,
  ok,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import { createStaffSchema } from "@/lib/validations";

// GET /api/admin/staff - list all PROFESSOR and PSICOLOGO accounts
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    if (!canRole(session.user.role as Role, PERMISSIONS.MANAGE_STAFF)) {
      return forbidden();
    }

    const staff = await prisma.user.findMany({
      where: { role: { in: ["PROFESSOR", "PSICOLOGO"] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(staff);
  } catch (error) {
    console.error("GET /api/admin/staff error:", error);
    return serverError();
  }
}

// POST /api/admin/staff - create a new PROFESSOR or PSICOLOGO account
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    if (!canRole(session.user.role as Role, PERMISSIONS.MANAGE_STAFF)) {
      return forbidden();
    }

    const body = await req.json();
    const data = createStaffSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return conflict("Email já registado");
    }

    const passwordHash = await hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        emailVerified: new Date(),
        name: data.name,
        passwordHash,
        role: data.role,
        consentRgpd: true,
        consentShare: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        createdAt: true,
      },
    });

    return created(user);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("POST /api/admin/staff error:", error);
    return serverError();
  }
}

// DELETE /api/admin/staff - remove a staff account (body: { userId })
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    if (!canRole(session.user.role as Role, PERMISSIONS.MANAGE_STAFF)) {
      return forbidden();
    }

    const { userId } = await req.json();
    if (!userId) {
      return badRequest("userId obrigatório");
    }

    if (userId === session.user.id) {
      return badRequest("Não pode remover a sua própria conta.");
    }

    await prisma.user.delete({ where: { id: userId } });
    return noContent();
  } catch (error) {
    console.error("DELETE /api/admin/staff error:", error);
    return serverError();
  }
}
