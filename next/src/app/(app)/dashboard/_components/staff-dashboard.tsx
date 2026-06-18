"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock3,
  FileText,
  Gauge,
  School,
  ShieldCheck,
  TrendingUp,
  Upload,
  Users,
  UserPlus,
  WifiHigh,
  type LucideIcon,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type {
  DashboardActionData,
  DashboardCardData,
  DashboardSummary,
  DashboardTrendPoint,
  DashboardWorkItem,
  ZafYearStat,
} from "@/lib/dashboard";
import {
  ChartFrame,
  ResponsiveChartContainer,
} from "@/components/ui/chart-frame";
import { cn } from "@/lib/utils";
import { useReducedEffects } from "@/hooks/use-reduced-effects";
import { DashboardPanel, sectionAnimation } from "@/components/ui/dashboard-panel";
import { useSyncStatus } from "@/hooks/use-sync-status";

type TeacherSummary = Extract<DashboardSummary, { variant: "teacher" }>;
type Translate = (key: string, values?: Record<string, string | number>) => string;

interface StaffDashboardContentProps {
  greeting: string;
  locale: string;
  summary: TeacherSummary;
  t: Translate;
  username: string;
}

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

const KPI_FOOTER_ICONS: Record<string, LucideIcon> = {
  "teacher-students": TrendingUp,
  "teacher-sessions": CalendarDays,
  "teacher-exemptions": CircleAlert,
  "teacher-sos": Clock3,
};

const cardAccentStyles = {
  blue: {
    border: "border-border dark:border-white/10",
    glow: "from-transparent via-transparent to-transparent",
    icon: "bg-navy-100 text-navy-700 dark:bg-white/8 dark:text-navy-100",
    text: "text-navy-700 dark:text-navy-200",
  },
  gold: {
    border: "border-border dark:border-white/10",
    glow: "from-transparent via-transparent to-transparent",
    icon: "bg-gold-100 text-gold-700 dark:bg-gold-300/12 dark:text-gold-200",
    text: "text-gold-700 dark:text-gold-200",
  },
  green: {
    border: "border-border dark:border-white/10",
    glow: "from-transparent via-transparent to-transparent",
    icon:
      "bg-success-100 text-success-700 dark:bg-success-300/12 dark:text-success-200",
    text: "text-success-700 dark:text-success-200",
  },
  red: {
    border: "border-border dark:border-white/10",
    glow: "from-transparent via-transparent to-transparent",
    icon:
      "bg-danger-100 text-danger-700 dark:bg-danger-300/12 dark:text-danger-200",
    text: "text-danger-700 dark:text-danger-200",
  },
};

const actionToneStyles: Record<DashboardActionData["tone"], string> = {
  danger:
    "border-border bg-background/70 text-danger-600 dark:bg-white/6 dark:text-danger-300",
  gold: "border-border bg-background/70 text-gold-700 dark:bg-white/6 dark:text-gold-300",
  primary:
    "border-border bg-background/70 text-navy-700 dark:bg-white/6 dark:text-navy-200",
  secondary:
    "border-border bg-background/70 text-foreground dark:bg-white/6",
};

const quickActionIconStyles: Record<string, string> = {
  bulkImport:
    "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-300/20 dark:bg-violet-300/12 dark:text-violet-200",
  enrollStudent:
    "border-gold-200 bg-gold-100 text-gold-700 dark:border-gold-300/20 dark:bg-gold-300/12 dark:text-gold-200",
  generateReport:
    "border-success-200 bg-success-100 text-success-700 dark:border-success-300/20 dark:bg-success-300/12 dark:text-success-200",
  logBiometrics:
    "border-gold-200 bg-gold-100 text-gold-700 dark:border-gold-300/20 dark:bg-gold-300/12 dark:text-gold-200",
  newAssessment:
    "border-navy-200 bg-navy-100 text-navy-700 dark:border-navy-200/20 dark:bg-white/8 dark:text-navy-100",
  raiseSos:
    "border-danger-200 bg-danger-100 text-danger-700 dark:border-danger-300/20 dark:bg-danger-300/12 dark:text-danger-200",
};

