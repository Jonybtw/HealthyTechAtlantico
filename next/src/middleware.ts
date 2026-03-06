import { NextRequest, NextResponse } from "next/server";

// ── In-process sliding-window rate limiter ────────────────────────────────────
// NOTE: This resets on serverless cold starts. For production use Redis.

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (entry.count >= limit) {
    const retryAfterSec = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  entry.count++;
  return { allowed: true, retryAfterSec: 0 };
}

// Clean up stale entries every 5 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > 15 * 60 * 1000) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Sign-in endpoint only: 20 attempts per 15 minutes per IP
  if (pathname === "/api/auth/signin" && req.method === "POST") {
    const { allowed, retryAfterSec } = rateLimit(`auth:${ip}`, 20, 15 * 60 * 1000);
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Demasiadas tentativas. Tente mais tarde." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterSec),
          },
        }
      );
    }
  }
  // General API: 120 requests per minute per IP
  else if (pathname.startsWith("/api")) {
    const { allowed, retryAfterSec } = rateLimit(`api:${ip}`, 120, 60 * 1000);
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Limite de pedidos excedido." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterSec),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
