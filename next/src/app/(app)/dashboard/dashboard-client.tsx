"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import type {
  DashboardCardData,
  DashboardSummary,
  ZafYearStat,
} from "@/lib/dashboard";
import { getQuestionnaireTypeLabelKey } from "@/lib/questionnaires";
import { cn } from "@/lib/utils";

interface Props {
  greeting: string;
  locale?: string;
  messages?: {
    dashboard: Record<string, string>;
    nav: Record<string, string>;
    questionarios: Record<string, string>;
  };
  username: string;
  summary: DashboardSummary;
  todayLabel: string;
}

const FALLBACK_MESSAGES: {
  dashboard: Record<string, string>;
  nav: Record<string, string>;
  questionarios: Record<string, string>;
} = {
  dashboard: {
    title: "Painel",
    unlinkedTitle: "Perfil não associado",
    unlinkedDescription: "Conta ainda não associada a um perfil de aluno.",
    activitySummary: "Resumo da tua atividade",
    lastBiometric: "Última biometria",
    lastTests: "Últimos testes",
    lastMeasurement: "Data da última medição",
    lastTestDate: "Data do último teste físico",
    platformOverview: "Visão geral da plataforma HealthyTech Atlântico",
    psychologistOverview: "Visão geral da fila de acompanhamento dos alunos",
    parentOverview: "Visão geral dos alunos associados à tua conta",
    students: "Alunos",
    classes: "Turmas",
    sessions: "Sessões",
    pendingSos: "SOS Pendentes",
    totalRegistered: "Total registados",
    activeClasses: "Turmas ativas",
    evaluationsDone: "Avaliações realizadas",
    alertsPending: "Alertas por resolver",
    zafDistribution: "Distribuição ZAF por Ano Letivo",
    zsaf: "Z. Saudável",
    zmf: "Z. Melhoria",
    psychologistQueueTitle: "Fila prioritária de acompanhamento",
    psychologistQueueDescription:
      "Casos pendentes que devem ser revistos primeiro pelo psicólogo.",
    psychologistRecentTitle: "Questionários recentes",
    psychologistRecentDescription: "Últimos instrumentos submetidos.",
    classPending: "Turma por confirmar",
    alertOpenedOn: "Aberto em {date}",
    openStudentFollowUp: "Abrir acompanhamento",
    noPendingCasesTitle: "Sem casos pendentes",
    noPendingCasesDescription: "A fila SOS está limpa neste momento.",
    noRecentQuestionnairesTitle: "Sem questionários recentes",
    noRecentQuestionnairesDescription:
      "Quando houver novas submissões, aparecem aqui para leitura rápida.",
    parentStudentsTitle: "Acompanhamento dos alunos",
    parentStudentsDescription:
      "Visão rápida do estado recente dos alunos associados à tua conta.",
    parentReportsTitle: "Relatórios recentes",
    parentReportsDescription:
      "Últimos relatórios gerados para consulta familiar.",
    studentRecord: "Registo do aluno",
    lastReport: "Último relatório",
    lastQuestionnaire: "Último questionário",
    linkedStudents: "Alunos associados",
    historyGeneratedOn: "Gerado em {date}",
    noLinkedStudentsDashboardTitle: "Sem alunos associados",
    noLinkedStudentsDashboardDescription:
      "Quando a escola concluir a associação, os dados surgem aqui.",
    noReportsDashboardTitle: "Sem relatórios recentes",
    noReportsDashboardDescription:
      "Os relatórios disponibilizados pela escola aparecem nesta área.",
    studentsUnit: "alunos",
    overviewEyebrow: "Resumo operacional",
    overviewTitle: "Panorama da atividade",
    overviewDescription:
      "Leitura rápida dos números-chave da plataforma e dos sinais que pedem atenção no dia a dia.",
    dashboardStatus: "Visão institucional",
    yearInFocus: "Ano em foco",
    coverageRecent: "Cobertura biométrica do ano letivo mais recente.",
    studentsWithBiometrics: "Com biometria",
    coverageLabel: "Cobertura registada",
    healthyStudentsLabel: "Em Z. Saudável",
    improvementStudentsLabel: "Em Z. Melhoria",
    annualSeries: "Série anual",
    annualSeriesDescription:
      "Comparação do peso da Zona Saudável em cada ano letivo com registos.",
    comparisonPanelTitle: "Evolução por ano letivo",
    comparisonPanelDescription:
      "Percentagem de Zona Saudável entre os alunos com biometria registada.",
    annualSeriesPendingTitle: "Ainda não existe série histórica comparável.",
    annualSeriesPendingDescription:
      "A evolução anual aparece quando houver mais do que um ano letivo com biometria registada.",
    noBioData: "Sem dados biométricos",
    greetingMorning: "Bom dia",
    greetingAfternoon: "Boa tarde",
    greetingEvening: "Boa noite",
  },
  nav: {
    perfil: "Perfil",
  },
  questionarios: {
    autoconceito: "Autoconceito",
    autoestima: "Autoestima",
    kidmed: "KIDMED",
  },
};

