"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  ClipboardList,
  FileText,
  Heart,
  Link2,
  Ruler,
  School,
  Sparkles,
  Users,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, StaggerItem, StaggerList } from "@/components/ui/motion";
import type { DashboardCardData, DashboardSummary } from "@/lib/dashboard";
import { getQuestionnaireTypeLabelKey } from "@/lib/questionnaires";
import { cn } from "@/lib/utils";

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

const ACCENT_STYLES = {
  blue: {
    icon: "bg-white/14 text-white dark:bg-gold-300/15 dark:text-gold-200",
  },
  gold: {
    icon: "bg-gold-300 text-navy-950",
  },
  green: {
    icon: "bg-success-600 text-white",
  },
  danger: {
    icon: "bg-danger-600 text-white",
  },
} as const;

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

function formatCompactDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
  });
}

export function DashboardClient({ username, summary }: Props) {
  const t = useTranslations("dashboard");
  const nav = useTranslations("nav");
  const questionnaires = useTranslations("questionarios");
  const locale = useLocale();
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setChartsReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

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
  const staffActions = [
    {
      href: "/biometria",
      label: t("registerBiometric"),
      description: t("quickBiometricHint"),
      icon: Ruler,
      accent: "blue" as const,
    },
    {
      href: "/testes",
      label: t("registerTests"),
      description: t("quickTestsHint"),
      icon: ClipboardList,
      accent: "gold" as const,
    },
    {
      href: "/turma",
      label: t("viewClass"),
      description: t("quickClassHint"),
      icon: School,
      accent: "green" as const,
    },
    {
      href: "/analise",
      label: t("analyzeZaf"),
      description: t("quickAnalysisHint"),
      icon: BarChart3,
      accent: "blue" as const,
    },
  ];

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
            <EmptyState
              icon={Link2}
              title={t("unlinkedTitle")}
              description={t("unlinkedDescription")}
              action={
                <Link href="/perfil" className={buttonVariants({ size: "sm", variant: "ghost" })}>
                  {nav("perfil")}
                </Link>
              }
            />
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

        <PageSection title={t("quickActions")} description={t("quickActionsSummary")} tone="secondary" layout="list">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { href: "/questionarios", label: nav("questionarios"), icon: BookOpen },
              { href: "/sos", label: nav("sos"), icon: AlertTriangle },
              { href: "/relatorio", label: t("reportsAvailable"), icon: FileText },
              { href: "/protocolos", label: nav("protocolos"), icon: Heart },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center justify-between rounded-[22px] border border-white/30 bg-white/72 px-4 py-4 shadow-card backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:border-white/10 dark:bg-navy-950/62"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-800 via-navy-700 to-navy-600 text-white shadow-card dark:bg-gold-300 dark:text-navy-950">
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

  if (summary.variant === "psychologist") {
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
        <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_340px]">
          <PageSection
            tone="secondary"
            layout="list"
            title={t("psychologistQueueTitle")}
            description={t("psychologistQueueDescription")}
          >
            {summary.openAlerts.length > 0 ? (
              <div className="grid gap-3">
                {summary.openAlerts.map((alert) => (
                  <Link
                    key={alert.id}
                    href={`/acompanhamento/${alert.studentId}`}
                    className="group rounded-[20px] border border-border/60 bg-background/35 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-danger-300/40 hover:shadow-card-hover"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{alert.studentName}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {alert.className ?? t("classPending")}
                        </p>
                      </div>
                      <span className="rounded-full bg-danger-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-danger-700 dark:bg-danger-950/30 dark:text-danger-300">
                        {t("pendingSos")}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">
                        {t("alertOpenedOn", { date: formatDisplayDate(alert.createdAt, locale) })}
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                        {t("openStudentFollowUp")}
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={AlertTriangle}
                title={t("noPendingCasesTitle")}
                description={t("noPendingCasesDescription")}
              />
            )}
          </PageSection>

          <div className="grid gap-5">
            <PageSection
              tone="utility"
              layout="list"
              title={t("psychologistRecentTitle")}
              description={t("psychologistRecentDescription")}
            >
              {summary.recentQuestionnaires.length > 0 ? (
                <div className="grid gap-3">
                  {summary.recentQuestionnaires.map((questionnaire) => (
                    <div
                      key={questionnaire.id}
                      className="rounded-[18px] border border-border/60 bg-background/45 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {questionnaire.studentName}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {questionnaires(
                              getQuestionnaireTypeLabelKey(
                                questionnaire.type as "AUTOCONCEITO" | "AUTOESTIMA" | "KIDMED",
                              ),
                            )}
                          </p>
                        </div>
                        <span className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {formatCompactDate(questionnaire.submittedAt, locale)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={BookOpen}
                  title={t("noRecentQuestionnairesTitle")}
                  description={t("noRecentQuestionnairesDescription")}
                />
              )}
            </PageSection>

            <PageSection
              tone="utility"
              layout="list"
              title={t("quickActions")}
              description={t("quickActionsSummary")}
            >
              <DashboardQuickLink
                href="/sos"
                icon={AlertTriangle}
                title={t("reviewSosInbox")}
                description={t("reviewSosInboxHint")}
                accent="danger"
              />
              <DashboardQuickLink
                href="/perfil"
                icon={FileText}
                title={nav("perfil")}
                description={t("updateProfileHint")}
                accent="blue"
              />
            </PageSection>
          </div>
        </div>
      </PageScaffold>
    );
  }

  if (summary.variant === "parent") {
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
        <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_340px]">
          <PageSection
            tone="secondary"
            layout="list"
            title={t("parentStudentsTitle")}
            description={t("parentStudentsDescription")}
          >
            {summary.linkedStudents.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {summary.linkedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="rounded-[20px] border border-border/60 bg-background/35 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{student.name}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {[student.className, student.schoolYear].filter(Boolean).join(" - ") || t("studentRecord")}
                        </p>
                      </div>
                      <span className="rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-700 dark:bg-navy-950/30 dark:text-navy-200">
                        {t("linkedStudents")}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <DashboardMetaPill
                        label={t("lastReport")}
                        value={formatDisplayDate(student.lastReportAt, locale)}
                      />
                      <DashboardMetaPill
                        label={t("lastQuestionnaire")}
                        value={formatDisplayDate(student.lastQuestionnaireAt, locale)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title={t("noLinkedStudentsDashboardTitle")}
                description={t("noLinkedStudentsDashboardDescription")}
              />
            )}
          </PageSection>

          <div className="grid gap-5">
            <PageSection
              tone="utility"
              layout="list"
              title={t("parentReportsTitle")}
              description={t("parentReportsDescription")}
            >
              {summary.recentReports.length > 0 ? (
                <div className="grid gap-3">
                  {summary.recentReports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-[18px] border border-border/60 bg-background/45 p-4"
                    >
                      <p className="text-sm font-semibold text-foreground">{report.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{report.studentName}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {t("historyGeneratedOn", { date: formatDisplayDate(report.createdAt, locale) })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title={t("noReportsDashboardTitle")}
                  description={t("noReportsDashboardDescription")}
                />
              )}
            </PageSection>

            <PageSection
              tone="utility"
              layout="list"
              title={t("quickActions")}
              description={t("quickActionsSummary")}
            >
              <DashboardQuickLink
                href="/relatorio"
                icon={FileText}
                title={nav("relatorio")}
                description={t("openReportsHint")}
                accent="green"
              />
              <DashboardQuickLink
                href="/protocolos"
                icon={Heart}
                title={nav("protocolos")}
                description={t("viewProtocolsHint")}
                accent="gold"
              />
              <DashboardQuickLink
                href="/perfil"
                icon={Users}
                title={nav("perfil")}
                description={t("updateProfileHint")}
                accent="blue"
              />
            </PageSection>
          </div>
        </div>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      className="gap-6"
      header={
        summary.variant === "staff" ? (
          <DashboardHero
            eyebrow={t("title")}
            meta={todayLabel}
            title={`${greeting}, ${username}!`}
            description={description}
            actions={staffActions.slice(0, 2)}
          />
        ) : undefined
      }
      headerProps={
        summary.variant === "staff"
          ? undefined
          : {
              title: `${greeting}, ${username}!`,
              description,
              eyebrow: t("title"),
              meta: todayLabel,
            }
      }
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
                title={t("zafDistribution")}
                description={t("zafDistributionSummary")}
                tone="secondary"
                layout="analytics"
              >
                <div className="mb-12 grid gap-8 lg:grid-cols-12">
                  <div className="col-span-12 flex flex-col items-center gap-12 rounded-xl border border-white/30 bg-white/80 p-8 shadow-float backdrop-blur-xl dark:border-white/10 dark:bg-navy-950/72 md:flex-row lg:col-span-7">
                    <div className="relative w-48 h-48 flex-shrink-0">
                      {chartsReady ? (
                        <PieChart width={192} height={192}>
                          <defs>
                            <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.15" />
                            </filter>
                          </defs>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={0}
                            cornerRadius={8}
                          >
                            <Cell key="zsaf" fill="var(--color-navy-900)" className="dark:fill-gold-400" filter="url(#dropShadow)" />
                            <Cell key="zmf" fill="var(--color-gold-400)" className="dark:fill-danger-500" filter="url(#dropShadow)" />
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
                      ) : (
                        <div className="w-full h-full rounded-full border-[16px] border-muted animate-pulse" />
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-foreground leading-none">{chartsReady ? `${overallPct}%` : "-"}</span>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground mt-1">Ótimo ZAF</span>
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="mb-6">
                        <h4 className="text-xl font-bold text-foreground mb-1">Distribuição ZAF</h4>
                        <p className="text-sm text-muted-foreground">Comportamento de saúde acumulado no mês.</p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <span className="w-3 h-3 rounded-full bg-navy-900 dark:bg-gold-400"></span>
                          <span className="text-xs font-semibold text-muted-foreground flex-1">{t("zsaf")}</span>
                          <span className="text-xs font-bold text-foreground">{totalZsaf}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="w-3 h-3 rounded-full bg-gold-400 dark:bg-danger-500"></span>
                          <span className="text-xs font-semibold text-muted-foreground flex-1">{t("zmf")}</span>
                          <span className="text-xs font-bold text-foreground">{totalZmf}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="group relative col-span-12 overflow-hidden rounded-xl bg-gradient-to-br from-navy-800 via-navy-700 to-navy-600 p-8 shadow-float lg:col-span-5">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-20 -mt-20 blur-3xl"></div>
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold-400 rounded-full -ml-20 -mb-20 blur-3xl"></div>
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex justify-between items-center mb-8">
                        <h4 className="text-xl font-bold text-white">Progresso Acadêmico</h4>
                        <span className="text-[10px] font-bold px-2 py-1 bg-white/10 text-white rounded-lg">Total</span>
                      </div>
                      <div className="space-y-6 flex-1">
                        {summary.zafByYear.map((academicYear) => {
                          const pct = academicYear.withBio > 0 ? Math.round((academicYear.zsaf / academicYear.withBio) * 100) : 0;
                          return (
                            <div key={academicYear.year}>
                              <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-medium text-navy-200">{academicYear.year}</span>
                                <span className="text-sm font-bold text-white">{pct}% ZSAF</span>
                              </div>
                              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gold-400 rounded-full shadow-[0_0_10px_rgba(254,166,25,0.4)]" style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </PageSection>
            );
          })()}
        </FadeIn>
      ) : null}

      {summary.variant === "staff" ? (
        <FadeIn delay={0.3}>
          <PageSection title={t("quickActions")} description={t("quickActionsSummary")} tone="secondary" layout="list">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
              {staffActions.slice(2).map((action) => {
                const Icon = action.icon;

                return (
                  <Link key={action.href} href={action.href} className="block h-full">
                    <Card className="group h-full rounded-lg border border-white/30 bg-white/78 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:border-white/10 dark:bg-navy-950/66">
                      <CardContent className="flex h-full flex-col gap-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={cn(
                              "flex size-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105",
                              ACCENT_STYLES[action.accent].icon,
                            )}
                          >
                            <Icon className="size-5" />
                          </span>
                          <ArrowRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-base font-semibold tracking-[-0.03em] text-foreground">
                            {action.label}
                          </p>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </PageSection>
        </FadeIn>
      ) : null}
    </PageScaffold>
  );
}

function DashboardHero({
  eyebrow,
  meta,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  meta: string;
  title: string;
  description: string;
  actions: Array<{
    href: string;
    label: string;
    icon: typeof Users;
    accent: keyof typeof ACCENT_STYLES;
  }>;
}) {
  return (
    <Card className="relative overflow-hidden rounded-xl border border-navy-700/20 bg-gradient-to-br from-navy-800 via-navy-700 to-navy-600 text-white shadow-[0_28px_80px_-36px_rgba(9,21,35,0.82)] dark:border-navy-800">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(216,173,52,0.18),transparent_22%)]" />
      <CardContent className="relative p-6 lg:p-8">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold" size="sm" className="border-white/10 bg-white/10 text-gold-200">
              <Sparkles className="size-3" />
              {eyebrow}
            </Badge>
            <Badge variant="info" size="sm" className="border-white/10 bg-white/10 text-white/82">
              {meta}
            </Badge>
          </div>

          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-black tracking-[-0.05em] text-white sm:text-[3.25rem]">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-white/78 sm:text-base">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {actions.map((action, index) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={buttonVariants({
                    variant: index === 0 ? "gold" : "secondary",
                    size: "lg",
                  })}
                >
                  <Icon className="size-4" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardQuickLink({
  href,
  icon: Icon,
  title,
  description,
  accent,
}: {
  href: string;
  icon: typeof Users;
  title: string;
  description: string;
  accent: "blue" | "gold" | "green" | "danger";
}) {
  const accents = {
    blue: "bg-navy-900 text-white dark:bg-gold-300 dark:text-navy-950",
    gold: "bg-gold-300 text-navy-950",
    green: "bg-success-600 text-white",
    danger: "bg-danger-600 text-white",
  } as const;

  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-[22px] border border-white/30 bg-white/72 px-4 py-4 shadow-card backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover dark:border-white/10 dark:bg-navy-950/62"
    >
      <div className="flex items-center gap-3">
        <span className={`flex size-10 items-center justify-center rounded-2xl ${accents[accent]}`}>
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <ArrowRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

function DashboardMetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-border/60 bg-background/55 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
