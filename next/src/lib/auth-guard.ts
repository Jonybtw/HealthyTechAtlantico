import { auth } from "@/lib/auth";
import { canRole, type Permission } from "@/lib/rbac";
import { redirect } from "next/navigation";
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
