import { auth } from "@/lib/auth";
import { canAccessSosInbox } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { normalizeSosAlerts } from "@/lib/sos-alerts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const POLL_INTERVAL_MS = 5_000;
const HEARTBEAT_MS = 25_000;

const encoder = new TextEncoder();
const encoderText = (chunk: string) => encoder.encode(chunk);

/**
 * GET /api/sos/stream
 *
 * Server-Sent Events feed of normalized SOS alerts. Emits:
 *   - `data: { ...alerts }\n\n` on every poll
 *   - `:heartbeat` comment every 25s to keep the connection open
 *
 * The route uses `force-dynamic` so Next.js doesn't try to cache it.
 * Polling Prisma every 5s is acceptable at this scale (one writer,
 * low alert volume); swap for `LISTEN/NOTIFY` later if needed.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!canAccessSosInbox(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      function safeEnqueue(chunk: string) {
        if (closed) return;
        try {
          controller.enqueue(encoderText(chunk));
        } catch {
          closed = true;
        }
      }

      function close() {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }

      async function tick() {
        if (closed) return;
        try {
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
          const normalized = await normalizeSosAlerts(alerts);
          safeEnqueue(`data: ${JSON.stringify(normalized)}\n\n`);
        } catch (error) {
          // Emit a structured error event so the client can decide whether
          // to silently retry or surface it.
          safeEnqueue(
            `event: error\ndata: ${JSON.stringify({ message: "Failed to fetch alerts" })}\n\n`,
          );
          console.error("[sos/stream] poll error", error);
        }
      }

      // Initial tick, then a recurring poll.
      void tick();
      const pollHandle = setInterval(tick, POLL_INTERVAL_MS);
      const heartbeatHandle = setInterval(() => {
        safeEnqueue(`:heartbeat\n\n`);
      }, HEARTBEAT_MS);

      const signal = request.signal;
      signal.addEventListener("abort", () => {
        clearInterval(pollHandle);
        clearInterval(heartbeatHandle);
        close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
