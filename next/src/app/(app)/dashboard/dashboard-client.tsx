"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gauge,
  HeartPulse,
  Link2,
  Ruler,
  School,
  ShieldCheck,
  Upload,
  Users,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { StaffDashboardContent } from "./_components/staff-dashboard";
import { StudentDashboardContent } from "./_components/student-dashboard";
import type {
  DashboardActionData,
  DashboardCardData,
  DashboardSummary,
  DashboardWorkItem,
  ZafYearStat,
} from "@/lib/dashboard";
import { getQuestionnaireTypeLabelKey } from "@/lib/questionnaires";
import {
  DASHBOARD_FALLBACK_MESSAGES,
  DASHBOARD_FALLBACK_NAV,
  DASHBOARD_FALLBACK_QUESTIONNAIRES,
} from "@/lib/dashboard-fallback";
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
  dashboard: DASHBOARD_FALLBACK_MESSAGES,
  nav: DASHBOARD_FALLBACK_NAV,
  questionarios: DASHBOARD_FALLBACK_QUESTIONNAIRES,
};

const ICONS: Record<DashboardCardData["icon"], LucideIcon> = {
  activity: Activity,
  alert: AlertTriangle,
  book: BookOpen,
  clipboard: ClipboardList,
  file: FileText,
  gauge: Gauge,
  school: School,
  shield: ShieldCheck,
  upload: Upload,
  users: Users,
  userPlus: UserPlus,
};

function formatMessage(
  template: string,
  values?: Record<string, string | number>,
) {
  if (!values) return template;

  let result = template;
  for (const [token, replacement] of Object.entries(values)) {
    result = result.replaceAll(`{${token}}`, String(replacement));
  }
  return result;
}

function formatCompactDate(value: string | null, locale: string) {
  if (!value) return "-";

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
  if (!year || year.total <= 0) return 0;
  return Math.round((year.withBio / year.total) * 100);
}

function getHealthyPct(year: Pick<ZafYearStat, "withBio" | "zsaf"> | null) {
  if (!year || year.withBio <= 0) return 0;
  return Math.round((year.zsaf / year.withBio) * 100);
}

function getLatestYear(zafByYear: ZafYearStat[] | null) {
  if (!zafByYear) return null;
  return zafByYear.find((year) => year.withBio > 0) ?? zafByYear[0] ?? null;
}

function useDashboardText(messages: Props["messages"]) {
  const t = (key: string, values?: Record<string, string | number>) =>
    formatMessage(
      messages?.dashboard[key] ?? FALLBACK_MESSAGES.dashboard[key] ?? key,
      values,
    );
  const nav = (key: string, values?: Record<string, string | number>) =>
    formatMessage(
      messages?.nav[key] ?? FALLBACK_MESSAGES.nav[key] ?? key,
      values,
    );
  const questionnaires = (
    key: string,
    values?: Record<string, string | number>,
  ) =>
    formatMessage(
      messages?.questionarios[key] ??
        FALLBACK_MESSAGES.questionarios[key] ??
        key,
      values,
    );

  return { nav, questionnaires, t };
}

function getRoleCopy(summary: DashboardSummary) {
  if (summary.variant === "admin") return "platformOverview";
  if (summary.variant === "teacher") return "teacherOverview";
  if (summary.variant === "psychologist") return "psychologistOverview";
  if (summary.variant === "parent") return "parentOverview";
  return "activitySummary";
}

export function DashboardClient({
  greeting,
  locale = "pt-PT",
  messages = FALLBACK_MESSAGES,
  summary,
  todayLabel,
  username,
}: Props) {
  const { nav, questionnaires, t } = useDashboardText(messages);
  const titleName =
    summary.variant === "student" && summary.studentSummary
      ? summary.studentSummary.name.split(" ")[0]
      : username;

  return (
    <PageScaffold
      className="gap-6"
      header={
        summary.variant === "teacher" || summary.variant === "student" ? null : (
          <DashboardHero
            eyebrow={t("dashboardStatus")}
            title={`${greeting}, ${titleName}`}
            description={t(getRoleCopy(summary))}
            todayLabel={todayLabel}
          />
        )
      }
    >
      {summary.variant === "admin" ? (
        <AdminDashboard locale={locale} summary={summary} t={t} />
      ) : summary.variant === "teacher" ? (
        <TeacherDashboard
          greeting={greeting}
          locale={locale}
          summary={summary}
          t={t}
          username={titleName}
        />
      ) : summary.variant === "psychologist" ? (
        <PsychologistDashboard
          locale={locale}
          questionnaires={questionnaires}
          summary={summary}
          t={t}
        />
      ) : summary.variant === "parent" ? (
        <ParentDashboard locale={locale} summary={summary} t={t} />
      ) : (
        <StudentDashboard
          greeting={greeting}
          locale={locale}
          nav={nav}
          questionnaires={questionnaires}
          summary={summary}
          t={t}
        />
      )}
    </PageScaffold>
  );
}

