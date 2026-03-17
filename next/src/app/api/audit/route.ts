import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { forbidden, ok, serverError, unauthorized } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { canRole, PERMISSIONS } from "@/lib/rbac";

// GET /api/audit - last 100 audit log entries (ADMIN only)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    if (!canRole(session.user.role as Role, PERMISSIONS.READ_AUDIT)) {
      return forbidden();
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    return ok(
      logs.map((log) => ({
        id: log.id,
        action: log.action,
        targetId: log.targetId,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt.toISOString(),
        userEmail: log.user?.email ?? null,
        userName: log.user?.name ?? null,
      })),
    );
  } catch (error) {
    console.error("GET /api/audit error:", error);
    return serverError();
  }
}
