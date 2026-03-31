"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ClipboardList,
  FileText,
  Link2,
  School,
  Users,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
  const todayLabel = new Intl.DateTimeFormat(
    locale === "en" ? "en-GB" : "pt-PT",
    {
      dateStyle: "full",
    },
  ).format(new Date());

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
      headerProps={buildHeaderProps(`${greeting}, ${username}!`, description)}
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

  return (
    <PageSection
      title={t("zafDistribution")}
      description={t("zafDistributionSummary")}
      tone="secondary"
      layout="analytics"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <div className="surface-secondary rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
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
                      fill="var(--color-navy-900)"
                      className="dark:fill-gold-400"
                    />
                    <Cell
                      key="zmf"
                      fill="var(--color-gold-400)"
                      className="dark:fill-warning-500"
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
              <div className="mb-5 space-y-1">
                <h4 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {t("zafDistribution")}
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("zafDistributionSummary")}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DashboardMetaPill label={t("zsaf")} value={totalZsaf.toString()} />
                <DashboardMetaPill label={t("zmf")} value={totalZmf.toString()} />
              </div>

              <div className="mt-4 space-y-3">
                <DashboardLegendItem
                  colorClassName="bg-navy-900 dark:bg-gold-400"
                  label={t("zsaf")}
                  value={totalZsaf}
                />
                <DashboardLegendItem
                  colorClassName="bg-gold-400 dark:bg-warning-500"
                  label={t("zmf")}
                  value={totalZmf}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.5rem] border border-navy-900/10 bg-[linear-gradient(160deg,rgba(16,36,58,0.97),rgba(20,48,76,0.92))] p-5 text-white shadow-float dark:border-white/10 sm:p-6">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold-300/55 to-transparent" />
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-gold-400/16 blur-3xl" />

          <div className="relative">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-micro font-semibold uppercase tracking-[0.22em] text-gold-200">
                  {t("title")}
                </p>
                <h4 className="mt-1 font-display text-lg font-semibold tracking-tight text-white">
                  {t("zafDistributionSummary")}
                </h4>
              </div>
              <Badge
                variant="gold"
                size="sm"
                className="border-white/10 bg-white/10 text-gold-200"
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
                    className="rounded-[1.15rem] border border-white/10 bg-white/6 p-3.5 backdrop-blur-sm"
                  >
                    <div className="mb-2 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
                          {academicYear.year}
                        </p>
                        <p className="mt-1 text-sm text-white/82">
                          {academicYear.withBio.toLocaleString(
                            locale === "en" ? "en-GB" : "pt-PT",
                          )}{" "}
                          {t("studentsUnit")}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-gold-200">
                        {pct}%
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gold-400 shadow-[0_0_18px_rgba(216,173,52,0.45)] transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
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
  value,
}: {
  colorClassName: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[1.1rem] border border-white/22 bg-white/52 px-3 py-2.5 dark:border-white/8 dark:bg-white/5">
      <span className={cn("h-3 w-3 rounded-full", colorClassName)} />
      <span className="flex-1 text-sm font-semibold text-foreground">
        {label}
      </span>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}
