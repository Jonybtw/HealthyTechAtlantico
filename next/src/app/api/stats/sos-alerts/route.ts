import { auth } from "@/lib/auth";
import { forbidden, ok, serverError, unauthorized } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { canAccessSosInbox } from "@/lib/rbac";
import { normalizeSosAlerts } from "@/lib/sos-alerts";

// GET /api/stats/sos-alerts
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    if (!canAccessSosInbox(session.user.role)) {
      return forbidden();
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

    const normalizedAlerts = await normalizeSosAlerts(alerts);
    return ok(normalizedAlerts);
  } catch (error) {
    console.error("GET sos-alerts error:", error);
    return serverError();
  }
}
