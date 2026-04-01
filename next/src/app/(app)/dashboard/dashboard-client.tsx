"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  Link2,
  School,
  Users,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FadeIn, StaggerItem, StaggerList } from "@/components/ui/motion";
import type { DashboardCardData, DashboardSummary } from "@/lib/dashboard";
import { getQuestionnaireTypeLabelKey } from "@/lib/questionnaires";
import { cn } from "@/lib/utils";

interface Props {
  greeting: string;
  username: string;
  summary: DashboardSummary;
  todayLabel: string;
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

function formatCompactDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
  });
}

function formatNumberValue(value: string | number, locale: string) {
  if (typeof value === "number") {
    return value.toLocaleString(locale === "en" ? "en-GB" : "pt-PT");
  }

  return value;
}

export function DashboardClient({
  greeting,
  summary,
  todayLabel,
  username,
}: Props) {
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

  const scaffoldClassName = "gap-5 sm:gap-6";
  const buildHeaderProps = (title: string, description: string) => ({
    title,
    description,
    eyebrow: t("title"),
    meta: todayLabel,
  });

  if (summary.variant === "student") {
    if (!summary.studentSummary) {
      return (
        <PageScaffold
          className={scaffoldClassName}
          headerProps={buildHeaderProps(
            `${greeting}, ${username}!`,
            t("unlinkedDescription"),
          )}
        >
          <EmptyState
            icon={Link2}
            title={t("unlinkedTitle")}
            description={t("unlinkedDescription")}
            action={
              <Link
                href="/perfil"
                className={buttonVariants({ size: "sm", variant: "ghost" })}
              >
                {nav("perfil")}
              </Link>
            }
          />
        </PageScaffold>
      );
    }

    const firstName =
      summary.studentSummary.name.split(" ")[0] ?? summary.studentSummary.name;

    return (
      <PageScaffold
        className={scaffoldClassName}
        headerProps={buildHeaderProps(
          `${greeting}, ${firstName}!`,
          t("activitySummary"),
        )}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <KpiCard
            icon={Activity}
            title={t("lastBiometric")}
            value={formatDisplayDate(
              summary.studentSummary.lastBiometric,
              locale,
            )}
            description={t("lastMeasurement")}
            accent="blue"
            emphasis="hero"
            footer={
              <p className="text-sm text-white/74">
                {summary.studentSummary.lastBiometric
                  ? t("activitySummary")
                  : t("unlinkedDescription")}
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
        className={scaffoldClassName}
        headerProps={buildHeaderProps(`${greeting}, ${username}!`, description)}
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
                  <DashboardPanel
                    key={alert.id}
                    href={`/acompanhamento/${alert.studentId}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {alert.studentName}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {alert.className ?? t("classPending")}
                        </p>
                      </div>
                      <Badge variant="danger" size="sm">
                        {t("pendingSos")}
                      </Badge>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">
                        {t("alertOpenedOn", {
                          date: formatDisplayDate(alert.createdAt, locale),
                        })}
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                        {t("openStudentFollowUp")}
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </DashboardPanel>
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
                    <DashboardPanel key={questionnaire.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {questionnaire.studentName}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {questionnaires(
                              getQuestionnaireTypeLabelKey(
                                questionnaire.type as
                                  | "AUTOCONCEITO"
                                  | "AUTOESTIMA"
                                  | "KIDMED",
                              ),
                            )}
                          </p>
                        </div>
                        <Badge
                          variant="default"
                          size="sm"
                          className="bg-white/70 dark:bg-white/6"
                        >
                          {formatCompactDate(questionnaire.submittedAt, locale)}
                        </Badge>
                      </div>
                    </DashboardPanel>
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
          </div>
        </div>
      </PageScaffold>
    );
  }

  if (summary.variant === "parent") {
    return (
      <PageScaffold
        className={scaffoldClassName}
        headerProps={buildHeaderProps(`${greeting}, ${username}!`, description)}
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
                  <DashboardPanel key={student.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {student.name}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {[student.className, student.schoolYear]
                            .filter(Boolean)
                            .join(" - ") || t("studentRecord")}
                        </p>
                      </div>
                      <Badge variant="info" size="sm">
                        {t("linkedStudents")}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <DashboardMetaPill
                        label={t("lastReport")}
                        value={formatDisplayDate(student.lastReportAt, locale)}
                      />
                      <DashboardMetaPill
                        label={t("lastQuestionnaire")}
                        value={formatDisplayDate(
                          student.lastQuestionnaireAt,
                          locale,
                        )}
                      />
                    </div>
                  </DashboardPanel>
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
                    <DashboardPanel key={report.id}>
                      <p className="text-sm font-semibold text-foreground">
                        {report.title}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {report.studentName}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {t("historyGeneratedOn", {
                          date: formatDisplayDate(report.createdAt, locale),
                        })}
                      </p>
                    </DashboardPanel>
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
          </div>
        </div>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      className={scaffoldClassName}
      header={
        <StaffDashboardHeader
          description={description}
          greeting={greeting}
          t={t}
          todayLabel={todayLabel}
          username={username}
        />
      }
    >
      {summary.cards.length > 0 ? (
        <FadeIn delay={0.05}>
          <StaffOverview locale={locale} summary={summary} t={t} />
        </FadeIn>
      ) : null}

      {summary.zafByYear.length > 0 ? (
        <FadeIn delay={0.2}>
          <DashboardAnalytics
            chartsReady={chartsReady}
            locale={locale}
            summary={summary}
            t={t}
          />
        </FadeIn>
      ) : null}
    </PageScaffold>
  );
}

function StaffDashboardHeader({
  description,
  greeting,
  t,
  todayLabel,
  username,
}: {
  description: string;
  greeting: string;
  t: (key: string) => string;
  todayLabel: string;
  username: string;
}) {
  return (
    <PageHeader
      title={`${greeting}, ${username}`}
      description={description}
      eyebrow={t("title")}
      actionsClassName="items-start lg:items-center"
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-sm text-white/82 backdrop-blur-md">
        <CalendarDays className="size-4 text-gold-300" />
        {todayLabel}
      </span>
      <span className="inline-flex items-center rounded-full border border-gold-300/30 bg-gold-300/16 px-3 py-1.5 text-sm font-medium text-gold-100 backdrop-blur-md">
        {t("dashboardStatus")}
      </span>
    </PageHeader>
  );
}

function StaffOverview({
  locale,
  summary,
  t,
}: {
  locale: string;
  summary: Extract<DashboardSummary, { variant: "staff" }>;
  t: (key: string) => string;
}) {
  const cardMap = Object.fromEntries(
    summary.cards.map((card) => [card.id, card]),
  ) as Record<string, DashboardCardData | undefined>;
  const studentsCard = cardMap["students"];
  const sessionsCard = cardMap["sessions"];
  const classesCard = cardMap["classes"];
  const pendingSosCard = cardMap["pending-sos"];
  const latestYear = summary.zafByYear[0] ?? null;
  const coveragePct =
    latestYear && latestYear.total > 0
      ? Math.round((latestYear.withBio / latestYear.total) * 100)
      : 0;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.72fr)]">
      <section className="surface-secondary rounded-2xl p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("overviewEyebrow")}
              </p>
              <h2 className="mt-1 font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-foreground sm:text-[1.9rem]">
                {t("overviewTitle")}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t("overviewDescription")}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.72fr)]">
            <div className="grid gap-4 sm:grid-cols-2">
              {studentsCard ? (
                <StaffFeatureStat
                  icon={Users}
                  title={t(studentsCard.titleKey)}
                  value={formatNumberValue(studentsCard.value, locale)}
                  description={t(studentsCard.descriptionKey)}
                  accent={studentsCard.accent}
                />
              ) : null}
              {sessionsCard ? (
                <StaffFeatureStat
                  icon={Activity}
                  title={t(sessionsCard.titleKey)}
                  value={formatNumberValue(sessionsCard.value, locale)}
                  description={t(sessionsCard.descriptionKey)}
                  accent={sessionsCard.accent}
                />
              ) : null}
            </div>

            <div className="grid gap-3">
              {classesCard ? (
                <StaffCompactStat
                  icon={School}
                  title={t(classesCard.titleKey)}
                  value={formatNumberValue(classesCard.value, locale)}
                  description={t(classesCard.descriptionKey)}
                  accent={classesCard.accent}
                />
              ) : null}
              {pendingSosCard ? (
                <StaffCompactStat
                  icon={AlertTriangle}
                  title={t(pendingSosCard.titleKey)}
                  value={formatNumberValue(pendingSosCard.value, locale)}
                  description={t(pendingSosCard.descriptionKey)}
                  accent={pendingSosCard.accent}
                  emphasis="danger"
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.96))] p-6 shadow-[0_18px_38px_-32px_rgba(9,21,35,0.35)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(19,31,49,0.96),rgba(16,27,43,0.98))]">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground dark:text-white/62">
                {t("latestAcademicYear")}
              </p>
              <h3 className="mt-1 font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-foreground dark:text-white">
                {latestYear?.year ?? "-"}
              </h3>
            </div>

            <div className="rounded-full border border-success-500/18 bg-success-500/10 px-3 py-1.5 text-sm font-semibold text-success-700 dark:text-success-200">
              {coveragePct}%
            </div>
          </div>

          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground dark:text-white/70">
            {t("latestAcademicYearDescription")}
          </p>

          <div className="mt-8">
            <p className="text-[3.25rem] font-black leading-none tracking-tight text-foreground dark:text-white sm:text-[3.5rem]">
              {coveragePct}%
            </p>
            <p className="mt-2 text-sm font-medium text-muted-foreground dark:text-white/76">
              {t("coverageLabel")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground dark:text-white/58">
              {formatNumberValue(latestYear?.withBio ?? 0, locale)} /{" "}
              {formatNumberValue(latestYear?.total ?? 0, locale)} {t("studentsUnit")}
            </p>
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-navy-100 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-success-500 transition-all duration-700"
              style={{ width: `${coveragePct}%` }}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <StaffSpotlightMetric
              label={t("healthyStudentsLabel")}
              value={formatNumberValue(latestYear?.zsaf ?? 0, locale)}
              tone="success"
            />
            <StaffSpotlightMetric
              label={t("improvementStudentsLabel")}
              value={formatNumberValue(latestYear?.zmf ?? 0, locale)}
              tone="danger"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardAnalytics({
  chartsReady,
  locale,
  summary,
  t,
}: {
  chartsReady: boolean;
  locale: string;
  summary: Extract<DashboardSummary, { variant: "staff" }>;
  t: (key: string) => string;
}) {
  const totalZsaf = summary.zafByYear.reduce((sum, year) => sum + year.zsaf, 0);
  const totalZmf = summary.zafByYear.reduce((sum, year) => sum + year.zmf, 0);
  const totalWithBio = totalZsaf + totalZmf;
  const overallPct =
    totalWithBio > 0 ? Math.round((totalZsaf / totalWithBio) * 100) : 0;
  const donutData = [
    { name: t("zsaf"), value: totalZsaf },
    { name: t("zmf"), value: totalZmf },
  ];
  const latestYear = summary.zafByYear[0] ?? null;

  return (
    <PageSection
      title={t("zafDistribution")}
      description={t("zafDistributionSummary")}
      tone="secondary"
      layout="analytics"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <div className="surface-secondary rounded-2xl p-5 sm:p-6">
          <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border/70 pb-5">
            <div className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-sm font-semibold text-foreground">
              {formatNumberValue(totalWithBio, locale)} {t("studentsUnit")}
            </div>
            <div className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-sm text-muted-foreground">
              {t("analysisAllYears")}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
            <div className="relative h-48 w-48 flex-shrink-0 self-center">
              {chartsReady ? (
                <PieChart width={192} height={192}>
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
                    <Cell
                      key="zsaf"
                      fill="var(--color-success-500)"
                      className="dark:fill-success-400"
                    />
                    <Cell
                      key="zmf"
                      fill="var(--color-danger-500)"
                      className="dark:fill-danger-400"
                    />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: "13px",
                    }}
                  />
                </PieChart>
              ) : (
                <div className="h-full w-full rounded-full border-[16px] border-muted animate-pulse" />
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black leading-none text-foreground">
                  {chartsReady ? `${overallPct}%` : "-"}
                </span>
                <span className="mt-1 text-micro font-bold uppercase text-muted-foreground">
                  {t("zsaf")}
                </span>
              </div>
            </div>

            <div className="flex-1">
              <div className="grid gap-3 sm:grid-cols-2">
                <DashboardMetaPill
                  label={t("studentsWithBiometrics")}
                  value={`${formatNumberValue(totalWithBio, locale)} ${t("studentsUnit")}`}
                />
                <DashboardMetaPill
                  label={t("healthyZoneRate")}
                  value={`${overallPct}%`}
                />
              </div>

              <div className="mt-4 space-y-3">
                <DashboardLegendItem
                  colorClassName="bg-success-500 dark:bg-success-400"
                  label={t("zsaf")}
                  value={totalZsaf}
                  meta={totalWithBio > 0 ? `${overallPct}%` : "0%"}
                />
                <DashboardLegendItem
                  colorClassName="bg-danger-500 dark:bg-danger-400"
                  label={t("zmf")}
                  value={totalZmf}
                  meta={
                    totalWithBio > 0 ? `${Math.max(0, 100 - overallPct)}%` : "0%"
                  }
                />
              </div>

              {latestYear ? (
                <div className="mt-5 rounded-[1.15rem] border border-border/70 bg-background/72 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {t("referenceYear")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {latestYear.year}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {latestYear.withBio > 0
                        ? `${Math.round(
                            (latestYear.zsaf / latestYear.withBio) * 100,
                          )}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="surface-primary rounded-2xl p-5 sm:p-6">
          <div>
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("annualSeries")}
                </p>
                <h4 className="mt-1 font-display text-[1.35rem] font-semibold tracking-[-0.035em] text-foreground">
                  {t("comparisonPanelTitle")}
                </h4>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {t("annualSeriesDescription")}
                </p>
              </div>
              <Badge
                variant="default"
                size="sm"
                className="bg-background/90"
              >
                {summary.zafByYear.length}
              </Badge>
            </div>

            <div className="space-y-4">
              {summary.zafByYear.map((academicYear) => {
                const pct =
                  academicYear.withBio > 0
                    ? Math.round((academicYear.zsaf / academicYear.withBio) * 100)
                    : 0;

                return (
                  <div
                    key={academicYear.year}
                    className="rounded-[1.2rem] border border-border/70 bg-background/80 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {academicYear.year}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {formatNumberValue(academicYear.withBio, locale)} /{" "}
                          {formatNumberValue(academicYear.total, locale)}{" "}
                          {t("studentsUnit")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-success-700 dark:text-success-300">{pct}%</p>
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          {t("zsaf")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-navy-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-success-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>
                        {t("zsaf")} {formatNumberValue(academicYear.zsaf, locale)}
                      </span>
                      <span>
                        {t("zmf")} {formatNumberValue(academicYear.zmf, locale)}
                      </span>
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
}

function StaffFeatureStat({
  accent,
  description,
  icon: Icon,
  title,
  value,
}: {
  accent: NonNullable<DashboardCardData["accent"]>;
  description: string;
  icon: typeof Users;
  title: string;
  value: string | number;
}) {
  const accentClassName = {
    blue: {
      icon: "border-navy-200 bg-navy-100 text-navy-900 dark:border-navy-700 dark:bg-navy-900 dark:text-white",
      line: "from-navy-500/65 to-navy-300/15",
    },
    green: {
      icon: "border-success-200 bg-success-50 text-success-700 dark:border-success-700/60 dark:bg-success-950/50 dark:text-success-200",
      line: "from-success-500/65 to-success-300/15",
    },
    gold: {
      icon: "border-gold-200 bg-gold-50 text-gold-800 dark:border-gold-500/40 dark:bg-gold-950/40 dark:text-gold-200",
      line: "from-gold-500/75 to-gold-300/15",
    },
    red: {
      icon: "border-danger-200 bg-danger-50 text-danger-700 dark:border-danger-700/50 dark:bg-danger-950/40 dark:text-danger-200",
      line: "from-danger-500/65 to-danger-300/15",
    },
  }[accent];

  return (
    <div className="rounded-[1.35rem] border border-border/70 bg-background/88 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className="mt-3 text-3xl font-black leading-none tracking-tight text-foreground sm:text-[2.5rem]">
            {value}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <span
          className={cn(
            "flex size-11 flex-shrink-0 items-center justify-center rounded-2xl border",
            accentClassName.icon,
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

function StaffCompactStat({
  accent,
  description,
  emphasis,
  icon: Icon,
  title,
  value,
}: {
  accent: NonNullable<DashboardCardData["accent"]>;
  description: string;
  emphasis?: "default" | "danger";
  icon: typeof Users;
  title: string;
  value: string | number;
}) {
  const accentClassName = {
    blue: "border-navy-200 bg-navy-100 text-navy-900 dark:border-navy-700 dark:bg-navy-900 dark:text-white",
    green:
      "border-success-200 bg-success-50 text-success-700 dark:border-success-700/60 dark:bg-success-950/50 dark:text-success-200",
    gold: "border-gold-200 bg-gold-50 text-gold-800 dark:border-gold-500/40 dark:bg-gold-950/40 dark:text-gold-200",
    red: "border-danger-200 bg-danger-50 text-danger-700 dark:border-danger-700/50 dark:bg-danger-950/40 dark:text-danger-200",
  }[accent];

  return (
    <div
      className={cn(
        "rounded-[1.25rem] border border-border/70 bg-background/82 px-4 py-4",
        emphasis === "danger" && "border-danger-200/70 dark:border-danger-800/50",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-10 flex-shrink-0 items-center justify-center rounded-2xl border",
            accentClassName,
          )}
        >
          <Icon className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function StaffSpotlightMetric({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "success" | "danger";
  value: string | number;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.1rem] border px-3.5 py-3",
        tone === "success"
          ? "border-success-400/18 bg-success-500/10"
          : "border-danger-400/18 bg-danger-500/10",
      )}
      >
      <p className="text-xs font-medium text-muted-foreground dark:text-white/62">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-foreground dark:text-white">
        {value}
      </p>
    </div>
  );
}

function DashboardMetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-white/28 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/6">
      <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function DashboardPanel({
  children,
  className,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  const panelClassName = cn(
    "relative overflow-hidden rounded-[1.35rem] border border-white/22 bg-white/66 p-4 shadow-[0_18px_40px_-28px_rgba(9,21,35,0.4)] backdrop-blur-md transition-all duration-300 dark:border-white/10 dark:bg-navy-950/48",
    href &&
      "group hover:-translate-y-0.5 hover:border-gold-300/35 hover:shadow-card-hover",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={panelClassName}>
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
        {children}
      </Link>
    );
  }

  return (
    <div className={panelClassName}>
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
      {children}
    </div>
  );
}

function DashboardLegendItem({
  colorClassName,
  label,
  meta,
  value,
}: {
  colorClassName: string;
  label: string;
  meta?: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[1.1rem] border border-white/22 bg-white/52 px-3 py-2.5 dark:border-white/8 dark:bg-white/5">
      <span className={cn("h-3 w-3 rounded-full", colorClassName)} />
      <span className="flex-1 text-sm font-semibold text-foreground">
        {label}
      </span>
      {meta ? (
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {meta}
        </span>
      ) : null}
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}
