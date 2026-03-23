import { auth } from "@/lib/auth";
import { canRole, type Permission } from "@/lib/rbac";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import type { AppSessionUser } from "@/types";

export type SessionUser = AppSessionUser;

/**
 * Require an authenticated session. Redirects to /login if not authenticated.
 * Use in Server Components and Server Actions.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user as SessionUser;
}

/**
 * Require one of the given roles for app pages.
 * Redirects authenticated-but-unauthorized users back to /dashboard.
 */
export async function requireAnyRole(
  roles: readonly Role[],
  redirectTo = "/dashboard"
): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    redirect(redirectTo);
  }
  return user;
}

/**
 * Require a specific permission. Throws 403 if missing.
 * Use in API Route Handlers.
 */
export async function requirePermission(
  permission: Permission
): Promise<SessionUser> {
  const user = await requireAuth();
  if (!canRole(user.role, permission)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/**
 * Require RGPD consent for health data access.
 */
export async function requireConsent(): Promise<SessionUser> {
  const user = await requireAuth();
  if (!user.consentRgpd) {
    throw new Error("CONSENT_REQUIRED");
  }
  return user;
}

/**
 * Get current session user or null (non-redirecting).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as SessionUser;
}
