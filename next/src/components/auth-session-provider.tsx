"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export function AuthSessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
