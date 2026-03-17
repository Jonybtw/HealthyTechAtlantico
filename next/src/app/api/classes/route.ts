import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { forbidden, ok, serverError, unauthorized } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { canRole, PERMISSIONS } from "@/lib/rbac";

// GET /api/classes - list academic years and their classes
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    if (!canRole(session.user.role as Role, PERMISSIONS.READ_CLASS_REPORTS)) {
      return forbidden();
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

    return ok(years);
  } catch (error) {
    console.error("GET classes error:", error);
    return serverError();
  }
}
