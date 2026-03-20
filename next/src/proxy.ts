import { type NextRequest, NextResponse } from "next/server";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "on",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Content-Security-Policy":
    "default-src 'self'; " +
    "base-uri 'self'; " +
    "object-src 'none'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';",
};

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

function applySecurityHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "https"
  ) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

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
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.windowStart + windowMs - now) / 1000),
    };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > 15 * 60 * 1000) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function proxy(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (request.nextUrl.pathname.startsWith("/api")) {
    const pathname = request.nextUrl.pathname;
    const isAuthSignin = pathname === "/api/auth/signin" && request.method === "POST";
    const isImportEndpoint = pathname.includes("/import") && request.method === "POST";

    const limit = isAuthSignin
      ? rateLimit(`auth:${ip}`, 8, 15 * 60 * 1000)
      : isImportEndpoint
        ? rateLimit(`import:${ip}`, 10, 60 * 60 * 1000)
        : rateLimit(`api:${ip}`, 120, 60 * 1000);

    if (!limit.allowed) {
      return applySecurityHeaders(
        new NextResponse(
          JSON.stringify({
            error: isAuthSignin
              ? "Demasiadas tentativas de autenticação. Tente mais tarde."
              : isImportEndpoint
                ? "Limite de importações excedido. Tente novamente mais tarde."
                : "Limite de pedidos excedido.",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(limit.retryAfterSec),
            },
          }
        ),
        request
      );
    }
  }

  return applySecurityHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
