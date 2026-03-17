"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  ClipboardList,
  FileText,
  Link2,
  Ruler,
  School,
  TrendingUp,
  Users,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { FadeIn, StaggerItem, StaggerList } from "@/components/ui/motion";
import { usePageTitle } from "@/hooks/use-page-title";
import type { DashboardCardData, DashboardSummary } from "@/lib/dashboard";

interface Props {
  username: string;
  summary: DashboardSummary;
}

const ICONS: Record<DashboardCardData["icon"], typeof Users> = {
  users: Users,
  activity: Activity,
  alert: AlertTriangle,
  school: School,
  file: FileText,
  book: BookOpen,
};

function formatDisplayDate(value: string | null, locale: string) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DashboardClient({ username, summary }: Props) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  usePageTitle(t("title"));

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("greetingMorning")
      : hour < 19
        ? t("greetingAfternoon")
        : t("greetingEvening");
  const todayLabel = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "pt-PT", {
    dateStyle: "full",
  }).format(new Date());

  if (summary.variant === "student") {
    if (!summary.studentSummary) {
      return (
        <PageScaffold
          className="gap-6"
          headerProps={{
            title: `${greeting}, ${username}!`,
            description: t("unlinkedDescription"),
            eyebrow: t("title"),
            meta: todayLabel,
          }}
        >
          <div className="flex min-h-[400px] items-center justify-center rounded-[22px] border border-dashed border-border/60 bg-muted/30 p-8 shadow-inner">
            <EmptyState
              icon={Link2}
              title={t("unlinkedTitle")}
              description={t("unlinkedDescription")}
            />
          </div>
        </PageScaffold>
      );
    }

    const firstName = summary.studentSummary.name.split(" ")[0] ?? summary.studentSummary.name;

    return (
      <PageScaffold
        className="gap-6"
        headerProps={{
          title: `${greeting}, ${firstName}!`,
          description: t("activitySummary"),
          eyebrow: t("title"),
          meta: todayLabel,
        }}
      >

        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
          <KpiCard
            icon={Activity}
            title={t("lastBiometric")}
            value={formatDisplayDate(summary.studentSummary.lastBiometric, locale)}
            description={t("lastMeasurement")}
            accent="blue"
            emphasis="hero"
            footer={
              <p className="text-sm text-muted-foreground">
                {summary.studentSummary.lastBiometric ? t("activitySummary") : t("unlinkedDescription")}
              </p>
            }
          />
          <KpiCard
            icon={ClipboardList}
            title={t("lastTests")}
            value={formatDisplayDate(summary.studentSummary.lastTest, locale)}
            description={t("lastTestDate")}
            accent="gold"
          />
        </div>

        <PageSection
          eyebrow={t("quickActions")}
          title={t("activitySummary")}
          description={t("lastMeasurement")}
          tone="secondary"
          layout="list"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { href: "/biometria", label: t("registerBiometric"), icon: Ruler },
              { href: "/testes", label: t("registerTests"), icon: ClipboardList },
              { href: "/relatorio", label: t("reportsAvailable"), icon: FileText },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group surface-utility flex items-center justify-between rounded-[20px] px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-navy-900 text-white dark:bg-gold-300 dark:text-navy-950">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </PageSection>
      </PageScaffold>
    );
  }

  const description =
    summary.variant === "staff"
      ? t("platformOverview")
      : summary.variant === "psychologist"
        ? t("psychologistOverview")
        : t("parentOverview");

  return (
    <PageScaffold
      className="gap-6"
      headerProps={{
        title: `${greeting}, ${username}!`,
        description,
        eyebrow: t("title"),
        meta: todayLabel,
      }}
    >
      {summary.cards.length > 0 ? (
        <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summary.cards.map((card) => (
            <StaggerItem key={card.id}>
              <KpiCard
                icon={ICONS[card.icon]}
                title={t(card.titleKey)}
                value={card.value}
                description={t(card.descriptionKey)}
                accent={card.accent}
              />
            </StaggerItem>
          ))}
        </StaggerList>
      ) : null}

      {summary.variant === "staff" && summary.zafByYear.length > 0 ? (
        <FadeIn delay={0.2}>
          {(() => {
            const totalZsaf = summary.zafByYear.reduce((sum, year) => sum + year.zsaf, 0);
            const totalZmf = summary.zafByYear.reduce((sum, year) => sum + year.zmf, 0);
            const totalWithBio = totalZsaf + totalZmf;
            const overallPct = totalWithBio > 0 ? Math.round((totalZsaf / totalWithBio) * 100) : 0;
            const donutData = [
              { name: t("zsaf"), value: totalZsaf, color: "var(--color-success-500)" },
              { name: t("zmf"), value: totalZmf, color: "var(--color-warning-500)" },
            ];

            return (
              <PageSection
                eyebrow={t("zafDistribution")}
                title={t("zafDistribution")}
                description={t("platformOverview")}
                tone="secondary"
                layout="analytics"
              >
                <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
                  <div className="surface-utility flex flex-col items-center gap-4 rounded-[22px] p-5 text-center">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <TrendingUp className="size-4 text-navy-600 dark:text-gold-300" />
                      {t("zafDistribution")}
                    </div>
                    <div className="relative h-[180px] w-[180px]">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={56}
                            outerRadius={78}
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {donutData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              border: "1px solid var(--color-border)",
                              background: "var(--color-card)",
                              fontSize: "13px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold tabular-nums">{overallPct}%</span>
                        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                          {t("zsaf")}
                        </span>
                      </div>
                    </div>
                    <div className="grid w-full gap-2">
                      {donutData.map((entry) => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between rounded-xl bg-card/60 px-3 py-2"
                        >
                          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                            <span
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            {entry.name}
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {summary.zafByYear.map((academicYear) => {
                      const pct =
                        academicYear.withBio > 0
                          ? Math.round((academicYear.zsaf / academicYear.withBio) * 100)
                          : 0;

                      return (
                        <div
                          key={academicYear.year}
                          className="surface-utility flex flex-col gap-4 rounded-[20px] p-5"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-foreground">
                              {academicYear.year}
                            </span>
                            <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              {academicYear.total} {t("studentsUnit")}
                            </span>
                          </div>
                          {academicYear.withBio > 0 ? (
                            <>
                              <div className="h-3 overflow-hidden rounded-full bg-navy-900/10 dark:bg-navy-900/40">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-success-500 to-success-400"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="grid gap-2 text-sm">
                                <div className="flex items-center justify-between text-success-700 dark:text-success-300">
                                  <span>{t("zsaf")}</span>
                                  <span className="font-semibold">
                                    {academicYear.zsaf} ({pct}%)
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-gold-700 dark:text-gold-300">
                                  <span>{t("zmf")}</span>
                                  <span className="font-semibold">{academicYear.zmf}</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">{t("noBioData")}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </PageSection>
            );
          })()}
        </FadeIn>
      ) : null}

      {summary.variant === "staff" ? (
        <FadeIn delay={0.3}>
          <PageSection
            eyebrow={t("quickActions")}
            title={t("quickActions")}
            description={t("platformOverview")}
            tone="utility"
            layout="list"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  href: "/biometria",
                  label: t("registerBiometric"),
                  icon: Ruler,
                  classes: "from-navy-600 to-navy-800 text-white shadow-[0_4px_14px_rgba(20,48,76,0.39)]",
                },
                {
                  href: "/testes",
                  label: t("registerTests"),
                  icon: ClipboardList,
                  classes: "from-gold-400 to-gold-600 text-navy-950 shadow-[0_0_15px_rgba(194,151,13,0.5)]",
                },
                {
                  href: "/turma",
                  label: t("viewClass"),
                  icon: School,
                  classes: "from-muted to-muted-foreground/10 text-foreground shadow-sm",
                },
                {
                  href: "/analise",
                  label: t("analyzeZaf"),
                  icon: BarChart3,
                  classes: "from-muted to-muted-foreground/10 text-foreground shadow-sm",
                },
              ].map(({ href, label, icon: Icon, classes }) => (
                <Link
                  key={href}
                  href={href}
                  className={`group relative flex flex-col items-start gap-4 rounded-[20px] border border-border/50 bg-gradient-to-b p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float ${classes}`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110">
                      <Icon className="size-5" />
                    </span>
                    <ArrowRight className="size-4 opacity-50 transition-transform duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-wide">{label}</p>
                    <p className="mt-1 text-xs opacity-80">{t("quickActions")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </PageSection>
        </FadeIn>
      ) : null}
    </PageScaffold>
  );
}
