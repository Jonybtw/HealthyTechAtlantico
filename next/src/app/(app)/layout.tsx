import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { UserProvider } from "@/components/user-context";
import { auth } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id || !session.user.email || !session.user.role) {
    redirect("/login");
  }

  return (
    <UserProvider user={session.user}>
      <AppShell user={session.user}>{children}</AppShell>
    </UserProvider>
  );
}