function DashboardHero({
  description,
  eyebrow,
  title,
  todayLabel,
}: {
  description: string;
  eyebrow: string;
  title: string;
  todayLabel: string;
}) {
  return (
    <PageHeader
      eyebrow={eyebrow}
      title={title}
      description={description}
      icon={<HeartPulse className="size-6" />}
      meta={
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <CalendarDays className="size-3.5 text-gold-600 dark:text-gold-300" />
          {todayLabel}
        </span>
      }
    />
  );
}

function AdminDashboard({
  locale,
  summary,
  t,
}: {
  locale: string;
  summary: Extract<DashboardSummary, { variant: "admin" }>;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="grid gap-6">
      <MetricGrid cards={summary.cards} t={t} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <WorkQueue
          description={t("commandCenterDescription")}
          emptyIcon={CheckCircle2}
          emptyTitle={t("noPendingCasesTitle")}
          eyebrow={t("commandCenter")}
          items={summary.workItems}
          locale={locale}
          t={t}
          title={t("commandCenterTitle")}
        />
        <QuickActions actions={summary.quickActions} t={t} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <DataQuality cards={summary.quality} t={t} />
        <ZafPanel locale={locale} t={t} zafByYear={summary.zafByYear} />
      </div>
    </div>
  );
}

function TeacherDashboard({
  greeting,
  locale,
  summary,
  t,
  username,
}: {
  greeting: string;
  locale: string;
  summary: Extract<DashboardSummary, { variant: "teacher" }>;
  t: (key: string, values?: Record<string, string | number>) => string;
  username: string;
}) {
  return (
    <StaffDashboardContent
      greeting={greeting}
      locale={locale}
      summary={summary}
      t={t}
      username={username}
    />
  );
}

