/**
 * Shared TypeScript types barrel.
 * Import domain types from here instead of reaching into lib/ internals.
 *
 * @example
 *   import type { SessionUser, Permission } from "@/types";
 */
import type { Session } from "next-auth";

export type AppSession = Session;
export type AppSessionUser = Session["user"];

// Auth / Session
export type { SessionUser } from "@/lib/auth-guard";

// RBAC
export type { Permission } from "@/lib/rbac";
export { PERMISSIONS } from "@/lib/rbac";

// Prisma enums (re-exported for convenience)
export type { Role, Sex, QuestionnaireType } from "@prisma/client";
