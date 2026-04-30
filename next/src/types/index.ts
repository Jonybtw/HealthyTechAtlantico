/**
 * Shared TypeScript types barrel.
 * Import domain types from here instead of reaching into lib/ internals.
 *
 * @example
 *   import type { SessionUser, Permission } from "@/types";
 */
import type { Session } from "next-auth";

export type AppSessionUser = Session["user"];