const workToneStyles: Record<DashboardWorkItem["tone"], {
  icon: LucideIcon;
  iconBg: string;
  dot: string | null;
}> = {
  danger: {
    icon: AlertTriangle,
    iconBg: "bg-danger-100 text-danger-600 dark:bg-danger-300/12 dark:text-danger-300",
    dot: "bg-danger-500",
  },
  default: {
    icon: ClipboardList,
    iconBg: "bg-muted text-muted-foreground",
    dot: null,
  },
  info: {
    icon: ClipboardList,
    iconBg: "bg-gold-100 text-gold-700 dark:bg-gold-300/12 dark:text-gold-300",
    dot: null,
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-success-100 text-success-700 dark:bg-success-300/12 dark:text-success-300",
    dot: null,
  },
  warning: {
    icon: Activity,
    iconBg: "bg-success-100 text-success-700 dark:bg-success-300/12 dark:text-success-300",
    dot: null,
  },
};

function formatNumber(value: number, locale: string) {
  return value.toLocaleString(locale === "en" ? "en-GB" : "pt-PT");
}

function _formatDisplayDate(value: string | null, locale: string) {
  if (!value) return null;

  return new Date(value).toLocaleDateString(locale === "en" ? "en-GB" : "pt-PT", {
    day: "2-digit",
    month: "short",
  });
}

function getLatestYear(zafByYear: ZafYearStat[]) {
  return zafByYear.find((year) => year.withBio > 0) ?? zafByYear[0] ?? null;
}

function getHealthyPct(year: Pick<ZafYearStat, "withBio" | "zsaf"> | null) {
  if (!year || year.withBio <= 0) return 0;
  return Math.round((year.zsaf / year.withBio) * 100);
}

