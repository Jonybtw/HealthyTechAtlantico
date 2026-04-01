import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
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
  const t = await getTranslations("dashboard");
  const locale = await getLocale();
  const summary = await getDashboardSummaryForUser({
    id: user.id,
    role: user.role,
  });
  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? t("greetingMorning")
      : now.getHours() < 19
        ? t("greetingAfternoon")
        : t("greetingEvening");
  const todayLabel = new Intl.DateTimeFormat(
    locale === "en" ? "en-GB" : "pt-PT",
    { dateStyle: "full" },
  ).format(now);

  return (
    <DashboardClient
      greeting={greeting}
      todayLabel={todayLabel}
      username={user.name ?? user.email.split("@")[0]}
      summary={summary}
    />
  );
}
