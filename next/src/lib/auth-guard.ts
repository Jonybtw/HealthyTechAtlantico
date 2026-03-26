import { auth } from "@/lib/auth";
import { canRole, type Permission } from "@/lib/rbac";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import type { AppSessionUser } from "@/types";

/**
 * Require an authenticated session. Redirects to /login if not authenticated.
 * Use in Server Components and Server Actions.
 */
export async function requireAuth(): Promise<AppSessionUser> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user as AppSessionUser;
}

/**
 * Require one of the given roles for app pages.
 * Redirects authenticated-but-unauthorized users back to /dashboard.
 */
export async function requireAnyRole(
  roles: readonly Role[],
  redirectTo = "/dashboard"
): Promise<AppSessionUser> {
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
): Promise<AppSessionUser> {
  const user = await requireAuth();
  if (!canRole(user.role, permission)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