function formatTimeAgo(date: Date, locale: string): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const isEnglish = locale.toLowerCase().startsWith("en");

  if (seconds < 60) {
    return isEnglish ? `${seconds}s ago` : `há ${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return isEnglish ? `${minutes} min ago` : `há ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return isEnglish ? `${hours} hr ago` : `há ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  if (isEnglish) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  return `há ${days} dia${days > 1 ? "s" : ""}`;
}

function isRecent(date: Date, hours = 24): boolean {
  return Date.now() - date.getTime() < hours * 60 * 60 * 1000;
}

function useAnimatedNumber(target: number, disabled: boolean) {
  const [display, setDisplay] = useState(target);
  const previous = useRef(target);

  useEffect(() => {
    if (disabled) {
      previous.current = target;
      return;
    }

    if (previous.current === target) {
      return;
    }

    let frame = 0;
    const start = performance.now();
    const from = previous.current;
    const duration = 620;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    previous.current = target;
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [disabled, target]);

  return disabled ? target : display;
}

function formatTrendLabel(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "pt-PT", {
    month: "short",
  }).format(date);
}

function getTrendData(trendPoints: DashboardTrendPoint[], locale: string) {
  return trendPoints
    .filter((point) => point.averageBmi !== null || point.fitnessScore !== null)
    .map((point) => ({
      averageBmi: point.averageBmi,
      biometricCount: point.biometricCount,
      fitnessScore: point.fitnessScore,
      label: formatTrendLabel(point.recordedAt, locale),
      testCount: point.testCount,
    }));
}

function TooltipShell({
  children,
  label,
}: {
  children: React.ReactNode;
  label: React.ReactNode;
}) {
  return (
    <div className="min-w-[190px] rounded-[12px] border border-navy-200/70 bg-[#fffdf8]/92 px-4 py-3 text-sm shadow-[0_4px_12px_rgba(9,21,35,0.08)] ring-1 ring-white/70 backdrop-blur-sm dark:border-white/14 dark:bg-navy-950/90 dark:shadow-[0_4px_12px_rgba(9,21,35,0.08)] dark:ring-white/6">
      <p className="mb-2 text-base font-extrabold leading-tight tracking-tight text-navy-950 dark:text-white">
        {label}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function TooltipMetric({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-muted-foreground">
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 font-bold text-foreground">{value}</span>
    </div>
  );
}

function TrendTooltip({
  active,
  label,
  locale,
  payload,
  t,
}: TooltipContentProps & {
  locale: string;
  t: Translate;
}) {
  if (!active || !payload?.length) return null;

  const averageBmi = payload.find((item) => item.dataKey === "averageBmi");
  const fitnessScore = payload.find((item) => item.dataKey === "fitnessScore");
  const hasAverageBmi = typeof averageBmi?.value === "number";
  const hasFitnessScore = typeof fitnessScore?.value === "number";

  if (!hasAverageBmi && !hasFitnessScore) return null;

  return (
    <TooltipShell label={label}>
      {hasAverageBmi ? (
        <TooltipMetric
          color="#b88c19"
          label={t("avgBmi")}
          value={(averageBmi.value as number).toFixed(1)}
        />
      ) : null}
      {hasFitnessScore ? (
        <TooltipMetric
          color="#2d8a5f"
          label={t("fitnessScore")}
          value={`${formatNumber(fitnessScore.value as number, locale)}%`}
        />
      ) : null}
    </TooltipShell>
  );
}

function CoverageTrendChart({
  activeMetric,
  locale,
  reducedEffects,
  t,
  trendData,
}: {
  activeMetric: "bmi" | "fitness";
  locale: string;
  reducedEffects: boolean;
  t: Translate;
  trendData: Array<{
    averageBmi: number | null;
    biometricCount: number;
    fitnessScore: number | null;
    label: string;
    testCount: number;
  }>;
}) {
  const showBmi = activeMetric === "bmi";
  const showFitness = activeMetric === "fitness";

  return (
    <ChartFrame className="h-[250px] min-w-0">
      {trendData.length > 0 ? (
        <ResponsiveChartContainer height="100%" width="100%">
          <LineChart
            accessibilityLayer={false}
            data={trendData}
            margin={{ bottom: 4, left: 8, right: 12, top: 12 }}
          >
            <CartesianGrid
              stroke="currentColor"
              strokeDasharray="0"
              vertical={false}
              className="text-muted-foreground/18"
            />
            <XAxis
              axisLine={false}
              dataKey="label"
              minTickGap={16}
              tick={{ fill: "currentColor", fontSize: 11 }}
              tickLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              yAxisId="bmi"
              hide={!showBmi}
              axisLine={false}
              domain={["dataMin - 1", "dataMax + 1"]}
              tick={{ fill: "currentColor", fontSize: 11 }}
              tickFormatter={(value) => Number(value).toFixed(1)}
              tickLine={false}
              width={48}
              className="text-muted-foreground"
            />
            <YAxis
              yAxisId="fitness"
              hide={!showFitness}
              axisLine={false}
              domain={[0, 100]}
              orientation="right"
              tick={{ fill: "currentColor", fontSize: 11 }}
              tickFormatter={(value) => `${value}%`}
              tickLine={false}
              width={38}
              className="text-muted-foreground"
            />
            <Tooltip
              content={(props) => (
                <TrendTooltip {...props} locale={locale} t={t} />
              )}
              animationDuration={0}
              cursor={false}
              isAnimationActive={false}
              offset={14}
              wrapperStyle={{
                outline: "none",
                pointerEvents: "none",
                transition: "none",
              }}
            />
            <Line
              yAxisId="bmi"
              hide={!showBmi}
              dataKey="averageBmi"
              dot={{
                fill: "var(--color-card)",
                r: 4,
                stroke: "#b88c19",
                strokeWidth: 2,
              }}
              isAnimationActive={!reducedEffects}
              name="averageBmi"
              stroke="#b88c19"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              type="monotone"
            />
            <Line
              yAxisId="fitness"
              hide={!showFitness}
              dataKey="fitnessScore"
              dot={{
                fill: "var(--color-card)",
                r: 4,
                stroke: "#2d8a5f",
                strokeWidth: 2,
              }}
              isAnimationActive={!reducedEffects}
              name="fitnessScore"
              stroke="#2d8a5f"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              type="monotone"
            />
          </LineChart>
        </ResponsiveChartContainer>
      ) : (
        <div className="flex h-full items-center justify-center rounded-[12px] border border-dashed border-border bg-background/45 px-4 text-center text-sm text-muted-foreground">
          {t("annualSeriesPendingDescription")}
        </div>
      )}
    </ChartFrame>
  );
}

function ProfessorKpiCard({
  card,
  index,
  locale,
  reducedEffects,
  t,
}: {
  card: DashboardCardData;
  index: number;
  locale: string;
  reducedEffects: boolean;
  t: Translate;
}) {
  const Icon = ICONS[card.icon];
  const FooterIcon = KPI_FOOTER_ICONS[card.id] ?? CalendarDays;
  const styles = cardAccentStyles[card.accent];
  const value = useAnimatedNumber(card.value, reducedEffects);

  return (
    <DashboardPanel
      index={index}
      reducedEffects={reducedEffects}
      className={cn(
        "group h-full min-h-[178px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(9,21,35,0.12)] dark:hover:shadow-[0_10px_28px_rgba(0,0,0,0.34)]",
        styles.border,
        reducedEffects && "transition-none hover:translate-y-0",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-90",
          styles.glow,
        )}
      />
      <div className="relative flex h-full min-h-[160px] flex-col p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-muted-foreground">
            {t(card.titleKey)}
          </p>
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-[8px] transition-transform duration-300 group-hover:scale-105",
              styles.icon,
              reducedEffects && "transition-none group-hover:scale-100",
            )}
          >
            <Icon className="size-[18px]" />
          </span>
        </div>

        <p className={cn(
          "text-5xl font-extrabold tracking-tight",
          card.accent === "red" ? styles.text : "text-foreground",
        )}>
          {formatNumber(value, locale)}
        </p>

        <span
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs font-semibold",
            styles.text,
          )}
        >
          <FooterIcon className="size-3 shrink-0" />
          {card.footerKey
            ? t(card.footerKey, card.footerValues)
            : card.footer ?? t(card.descriptionKey)}
        </span>
      </div>
    </DashboardPanel>
  );
}

function ProfessorIntro({
  greeting,
  reducedEffects,
  t,
  username,
}: {
  greeting: string;
  reducedEffects: boolean;
  t: Translate;
  username: string;
}) {
  return (
    <div
      style={sectionAnimation(0, reducedEffects)}
      className={cn(
        "mb-2 min-w-0",
        !reducedEffects && "animate-fade-in-up opacity-0",
      )}
    >
      <h1 className="font-display text-[32px] font-bold tracking-tight text-navy-950 dark:text-white">
        {t("title")}
      </h1>
      <p className="mt-1 max-w-3xl text-sm text-navy-700 dark:text-navy-200">
        {t("welcomeBackOverview", {
          greeting,
          name: username,
        })}
      </p>
    </div>
  );
}

function TrendPanel({
  coverage,
  locale,
  reducedEffects,
  t,
  trendData,
}: {
  coverage: DashboardCardData[];
  locale: string;
  reducedEffects: boolean;
  t: Translate;
  trendData: Array<{
    averageBmi: number | null;
    biometricCount: number;
    fitnessScore: number | null;
    label: string;
    testCount: number;
  }>;
}) {
  const [activeMetric, setActiveMetric] = useState<"bmi" | "fitness">("bmi");

  return (
    <DashboardPanel
      index={5}
      reducedEffects={reducedEffects}
      className="min-h-[420px] p-6"
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="mt-2 text-lg font-bold tracking-tight text-foreground">
            {t("bmiFitnessTrends")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t("currentAcademicYear")}
          </p>
        </div>
        <div className="inline-flex self-start rounded-[8px] border border-border bg-background/60 p-1 text-xs font-semibold text-muted-foreground">
          <button
            onClick={() => setActiveMetric("bmi")}
            className={cn(
              "rounded-[6px] px-3 py-1.5 transition-colors",
              activeMetric === "bmi"
                ? "bg-gold-100 text-gold-800 dark:bg-gold-300/14 dark:text-gold-200"
                : "hover:text-foreground",
            )}
          >
            {t("avgBmi")}
          </button>
          <button
            onClick={() => setActiveMetric("fitness")}
            className={cn(
              "rounded-[6px] px-3 py-1.5 transition-colors",
              activeMetric === "fitness"
                ? "bg-gold-100 text-gold-800 dark:bg-gold-300/14 dark:text-gold-200"
                : "hover:text-foreground",
            )}
          >
            {t("fitnessScore")}
          </button>
        </div>
      </div>

      <CoverageTrendChart
        activeMetric={activeMetric}
        locale={locale}
        reducedEffects={reducedEffects}
        t={t}
        trendData={trendData}
      />

      <div className="mt-4 flex flex-wrap items-center justify-end gap-4 text-xs font-medium text-muted-foreground">
        {activeMetric === "bmi" && (
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-4 rounded-[16px] bg-[#b88c19]" />
            {t("avgBmi")}
          </span>
        )}
        {activeMetric === "fitness" && (
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-4 rounded-[16px] bg-[#2d8a5f]" />
            {t("fitnessScore")}
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {coverage.map((card) => {
          const Icon = ICONS[card.icon];
          const styles = cardAccentStyles[card.accent];

          return (
            <Link
              key={card.id}
              href={
                card.id === "missing-tests"
                  ? "/testes"
                  : card.id === "missing-questionnaires"
                    ? "/turma"
                    : "/biometria"
              }
              className="group"
            >
              <div className="flex h-full items-center gap-3 rounded-[12px] border border-border bg-background/55 p-3.5 transition-all hover:-translate-y-0.5 hover:border-gold-300/40 hover:bg-background/75 hover:shadow-[0_4px_12px_rgba(9,21,35,0.06)]">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-[8px]",
                    styles.icon,
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                    {t(card.titleKey)}
                  </span>
                  <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {formatNumber(card.value, locale)} - {t(card.descriptionKey)}
                  </span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </DashboardPanel>
  );
}

function normalCurveY(x: number): number {
  return Math.exp(-(x * x) / 2);
}

// Approximation of standard normal CDF using error function approximation
function normalCurveCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.sqrt(2);

  const t = 1 / (1 + p * z);
  const erf =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  return 0.5 * (1 + sign * erf);
}

function getZafDistributionData() {
  return Array.from({ length: 49 }, (_, index) => {
    const x = -3 + index * 0.125;
    return {
      x,
      y: normalCurveY(x),
    };
  });
}

function ZafDistributionChart({
  healthy,
  reducedEffects,
}: {
  healthy: number;
  reducedEffects: boolean;
}) {
  const distributionData = useMemo(() => getZafDistributionData(), []);
  const markerX = Math.max(-2.2, Math.min(2.2, (healthy / 100) * 4 - 2));
  const markerY = normalCurveY(markerX);

  return (
    <ChartFrame className="relative h-[170px] min-w-0">
      <ResponsiveChartContainer height="100%" width="100%">
        <AreaChart
          accessibilityLayer={false}
          data={distributionData}
          margin={{ bottom: 10, left: 8, right: 8, top: 12 }}
        >
          <defs>
            <linearGradient id="zaf-distribution-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#b88c19" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#b88c19" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            axisLine={false}
            dataKey="x"
            domain={[-3, 3]}
            tick={{ fill: "currentColor", fontSize: 10 }}
            tickFormatter={(value) =>
              value === 0 ? "0" : Number(value) > 0 ? `+${value}` : `${value}`
            }
            ticks={[-2, -1, 0, 1, 2]}
            tickLine={false}
            type="number"
            className="text-muted-foreground"
          />
          <YAxis domain={[0, 1.08]} hide type="number" />
          <Tooltip
            animationDuration={0}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const x = payload[0].payload.x as number;
              const zScore = x.toFixed(2);
              const percentile = Math.round((1 - normalCurveCDF(x)) * 100);
              return (
                <TooltipShell label={`Z = ${zScore}`}>
                  <TooltipMetric
                    color="#b88c19"
                    label="Z-Score"
                    value={zScore}
                  />
                  <TooltipMetric
                    color="#2d8a5f"
                    label="Percentile"
                    value={`${percentile}%`}
                  />
                </TooltipShell>
              );
            }}
            cursor={{ stroke: "#b88c19", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Area
            dataKey="y"
            fill="url(#zaf-distribution-fill)"
            isAnimationActive={!reducedEffects}
            stroke="#b88c19"
            strokeLinecap="round"
            strokeWidth={2.5}
            type="monotone"
          />
          <ReferenceLine
            x={markerX}
            stroke="currentColor"
            strokeDasharray="3 5"
            className="text-muted-foreground/45"
          />
          <ReferenceDot
            x={markerX}
            y={markerY}
            fill="var(--color-card)"
            r={7}
            stroke="#b88c19"
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveChartContainer>
    </ChartFrame>
  );
}

function ZafDistributionPanel({
  latestYear,
  locale,
  reducedEffects,
  t,
}: {
  latestYear: ZafYearStat | null;
  locale: string;
  reducedEffects: boolean;
  t: Translate;
}) {
  const healthy = getHealthyPct(latestYear);
  const improvement = Math.max(0, 100 - healthy);

  return (
    <DashboardPanel index={6} reducedEffects={reducedEffects} className="p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {t("zafDistributionTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {latestYear?.year ?? t("noBioData")}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-semibold text-success-700 dark:bg-white/6 dark:text-success-300">
          live
        </span>
      </div>

      <div className="relative mx-auto max-w-[360px]">
        <ZafDistributionChart
          healthy={healthy}
          reducedEffects={reducedEffects}
        />
        <div className="pointer-events-none absolute right-2 top-2 z-10 rounded-full bg-gold-100 px-3 py-1 text-xs font-bold text-gold-800 shadow-sm dark:bg-gold-300/14 dark:text-gold-200">
          {healthy}% {t("zsaf")}
        </div>
      </div>

      <div className="mt-5 border-t border-border/70 pt-5">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("coverageAverageLabel")}
          </span>
          <span className="font-bold text-foreground">
            {latestYear
              ? `${formatNumber(latestYear.withBio, locale)} / ${formatNumber(latestYear.total, locale)}`
              : "-"}
          </span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-muted/60">
          <span
            className="bg-success-500 transition-all duration-700"
            style={{ width: `${healthy}%` }}
          />
          <span
            className="bg-danger-500/80 transition-all duration-700"
            style={{ width: `${improvement}%` }}
          />
        </div>
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="size-2 rounded-full bg-success-500" />
            {t("zsaf")} {healthy}%
          </span>
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="size-2 rounded-full bg-danger-500" />
            {t("zmf")} {improvement}%
          </span>
        </div>
      </div>
    </DashboardPanel>
  );
}

function SystemStatusPanel({
  locale,
  reducedEffects,
  t,
}: {
  locale: string;
  reducedEffects: boolean;
  summary: TeacherSummary;
  t: Translate;
}) {
  const { isOnline, draftCount, lastSyncAt, isSyncing } = useSyncStatus();
  const pending = draftCount > 0 || !isOnline;
  const hasLastSync = lastSyncAt !== null;

  return (
    <DashboardPanel index={7} reducedEffects={reducedEffects} className="p-5">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[8px] transition-colors duration-300",
            pending
              ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
              : "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
          )}
        >
          <WifiHigh className={cn("size-5", isSyncing && "animate-pulse")} />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-foreground">
            {t("systemStatus")}
          </h3>
          <p
            className={cn(
              "mt-0.5 truncate text-xs font-medium transition-colors duration-300",
              pending
                ? "text-amber-600 dark:text-amber-400"
                : "text-success-600 dark:text-success-400",
            )}
          >
            {pending ? t("syncPending") : t("allSystemsOperational")}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full transition-colors duration-300",
              pending ? "bg-amber-500" : "bg-success-500",
            )}
          />
          {draftCount > 0
            ? t("draftsSyncing", { count: draftCount })
            : !isOnline
            ? t("offline")
            : t("allCaughtUp")}
        </span>
        {hasLastSync && (
          <>
            <span className="text-muted-foreground/55">•</span>
            <span>
              {t("lastSync")} {formatTimeAgo(lastSyncAt, locale)}
            </span>
          </>
        )}
      </div>
    </DashboardPanel>
  );
}

function RecentActivityPanel({
  items,
  locale,
  reducedEffects,
  t,
}: {
  items: DashboardWorkItem[];
  locale: string;
  reducedEffects: boolean;
  t: Translate;
}) {
  const [showAll, setShowAll] = useState(false);
  const PREVIEW = 6;
  const visible = showAll ? items : items.slice(0, PREVIEW);
  const hasMore = items.length > PREVIEW;

  return (
    <DashboardPanel
      index={8}
      reducedEffects={reducedEffects}
      className="h-full p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          {t("recentActivity")}
        </h2>
        {hasMore && (
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="text-xs font-semibold text-gold-700 transition-colors hover:text-navy-700 dark:text-gold-300 dark:hover:text-gold-200"
          >
            {showAll ? t("showLess") : t("viewAll")}
          </button>
        )}
      </div>

      {visible.length > 0 ? (
        <div>
          {visible.map((item, index) => {
            const tone = workToneStyles[item.tone];
            const Icon = tone.icon;

            return (
              <Fragment key={item.id}>
                <Link href={item.href} className="group -mx-2 block">
                  <div className="flex items-start gap-3 rounded-[8px] px-2 py-3.5 transition-colors hover:bg-muted/50 dark:hover:bg-white/[0.035]">
                    <span
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[8px]",
                        tone.iconBg,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {item.title}
                      </span>
                      {item.meta ? (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {item.meta}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                        {formatTimeAgo(item.createdAt, locale)}
                      </span>
                      {tone.dot && isRecent(item.createdAt) ? (
                        <span className={cn("size-2 rounded-full", tone.dot)} />
                      ) : null}
                    </span>
                  </div>
                </Link>
                {index < visible.length - 1 ? (
                  <hr className="border-0 border-t border-border/50 dark:border-white/8" />
                ) : null}
              </Fragment>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-[12px] border border-dashed border-border bg-background/40 p-6 text-center">
          <CheckCircle2 className="size-9 text-success-600 dark:text-success-300" />
          <h3 className="mt-3 text-base font-bold text-foreground">
            {t("noPendingCasesTitle")}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t("noPendingCasesDescription")}
          </p>
        </div>
      )}
    </DashboardPanel>
  );
}

function QuickActionsPanel({
  actions,
  reducedEffects,
  t,
}: {
  actions: DashboardActionData[];
  reducedEffects: boolean;
  t: Translate;
}) {
  return (
    <DashboardPanel index={9} reducedEffects={reducedEffects} className="p-6">
      <div className="mb-5">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          {t("quickActions")}
        </h2>
      </div>

      <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {actions.map((action) => {
          const Icon = ICONS[action.icon];
          const iconStyle =
            quickActionIconStyles[action.id] ?? actionToneStyles[action.tone];

          return (
            <Link key={action.id} href={action.href} className="group h-full">
              <div className="flex h-full min-h-[86px] items-center gap-3 rounded-[12px] border border-navy-950/8 bg-white/65 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-gold-300/40 hover:bg-white/85 hover:shadow-[0_4px_12px_rgba(9,21,35,0.06)] dark:border-white/10 dark:bg-white/[0.045] dark:hover:border-gold-300/30 dark:hover:bg-white/[0.07] dark:hover:shadow-[0_8px_18px_rgba(0,0,0,0.22)]">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-[12px] border transition-transform group-hover:scale-105",
                    iconStyle,
                    reducedEffects && "transition-none group-hover:scale-100",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold leading-tight text-foreground">
                    {t(action.titleKey)}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {t(action.descriptionKey)}
                  </span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </DashboardPanel>
  );
}

export function StaffDashboardContent({
  greeting,
  locale,
  summary,
  t,
  username,
}: StaffDashboardContentProps) {
  const reducedEffects = useReducedEffects();
  const latestYear = getLatestYear(summary.zafByYear);
  const trendData = useMemo(
    () => getTrendData(summary.trendPoints, locale),
    [locale, summary.trendPoints],
  );

  return (
    <div className="grid min-w-0 gap-6">
      <ProfessorIntro
        greeting={greeting}
        reducedEffects={reducedEffects}
        t={t}
        username={username}
      />

      <div className="grid min-w-0 gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summary.cards.map((card, index) => (
          <ProfessorKpiCard
            key={card.id}
            card={card}
            index={index + 1}
            locale={locale}
            reducedEffects={reducedEffects}
            t={t}
          />
        ))}
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.7fr)]">
        <TrendPanel
          coverage={summary.classCoverage}
          locale={locale}
          reducedEffects={reducedEffects}
          t={t}
          trendData={trendData}
        />

        <div className="grid min-w-0 gap-5">
          <ZafDistributionPanel
            latestYear={latestYear}
            locale={locale}
            reducedEffects={reducedEffects}
            t={t}
          />
          <SystemStatusPanel
            locale={locale}
            reducedEffects={reducedEffects}
            summary={summary}
            t={t}
          />
        </div>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <RecentActivityPanel
          items={summary.workItems}
          locale={locale}
          reducedEffects={reducedEffects}
          t={t}
        />
        <QuickActionsPanel
          actions={summary.quickActions}
          reducedEffects={reducedEffects}
          t={t}
        />
      </div>
    </div>
  );
}
