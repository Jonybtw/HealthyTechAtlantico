import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth-guard";
import { getDashboardSummaryForUser } from "@/lib/dashboard";
import { DashboardClient } from "./dashboard-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");

  return {
    title: t("title"),
  };
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const summary = await getDashboardSummaryForUser({
    id: user.id,
    role: user.role,
  });

  return (
    <DashboardClient
      username={user.name ?? user.email.split("@")[0]}
      summary={summary}
    />
  );
}
