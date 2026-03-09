import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { UserProvider } from "@/components/user-context";
import type { Role } from "@prisma/client";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = session.user as { id: string; email: string; role: Role };

  return (
    <UserProvider user={user}>
      <AppShell user={user}>{children}</AppShell>
    </UserProvider>
  );
}

