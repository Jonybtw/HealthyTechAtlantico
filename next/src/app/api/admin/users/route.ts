import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  forbidden,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api-response";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    if (!canRole(session.user.role as Role, PERMISSIONS.MANAGE_STAFF)) {
      return forbidden();
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        mustChangePassword: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(users);
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return serverError();
  }
}
