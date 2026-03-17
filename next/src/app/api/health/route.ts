import { ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return ok({
      ok: true,
      status: "ready",
      services: {
        database: "up",
      },
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Healthcheck failed:", error);

    return ok(
      {
        ok: false,
        status: "degraded",
        services: {
          database: "down",
        },
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      503,
    );
  }
}