function formatMessage(
  template: string,
  values?: Record<string, string | number>,
) {
  if (!values) {
    return template;
  }

  let result = template;
  for (const [token, replacement] of Object.entries(values)) {
    result = result.replaceAll(`{${token}}`, String(replacement));
  }

  return result;
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

function getCoveragePct(year: Pick<ZafYearStat, "total" | "withBio"> | null) {
  if (!year || year.total <= 0) {
    return 0;
  }

  return Math.round((year.withBio / year.total) * 100);
}

function getHealthyPct(year: Pick<ZafYearStat, "withBio" | "zsaf"> | null) {
  if (!year || year.withBio <= 0) {
    return 0;
  }

  return Math.round((year.zsaf / year.withBio) * 100);
}

export function DashboardClient({
  greeting,
  locale = "pt-PT",
  messages = FALLBACK_MESSAGES,
  summary,
  todayLabel,
  username,
}: Props) {
  const t = (key: string, values?: Record<string, string | number>) =>
    formatMessage(
      messages.dashboard[key] ?? FALLBACK_MESSAGES.dashboard[key] ?? key,
      values,
    );
  const nav = (key: string, values?: Record<string, string | number>) =>
    formatMessage(messages.nav[key] ?? FALLBACK_MESSAGES.nav[key] ?? key, values);
  const questionnaires = (
    key: string,
    values?: Record<string, string | number>,
  ) =>
    formatMessage(
      messages.questionarios[key] ??
        FALLBACK_MESSAGES.questionarios[key] ??
        key,
      values,
    );
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setChartsReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const scaffoldClassName = "gap-6";
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
        <div className="grid gap-4 sm:grid-cols-2">
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
                  ? t("lastMeasurement")
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
            eyebrow={t("psychologistOverview")}
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
              eyebrow={t("psychologistRecentTitle")}
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
                          className="bg-surface-utility"
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
            eyebrow={t("parentOverview")}
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
              eyebrow={t("parentReportsTitle")}
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
      title={`${greeting}, ${username}!`}
      description={description}
      eyebrow={t("title")}
      actionsClassName="items-start lg:items-center"
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/90 backdrop-blur-md">
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
  const metrics = [
    studentsCard
      ? {
          id: studentsCard.id,
          icon: Users,
          title: t(studentsCard.titleKey),
          value: formatNumberValue(studentsCard.value, locale),
          description: t(studentsCard.descriptionKey),
          accent: studentsCard.accent,
        }
      : null,
    sessionsCard
      ? {
          id: sessionsCard.id,
          icon: Activity,
          title: t(sessionsCard.titleKey),
          value: formatNumberValue(sessionsCard.value, locale),
          description: t(sessionsCard.descriptionKey),
          accent: sessionsCard.accent,
        }
      : null,
    classesCard
      ? {
          id: classesCard.id,
          icon: School,
          title: t(classesCard.titleKey),
          value: formatNumberValue(classesCard.value, locale),
          description: t(classesCard.descriptionKey),
          accent: classesCard.accent,
        }
      : null,
    pendingSosCard
      ? {
          id: pendingSosCard.id,
          icon: AlertTriangle,
          title: t(pendingSosCard.titleKey),
          value: formatNumberValue(pendingSosCard.value, locale),
          description: t(pendingSosCard.descriptionKey),
          accent: pendingSosCard.accent,
          emphasis: "danger" as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    id: string;
    icon: typeof Users;
    title: string;
    value: string | number;
    description: string;
    accent: NonNullable<DashboardCardData["accent"]>;
    emphasis?: "danger";
  }>;

  return (
    <section className="surface-secondary rounded-2xl p-6 sm:p-7">
      <div className="flex flex-col gap-6">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] xl:items-end">
          <div>
            <p className="section-kicker">
              {t("overviewEyebrow")}
            </p>
            <h2 className="section-title mt-1">
              {t("overviewTitle")}
            </h2>
          </div>
          <p className="section-copy max-w-2xl">
            {t("overviewDescription")}
          </p>
        </div>

        <div className="overflow-hidden rounded-[1.65rem] border border-border/70 shadow-[0_18px_38px_-30px_rgba(9,21,35,0.24)]">
          <div className="grid gap-px bg-border/60 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <StaffMetricRailCell
                key={metric.id}
                accent={metric.accent}
                description={metric.description}
                emphasis={metric.emphasis}
                icon={metric.icon}
                title={metric.title}
                value={metric.value}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
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
  const timelineYears = summary.zafByYear.filter(
    (academicYear) => academicYear.withBio > 0,
  );
  const latestYear = timelineYears[0] ?? summary.zafByYear[0] ?? null;
  const focusCoveragePct = getCoveragePct(latestYear);
  const focusHealthyPct = getHealthyPct(latestYear);
  const focusWithBio = latestYear?.withBio ?? 0;
  const donutData = latestYear
    ? [
        { name: t("zsaf"), value: latestYear.zsaf },
        { name: t("zmf"), value: latestYear.zmf },
      ]
    : [];

  return (
    <PageSection
      eyebrow={t("annualSeries")}
      title={t("zafDistribution")}
      description={t("comparisonPanelDescription")}
      tone="secondary"
      layout="analytics"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)]">
        <section className="rounded-[1.65rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] p-5 shadow-[0_18px_38px_-30px_rgba(9,21,35,0.22)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(19,31,49,0.96),rgba(14,24,38,0.98))] sm:p-6">
          <div className="flex items-start gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground dark:text-white/62">
                {t("yearInFocus")}
              </p>
              <h3 className="mt-1 font-display text-[1.55rem] font-semibold tracking-[-0.04em] text-foreground dark:text-white sm:text-[1.8rem]">
                {latestYear?.year ?? "-"}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground dark:text-white/68">
                {t("coverageRecent")}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
            <div className="relative mx-auto h-48 w-48 flex-shrink-0 lg:mx-0">
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
                <div className="h-full w-full animate-pulse rounded-full border-[16px] border-muted" />
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black leading-none text-foreground dark:text-white">
                  {chartsReady ? `${focusHealthyPct}%` : "-"}
                </span>
                <span className="mt-1 text-micro font-bold uppercase text-muted-foreground dark:text-white/58">
                  {t("zsaf")}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <DashboardMetaPill
                label={t("studentsWithBiometrics")}
                value={`${formatNumberValue(focusWithBio, locale)} / ${formatNumberValue(latestYear?.total ?? 0, locale)} ${t("studentsUnit")}`}
              />

              <DashboardCoverageBar
                label={t("coverageLabel")}
                value={focusCoveragePct}
              />

              <div className="grid gap-3 sm:grid-cols-2">
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
          </div>
        </section>

        <div className="surface-primary rounded-[1.65rem] p-5 sm:p-6">
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
            {timelineYears.length > 1 ? (
              <Badge variant="default" size="sm" className="bg-background/90">
                {timelineYears.length}
              </Badge>
            ) : null}
          </div>

          {timelineYears.length > 1 ? (
            <div className="space-y-4">
              {timelineYears.map((academicYear) => {
                const healthyPct = getHealthyPct(academicYear);

                return (
                  <div
                    key={academicYear.year}
                    className="rounded-[1.2rem] border border-border/70 bg-background/82 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {academicYear.year}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {formatNumberValue(academicYear.withBio, locale)}{" "}
                          {t("studentsUnit")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-success-700 dark:text-success-300">
                          {healthyPct}%
                        </p>
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          {t("zsaf")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-danger-100 dark:bg-danger-950/35">
                      <div
                        className="h-full rounded-full bg-success-500 transition-all duration-700 dark:bg-success-400"
                        style={{ width: `${healthyPct}%` }}
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
          ) : latestYear ? (
            <DashboardSeriesEmptyState year={latestYear.year} t={t} />
          ) : (
            <EmptyState
              icon={Activity}
              title={t("noBioData")}
              description={t("annualSeriesPendingDescription")}
            />
          )}
        </div>
      </div>
    </PageSection>
  );
}

function StaffMetricRailCell({
  accent,
  description,
  emphasis,
  icon: Icon,
  title,
  value,
}: {
  accent: NonNullable<DashboardCardData["accent"]>;
  description: string;
  emphasis?: "danger";
  icon: typeof Users;
  title: string;
  value: string | number;
}) {
  const accentClassName = {
    blue:
      "border-navy-200 bg-navy-100 text-navy-900 dark:border-navy-700 dark:bg-navy-900 dark:text-white",
    green:
      "border-success-200 bg-success-50 text-success-700 dark:border-success-700/60 dark:bg-success-950/50 dark:text-success-200",
    gold:
      "border-gold-200 bg-gold-50 text-gold-800 dark:border-gold-500/40 dark:bg-gold-950/40 dark:text-gold-200",
    red: "border-danger-200 bg-danger-50 text-danger-700 dark:border-danger-700/50 dark:bg-danger-950/40 dark:text-danger-200",
  }[accent];

  return (
    <div
      className={cn(
        "relative min-h-[144px] bg-background/92 px-5 py-5 dark:bg-navy-950/56",
        emphasis === "danger" &&
          "bg-danger-500/[0.035] dark:bg-danger-500/[0.08]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className="mt-4 text-[2.5rem] font-black leading-none tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-2 max-w-[18ch] text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <span
          className={cn(
            "flex size-11 flex-shrink-0 items-center justify-center rounded-2xl border",
            accentClassName,
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

function DashboardSeriesEmptyState({
  year,
  t,
}: {
  year: string;
  t: (key: string) => string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/68 p-5">
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-foreground">
          {t("annualSeriesPendingTitle")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("annualSeriesPendingDescription")}
        </p>
      </div>

      <div className="mt-5 inline-flex items-center rounded-full border border-border/70 bg-background/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {year}
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
    <div className="rounded-xl border border-border bg-surface-utility px-4 py-3">
      <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function DashboardCoverageBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-utility px-3.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <span className="text-sm font-semibold text-foreground">{value}%</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-navy-900 transition-all duration-700 dark:bg-gold-300"
          style={{ width: `${value}%` }}
        />
      </div>
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
    "relative overflow-hidden rounded-2xl border border-border bg-surface-secondary p-4 shadow-sm transition-all duration-300",
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

// DashboardLegendItem removed – unused
