"use client";

import { useTranslations } from "next-intl";
import { createContext, useContext, useMemo } from "react";
import type { Role } from "@prisma/client";

interface UserContextValue {
  id: string;
  email: string;
  role: Role;
  name?: string | null;
}

interface UserContextDerivedValue extends UserContextValue {
  /** Localized human-readable role label (e.g. "Professor"). */
  roleLabel: string;
  /** 1–2 character avatar initials, derived from name or email. */
  initials: string;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: UserContextValue;
  children: React.ReactNode;
}) {
  // Memoize the provider value so consumers don't re-render on every render
  // of a parent that may pass the same `user` prop identity.
  const value = useMemo(() => user, [user]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

function computeInitials(name?: string | null, email?: string | null): string {
  const source = (name && name.trim()) || (email ? email.split("@")[0] : "");
  if (!source) return "··";
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1
    ? `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`
    : (parts[0]?.slice(0, 2) ?? "");
  return letters.toUpperCase() || "··";
}

export function useUser(): UserContextDerivedValue {
  const ctx = useContext(UserContext);
  const t = useTranslations("roles");

  if (!ctx) {
    throw new Error("useUser must be used inside UserProvider");
  }

  return useMemo<UserContextDerivedValue>(
    () => ({
      ...ctx,
      roleLabel: t(ctx.role),
      initials: computeInitials(ctx.name, ctx.email),
    }),
    [ctx, t],
  );
}