function PsychologistDashboard({
  locale,
  questionnaires,
  summary,
  t,
}: {
  locale: string;
  questionnaires: (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  summary: Extract<DashboardSummary, { variant: "psychologist" }>;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="grid gap-6">
      <MetricGrid cards={summary.cards} t={t} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <PageSection
          eyebrow={t("clinicalDesk")}
          title={t("clinicalDeskTitle")}
          description={t("clinicalDeskDescription")}
          tone="secondary"
          layout="list"
        >
          {summary.openAlerts.length > 0 ? (
            <div className="grid gap-2">
              {summary.openAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={`/acompanhamento/${alert.studentId}`}
                  className="group"
                >
                  <div className="flex items-center gap-4 rounded-xl border-l-2 border-danger-500 bg-danger-500/5 py-3 pl-4 pr-4 transition-all hover:bg-danger-500/8 dark:bg-danger-500/8 dark:hover:bg-danger-500/12">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-danger-500/10 text-danger-600 dark:text-danger-400">
                      <AlertTriangle className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {alert.studentName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {alert.className ?? t("classPending")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge variant="danger" className="hidden sm:inline-flex">{t("pendingSos")}</Badge>
                      <span className="hidden text-xs text-muted-foreground lg:inline">
                        {formatCompactDate(alert.createdAt, locale)}
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title={t("noPendingCasesTitle")}
              description={t("noPendingCasesDescription")}
            />
          )}
        </PageSection>

        <QuickActions actions={summary.quickActions} t={t} />
      </div>

      <PageSection
        eyebrow={t("recentQuestionnairesTitle")}
        title={t("recentQuestionnairesTitle")}
        description={t("recentQuestionnairesDescription")}
        tone="secondary"
        layout="list"
      >
        {summary.recentQuestionnaires.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {summary.recentQuestionnaires.map((questionnaire) => (
              <div key={questionnaire.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 px-4 py-3 backdrop-blur-sm dark:border-white/8 dark:bg-navy-950/50">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold-500/10 text-gold-700 dark:text-gold-300">
                  <ClipboardList className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {questionnaire.studentName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
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
                <Badge variant="gold" className="shrink-0">
                  {formatCompactDate(questionnaire.submittedAt, locale)}
                </Badge>
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
    </div>
  );
}

function ParentDashboard({
  locale,
  summary,
  t,
}: {
  locale: string;
  summary: Extract<DashboardSummary, { variant: "parent" }>;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="grid gap-6">
      <MetricGrid cards={summary.cards} t={t} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <PageSection
          eyebrow={t("familyDesk")}
          title={t("familyDeskTitle")}
          description={t("familyDeskDescription")}
          tone="secondary"
          layout="list"
        >
          {summary.linkedStudents.length > 0 ? (
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
              {summary.linkedStudents.map((student) => (
                <StudentFamilyCard
                  key={student.id}
                  locale={locale}
                  student={student}
                  t={t}
                />
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

        <QuickActions actions={summary.quickActions} t={t} />
      </div>

      <RecentReports
        locale={locale}
        reports={summary.recentReports}
        t={t}
      />
    </div>
  );
}

function StudentDashboard({
  greeting,
  locale,
  nav,
  questionnaires,
  summary,
  t,
}: {
  greeting: string;
  locale: string;
  nav: (key: string, values?: Record<string, string | number>) => string;
  questionnaires: (key: string, values?: Record<string, string | number>) => string;
  summary: Extract<DashboardSummary, { variant: "student" }>;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const student = summary.studentSummary;

  if (!student) {
    return (
      <EmptyState
        icon={Link2}
        title={t("unlinkedTitle")}
        description={t("unlinkedDescription")}
        action={
          <Link
            href="/perfil"
            className={buttonVariants({ size: "sm", variant: "secondary" })}
          >
            {nav("perfil")}
          </Link>
        }
      />
    );
  }

  return (
    <StudentDashboardContent
      greeting={greeting}
      locale={locale}
      questionnaires={questionnaires}
      student={student}
      t={t}
    />
  );
}

function MetricGrid({
  cards,
  t,
}: {
  cards: DashboardCardData[];
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  if (cards.length === 0) return null;

  const [hero, ...rest] = cards;
  if (!hero) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <FeaturedKpi card={hero} t={t} />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {rest.map((card) => (
          <li key={card.id}>
            <KpiCard
              accent={card.accent}
              footer={card.footer ?? t(card.descriptionKey)}
              icon={ICONS[card.icon]}
              title={t(card.titleKey)}
              value={card.value}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeaturedKpi({
  card,
  t,
}: {
  card: DashboardCardData;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const Icon = ICONS[card.icon];

  return (
    <div className="relative isolate overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 p-6 text-white shadow-[0_18px_40px_-18px_rgba(9,21,35,0.45)] sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_0%,rgba(232,199,102,0.32),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl"
      />
      <svg
        aria-hidden
        viewBox="0 0 200 80"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full text-gold-300/15"
        preserveAspectRatio="none"
      >
        <path
          d="M0 40 Q 25 10 50 40 T 100 40 T 150 40 T 200 40 V 80 H 0 Z"
          fill="currentColor"
        />
      </svg>

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-gold-200/80">
            {t("dashboardStatus")}
          </p>
          <h3 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {t(card.titleKey)}
          </h3>
          <p className="text-sm text-white/70">{t(card.descriptionKey)}</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/8 text-gold-300 ring-1 ring-inset ring-white/10 backdrop-blur-sm">
            <Icon className="size-6" />
          </div>
          <p className="font-display text-6xl font-bold leading-none tracking-tight text-white sm:text-7xl">
            {card.value}
          </p>
        </div>
      </div>
      {card.footer ? (
        <p className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/80 ring-1 ring-inset ring-white/10">
          {card.footer}
        </p>
      ) : null}
    </div>
  );
}

function QuickActions({
  actions = [],
  compact = false,
  t,
}: {
  actions: DashboardActionData[];
  compact?: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <PageSection
      eyebrow={t("quickActions")}
      title={t("quickActions")}
      description={compact ? undefined : t("quickActionsDescription")}
      tone="utility"
      layout="list"
    >
      <div className={cn("grid gap-3", compact && "sm:grid-cols-2 lg:grid-cols-1")}>
        {actions.map((action) => {
          const Icon = ICONS[action.icon];

          return (
            <Link key={action.id} href={action.href} className="group">
              <div className="flex items-center gap-3 rounded-[12px] border border-border/70 bg-background/65 p-3.5 transition-all hover:-translate-y-0.5 hover:border-gold-300/45 hover:shadow-card">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-[8px] border",
                    action.tone === "danger"
                      ? "border-danger-500/20 bg-danger-500/10 text-danger-600 dark:text-danger-300"
                      : action.tone === "gold"
                        ? "border-gold-500/20 bg-gold-500/10 text-gold-700 dark:text-gold-300"
                        : "border-border bg-surface-secondary text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {t(action.titleKey)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {t(action.descriptionKey)}
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </PageSection>
  );
}

function WorkQueue({
  description,
  emptyIcon,
  emptyTitle,
  eyebrow,
  items,
  locale: _locale,
  t,
  title,
}: {
  description: string;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  eyebrow: string;
  items: DashboardWorkItem[];
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
  title: string;
}) {
  return (
    <PageSection
      eyebrow={eyebrow}
      title={title}
      description={description}
      tone="secondary"
      layout="list"
    >
      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <WorkQueueItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={t("noPendingCasesDescription")}
        />
      )}
    </PageSection>
  );
}

function WorkQueueItem({
  item,
}: {
  item: DashboardWorkItem;
}) {
  return (
    <Link href={item.href} className="group">
      <div
        className={cn(
          "flex items-center gap-4 rounded-r-xl border-l-2 py-3 pl-4 pr-4 transition-all hover:bg-muted/30 dark:hover:bg-white/[0.03]",
          item.tone === "danger"
            ? "border-danger-500"
            : item.tone === "warning"
              ? "border-gold-400"
              : "border-navy-400/50",
        )}
      >
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            item.tone === "danger"
              ? "bg-danger-500/10 text-danger-600 dark:text-danger-400"
              : item.tone === "warning"
                ? "bg-gold-500/10 text-gold-700 dark:text-gold-300"
                : "bg-navy-500/10 text-navy-700 dark:text-navy-200",
          )}
        >
          {item.tone === "danger" ? (
            <AlertTriangle className="size-4" />
          ) : item.tone === "warning" ? (
            <Activity className="size-4" />
          ) : (
            <ClipboardList className="size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{item.title}</span>
            <ToneBadge tone={item.tone} />
          </div>
          {item.meta ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{item.meta}</p>
          ) : null}
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function ToneBadge({ tone }: { tone: DashboardWorkItem["tone"] }) {
  if (tone === "danger") return <Badge variant="danger">SOS</Badge>;
  if (tone === "warning") return <Badge variant="warning">Fila</Badge>;
  if (tone === "success") return <Badge variant="success">OK</Badge>;
  if (tone === "info") return <Badge variant="info">Info</Badge>;
  return <Badge variant="default">Estado</Badge>;
}

function DataQuality({
  cards,
  t,
}: {
  cards: DashboardCardData[];
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <PageSection
      eyebrow={t("dataQualityTitle")}
      title={t("dataQualityTitle")}
      description={t("dataQualityDescription")}
      tone="secondary"
      layout="default"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = ICONS[card.icon];

          return (
            <Card key={card.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-10 items-center justify-center rounded-[8px] border border-border bg-background/70 text-gold-700 dark:text-gold-300">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    {card.value}
                  </span>
                </div>
                <CardTitle className="mt-5 text-base">{t(card.titleKey)}</CardTitle>
                <CardDescription className="mt-1">
                  {t(card.descriptionKey)}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageSection>
  );
}

function ZafPanel({
  compact = false,
  locale,
  t,
  zafByYear,
}: {
  compact?: boolean;
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
  zafByYear: ZafYearStat[];
}) {
  const latestYear = getLatestYear(zafByYear);

  return (
    <PageSection
      eyebrow={t("zafTitle")}
      title={t("zafTitle")}
      description={t("zafDescription")}
      tone="secondary"
      layout="default"
    >
      {latestYear ? (
        <div className={cn("grid gap-4", !compact && "lg:grid-cols-[0.95fr_1.05fr]")}>
          <Card>
            <CardHeader>
              <CardDescription className="text-xs text-muted-foreground">
                {t("latestAcademicYear")}
              </CardDescription>
              <CardTitle className="text-2xl">{latestYear.year}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <MiniStat
                  icon={Users}
                  label={t("studentsWithBiometrics")}
                  value={`${formatNumberValue(latestYear.withBio, locale)} / ${formatNumberValue(latestYear.total, locale)}`}
                />
                <MiniStat
                  icon={Gauge}
                  label={t("coverageLabel")}
                  value={`${getCoveragePct(latestYear)}%`}
                />
              </div>
              <ZafStackedBar
                healthy={latestYear.zsaf}
                healthyLabel={t("zsaf")}
                improvement={latestYear.zmf}
                improvementLabel={t("zmf")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4 p-5">
              {zafByYear
                .filter((year) => year.withBio > 0)
                .slice(0, 3)
                .map((year) => (
                  <YearRow key={year.year} locale={locale} t={t} year={year} />
                ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState
          icon={Activity}
          title={t("noBioData")}
          description={t("annualSeriesPendingDescription")}
        />
      )}
    </PageSection>
  );
}

function StudentFamilyCard({
  locale,
  student,
  t,
}: {
  locale: string;
  student: Extract<DashboardSummary, { variant: "parent" }>["linkedStudents"][number];
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const initials = student.name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="flex h-full min-w-0 flex-col p-5">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy-900/10 text-sm font-bold text-navy-800 ring-2 ring-navy-400/20 dark:bg-white/10 dark:text-white dark:ring-white/15">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">{student.name}</CardTitle>
            <CardDescription className="mt-1 truncate">
              {[student.className, student.schoolYear].filter(Boolean).join(" - ") ||
                t("studentRecord")}
            </CardDescription>
          </div>
          <Badge variant="info" className="w-fit shrink-0">{t("linkedStudents")}</Badge>
        </div>
        <div className="mt-5 grid min-w-0 flex-1 gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,145px),1fr))]">
          <MiniStat
            icon={Ruler}
            label={t("lastBiometric")}
            value={formatCompactDate(student.lastBiometricAt, locale)}
          />
          <MiniStat
            icon={ClipboardList}
            label={t("lastQuestionnaire")}
            value={formatCompactDate(student.lastQuestionnaireAt, locale)}
          />
          <MiniStat
            icon={FileText}
            label={t("lastReport")}
            value={formatCompactDate(student.lastReportAt, locale)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function RecentReports({
  locale,
  reports,
  t,
}: {
  locale: string;
  reports: Extract<DashboardSummary, { variant: "parent" }>["recentReports"];
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <PageSection
      eyebrow={t("recentReportsTitle")}
      title={t("recentReportsTitle")}
      description={t("recentReportsDescription")}
      tone="secondary"
      layout="list"
    >
      {reports.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => (
            <div key={report.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 px-4 py-3 backdrop-blur-sm dark:border-white/8 dark:bg-navy-950/50">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-navy-500/10 text-navy-700 dark:text-navy-200">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{report.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {report.studentName} · {formatCompactDate(report.createdAt, locale)}
                </p>
              </div>
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
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[14px] border border-border/70 bg-background/60 px-3.5 py-3 transition-colors hover:border-gold-300/50 hover:bg-background/80">
      {Icon && (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-gold-500/10 text-gold-700 dark:text-gold-300">
          <Icon className="size-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function YearRow({
  locale,
  t,
  year,
}: {
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
  year: ZafYearStat;
}) {
  const healthyPct = getHealthyPct(year);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{year.year}</p>
          <p className="text-xs text-muted-foreground">
            {formatNumberValue(year.withBio, locale)} {t("studentsUnit")}
          </p>
        </div>
        <p className="text-sm font-semibold text-success-700 dark:text-success-300">
          {healthyPct}%
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/50">
        <div
          className="h-full rounded-full bg-success-600 dark:bg-success-400"
          style={{ width: `${healthyPct}%` }}
        />
      </div>
    </div>
  );
}

function ZafStackedBar({
  healthy,
  healthyLabel,
  improvement,
  improvementLabel,
}: {
  healthy: number;
  healthyLabel: string;
  improvement: number;
  improvementLabel: string;
}) {
  const total = healthy + improvement;
  const healthyPct = total > 0 ? Math.round((healthy / total) * 100) : 0;

  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted/50">
        <div
          className="bg-success-600 dark:bg-success-400"
          style={{ width: `${healthyPct}%` }}
        />
        <div
          className="bg-danger-500/90 dark:bg-danger-400/90"
          style={{ width: `${Math.max(0, 100 - healthyPct)}%` }}
        />
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <span className="inline-flex items-center gap-2 font-medium">
          <span className="size-2 rounded-full bg-success-500" />
          {healthyLabel} {healthy}
        </span>
        <span className="inline-flex items-center gap-2 font-medium">
          <span className="size-2 rounded-full bg-danger-500" />
          {improvementLabel} {improvement}
        </span>
      </div>
    </div>
  );
}
