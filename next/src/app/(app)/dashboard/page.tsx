import type { Metadata } from "next";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
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
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  const dashboardMessages = (messages.dashboard ?? {}) as Record<string, string>;
  const navMessages = (messages.nav ?? {}) as Record<string, string>;
  const questionnaireMessages = (messages.questionarios ??
    {}) as Record<string, string>;
  const summary = await getDashboardSummaryForUser({
    email: user.email,
    id: user.id,
    role: user.role,
  });
  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? dashboardMessages.greetingMorning ?? "Bom dia"
      : now.getHours() < 19
        ? dashboardMessages.greetingAfternoon ?? "Boa tarde"
        : dashboardMessages.greetingEvening ?? "Boa noite";
  const todayLabel = new Intl.DateTimeFormat(
    locale === "en" ? "en-GB" : "pt-PT",
    { dateStyle: "full" },
  ).format(now);

  return (
    <DashboardClient
      greeting={greeting}
      locale={locale}
      messages={{
        dashboard: dashboardMessages,
        nav: navMessages,
        questionarios: questionnaireMessages,
      }}
      todayLabel={todayLabel}
      username={user.name ?? user.email.split("@")[0]}
      summary={summary}
    />
  );
}
