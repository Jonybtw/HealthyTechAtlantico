import { type NextRequest } from "next/server";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  forbidden,
  ok,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api-response";
import type {
  AuditLogListItem,
  AuditLogListResponse,
} from "@/lib/audit-actions";
import { prisma } from "@/lib/prisma";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import { listAuditQuerySchema } from "@/lib/validations";

// GET /api/audit - list audit log entries (ADMIN only)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    if (!canRole(session.user.role as Role, PERMISSIONS.READ_AUDIT)) {
      return forbidden();
    }

    const { searchParams } = new URL(req.url);
    const parsedQuery = listAuditQuerySchema.parse(
      Object.fromEntries(searchParams.entries()),
    );
    const { page, limit, action, startDate, endDate, sortBy, sortDir } =
      parsedQuery;
    const skip = (page - 1) * limit;

    const where = {
      ...(action
        ? {
            action: { contains: action, mode: "insensitive" as const },
          }
        : {}),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortDir },
        include: {
          user: { select: { email: true, name: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const serializedLogs: AuditLogListItem[] = logs.map((log) => ({
      id: log.id,
      action: log.action,
      targetId: log.targetId,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
      userEmail: log.user?.email ?? null,
      userName: log.user?.name ?? null,
    }));

    return ok<AuditLogListResponse>({
      logs: serializedLogs,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("GET /api/audit error:", error);
    return serverError();
  }
}
