import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { UserProvider } from "@/components/user-context";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <UserProvider user={session.user as { id: string; email: string; role: import("@prisma/client").Role }}>
      <AppShell user={session.user as any}>{children}</AppShell>
    </UserProvider>
  );
}

