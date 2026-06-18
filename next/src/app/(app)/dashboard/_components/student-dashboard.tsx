"use client";

import Link from "next/link";
import {
  Activity,
  Brain,
  CheckCircle2,
  ClipboardList,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  DashboardSummary,
  StudentPendingQuestionnaire,
} from "@/lib/dashboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartFrame,
  ResponsiveChartContainer,
} from "@/components/ui/chart-frame";
import { cn } from "@/lib/utils";

type StudentSummaryData = NonNullable<
  Extract<DashboardSummary, { variant: "student" }>["studentSummary"]
>;
type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

interface StudentDashboardContentProps {
  greeting: string;
  locale: string;
  student: StudentSummaryData;
  t: Translate;
  questionnaires: Translate;
}

const QUESTIONNAIRE_META: Record<
  "KIDMED" | "AUTOCONCEITO" | "AUTOESTIMA",
  {
    icon: LucideIcon;
    bg: string;
    color: string;
    descKey: string;
  }
> = {
  KIDMED: {
    icon: ClipboardList,
    bg: "bg-gold-500/10",
    color: "text-gold-700 dark:text-gold-300",
    descKey: "kidmedDesc",
  },
  AUTOCONCEITO: {
    icon: Brain,
    bg: "bg-navy-100 dark:bg-white/8",
    color: "text-navy-700 dark:text-navy-200",
    descKey: "autoconceitoDesc",
  },
  AUTOESTIMA: {
    icon: Heart,
    bg: "bg-success-500/10",
    color: "text-success-700 dark:text-success-300",
    descKey: "autoestimaDesc",
  },
};

function ordinalSuffix(n: number): string {
  const s = n % 100;
  if (s >= 11 && s <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function getBellCurveX(z: number): number {
  return Math.min(475, Math.max(45, Math.round(40 + ((z + 3) / 6) * 440)));
}

function getBellCurveY(cx: number): number {
  const pts: [number, number][] = [
    [40, 100],
    [90, 99],
    [140, 88],
    [190, 68],
    [230, 35],
    [250, 18],
    [260, 14],
    [270, 18],
    [290, 35],
    [330, 68],
    [380, 88],
    [430, 99],
    [480, 100],
  ];
  if (cx <= pts[0][0]) return pts[0][1];
  if (cx >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    if (cx >= pts[i][0] && cx <= pts[i + 1][0]) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      return Math.round(y0 + ((cx - x0) / (x1 - x0)) * (y1 - y0));
    }
  }
  return 50;
}

export function StudentDashboardContent({
  greeting,
  locale: _locale,
  student,
  t,
  questionnaires,
}: StudentDashboardContentProps) {
  return (
    <div className="grid gap-5">
      <StudentHeroCard greeting={greeting} student={student} t={t} />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <HealthProgressChart student={student} t={t} />
          <PendingTasksPanel
            pending={student.pendingQuestionnaires ?? []}
            questionnaires={questionnaires}
            t={t}
          />
        </div>
        <div className="space-y-5">
          <BellCurvePosition student={student} t={t} />
          <CurrentHealthStatus student={student} t={t} />
        </div>
      </div>
    </div>
  );
}

function StudentHeroCard({
  greeting,
  student,
  t,
}: {
  greeting: string;
  student: StudentSummaryData;
  t: Translate;
}) {
  const isHealthy = student.latestBiometric?.imcZone === "Zona Saud\u00e1vel";
  const hasAlert = student.openSos > 0;
  const metaParts = [
    student.schoolYear,
    student.className,
    student.processNumber ? `#${student.processNumber}` : null,
  ].filter(Boolean);

  return (
    <Card className="relative overflow-hidden border-0 shadow-[0_4px_12px_rgba(9,21,35,0.08)]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-gold-600/5" />
      <CardContent className="relative p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{greeting}</p>
            <h1 className="mt-0.5 truncate text-2xl font-bold tracking-tight text-foreground md:text-[28px]">
              {student.name}
            </h1>
            {metaParts.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {metaParts.join(" \u2022 ")}
              </p>
            )}
          </div>
          {hasAlert ? (
            <Badge
              variant="danger"
              size="md"
              className="shrink-0 self-start sm:self-center"
            >
              {t("activeStudentSos")}
            </Badge>
          ) : student.latestBiometric ? (
            <Badge
              variant={isHealthy ? "success" : "warning"}
              size="md"
              className="shrink-0 self-start sm:self-center"
            >
              {isHealthy ? t("studentHealthy") : t("studentAtRisk")}
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function HealthProgressChart({
  student,
  t,
}: {
  student: StudentSummaryData;
  t: Translate;
}) {
  const [period, setPeriod] = useState<"6m" | "1y">("6m");
  const trend = student.biometricTrend ?? [];
  const data =
    period === "6m" && trend.length > 4
      ? trend.slice(trend.length - 4)
      : trend;

  return (
    <Card className="shadow-[0_4px_12px_rgba(9,21,35,0.08)]">
      <CardContent className="p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {t("studentHealthProgress")}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("studentGrowthSubtitle")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setPeriod("6m")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                period === "6m"
                  ? "bg-gold-100 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t("student6Months")}
            </button>
            <button
              onClick={() => setPeriod("1y")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                period === "1y"
                  ? "bg-gold-100 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t("student1Year")}
            </button>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
            <Activity className="size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {t("studentNoBiometrics")}
            </p>
            <p className="text-xs text-muted-foreground/60">
              {t("studentNoBiometricsDesc")}
            </p>
          </div>
        ) : (
          <>
            <ChartFrame className="h-56 md:h-64">
              <ResponsiveChartContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="currentColor"
                    strokeOpacity={0.05}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, opacity: 0.55 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="weight"
                    orientation="left"
                    tick={{ fontSize: 11, opacity: 0.55 }}
                    tickLine={false}
                    axisLine={false}
                    domain={["auto", "auto"]}
                  />
                  <YAxis
                    yAxisId="height"
                    orientation="right"
                    tick={{ fontSize: 11, opacity: 0.55 }}
                    tickLine={false}
                    axisLine={false}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card, #fff)",
                      border: "1px solid var(--color-border, #e5e7eb)",
                      borderRadius: "12px",
                      fontSize: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Line
                    yAxisId="weight"
                    type="monotone"
                    dataKey="weightKg"
                    name={t("studentWeightLabel")}
                    stroke="#b88c19"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#fff", strokeWidth: 2, stroke: "#b88c19" }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="height"
                    type="monotone"
                    dataKey="heightCm"
                    name={t("studentHeightLabel")}
                    stroke="#1a3654"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#fff", strokeWidth: 2, stroke: "#1a3654" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveChartContainer>
            </ChartFrame>
            <div className="mt-3 flex justify-end gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-3 rounded-full bg-[#b88c19]" />
                <span className="text-xs text-muted-foreground">
                  {t("studentWeightLabel")}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-3 rounded-full bg-[#1a3654]" />
                <span className="text-xs text-muted-foreground">
                  {t("studentHeightLabel")}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PendingTasksPanel({
  pending,
  questionnaires,
  t,
}: {
  pending: StudentPendingQuestionnaire[];
  questionnaires: Translate;
  t: Translate;
}) {
  return (
    <Card className="shadow-[0_4px_12px_rgba(9,21,35,0.08)]">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">
            {t("studentPendingTasks")}
          </h3>
          {pending.length > 0 && (
            <span className="rounded-full bg-danger-500/10 px-2.5 py-1 text-[10px] font-semibold text-danger-700 dark:text-danger-300">
              {pending.length} {t("studentPending")}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <CheckCircle2 className="size-8 text-success-500/60" />
            <p className="text-sm font-medium text-foreground">
              {t("studentNoPendingTasks")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("studentNoPendingDesc")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((item) => {
              const meta =
                QUESTIONNAIRE_META[
                  item.type as "KIDMED" | "AUTOCONCEITO" | "AUTOESTIMA"
                ];
              const Icon = meta?.icon ?? ClipboardList;
              return (
                <div
                  key={item.type}
                  className="group rounded-xl border border-border/60 p-4 transition-all hover:border-gold-300/50 hover:shadow-[0_4px_12px_rgba(9,21,35,0.06)]"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-xl",
                        meta?.bg ?? "bg-muted",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-5",
                          meta?.color ?? "text-muted-foreground",
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">
                          {questionnaires(item.type.toLowerCase())}
                        </h4>
                        <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold text-gold-700 dark:bg-gold-400/15 dark:text-gold-300">
                          {t("studentDueSoon")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {meta ? questionnaires(meta.descKey) : null} &bull;{" "}
                        {t("studentQuestionCount", { count: item.questionCount })}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full w-0 rounded-full bg-gold-500" />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          0%
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/questionarios"
                      className="shrink-0 rounded-xl bg-gold-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-navy-800 dark:bg-gold-500 dark:hover:bg-gold-400"
                    >
                      {t("studentStart")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BellCurvePosition({
  student,
  t,
}: {
  student: StudentSummaryData;
  t: Translate;
}) {
  const z =
    typeof student.bmiZScore === "number" && Number.isFinite(student.bmiZScore)
      ? student.bmiZScore
      : null;
  const pct =
    typeof student.percentile === "number" && Number.isFinite(student.percentile)
      ? student.percentile
      : null;
  const dotCx = z !== null ? getBellCurveX(z) : null;
  const dotCy = dotCx !== null ? getBellCurveY(dotCx) : null;
  const isHealthy =
    (student.latestBiometric?.imcZone ?? "") === "Zona Saud\u00e1vel";

  return (
    <Card className="shadow-[0_4px_12px_rgba(9,21,35,0.08)]">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {t("studentYourPosition")}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("studentComparedWHO")}
            </p>
          </div>
          {pct !== null && (
            <Badge variant={isHealthy ? "success" : "warning"} size="sm">
              {ordinalSuffix(pct)} {t("studentPercentile")}
            </Badge>
          )}
        </div>

        <svg
          viewBox="0 0 500 110"
          className="w-full"
          aria-hidden="true"
          overflow="visible"
        >
          <defs>
            <linearGradient id="sdBellGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10243a" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#10243a" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient
              id="sdHealthyGrad"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#b88c19" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#b88c19" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Healthy zone shading */}
          <path
            d="M187,100 Q210,78 230,35 Q250,18 260,14 Q270,18 290,35 Q313,65 333,100 Z"
            fill="url(#sdHealthyGrad)"
          />

          {/* Full area under curve */}
          <path
            d="M40,100 Q90,98 140,88 Q190,68 230,35 Q250,18 260,14 Q270,18 290,35 Q330,68 380,88 Q430,98 480,100 L480,100 L40,100 Z"
            fill="url(#sdBellGrad)"
          />

          {/* Curve outline */}
          <path
            d="M40,100 Q90,98 140,88 Q190,68 230,35 Q250,18 260,14 Q270,18 290,35 Q330,68 380,88 Q430,98 480,100"
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeWidth={2}
          />

          {/* Student dot */}
          {dotCx !== null && dotCy !== null ? (
            <>
              <line
                x1={dotCx}
                y1={dotCy + 6}
                x2={dotCx}
                y2={100}
                stroke="#b88c19"
                strokeOpacity={0.35}
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />
              <circle
                cx={dotCx}
                cy={dotCy}
                r={9}
                fill="#b88c19"
                fillOpacity={0.15}
              />
              <circle cx={dotCx} cy={dotCy} r={4.5} fill="#b88c19" />
            </>
          ) : (
            <circle cx={260} cy={14} r={5} fill="#94a3b8" fillOpacity={0.4} />
          )}
        </svg>

        <div className="mt-2 flex justify-between border-t border-border/40 pt-2">
          <span className="text-[10px] text-muted-foreground">
            {t("studentLowWeight")}
          </span>
          <span className="text-[10px] font-semibold text-gold-700 dark:text-gold-300">
            {t("studentHealthyZone")}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {t("studentHighWeight")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function CurrentHealthStatus({
  student,
  t,
}: {
  student: StudentSummaryData;
  t: Translate;
}) {
  const bio = student.latestBiometric;
  const isHealthy = bio?.imcZone === "Zona Saud\u00e1vel";
  const fitnessGood = (student.fitnessScore ?? 0) >= 60;

  if (!bio) {
    return (
      <Card className="shadow-[0_4px_12px_rgba(9,21,35,0.08)]">
        <CardContent className="flex flex-col items-center justify-center gap-2 p-6 py-10 text-center">
          <Activity className="size-8 text-muted-foreground/30" />
          <p className="text-sm font-medium text-foreground">
            {t("studentNoBiometrics")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("studentNoBiometricsDesc")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-[0_4px_12px_rgba(9,21,35,0.08)]">
      <CardContent className="p-6">
        <h3 className="mb-4 text-lg font-bold text-foreground">
          {t("studentCurrentHealth")}
        </h3>
        <div className="space-y-2.5">
          <HealthMetricRow
            label={t("studentBMI")}
            value={bio.imc.toFixed(1)}
            badge={
              <Badge variant={isHealthy ? "success" : "warning"} size="sm">
                {isHealthy ? t("studentNormal") : t("studentAtRisk")}
              </Badge>
            }
          />
          <HealthMetricRow
            label={t("studentHeight")}
            value={`${bio.heightCm} cm`}
            delta={
              bio.heightDelta !== null
                ? { value: bio.heightDelta, unit: "cm" }
                : undefined
            }
          />
          <HealthMetricRow
            label={t("studentWeight")}
            value={`${bio.weightKg.toFixed(1)} kg`}
            delta={
              bio.weightDelta !== null
                ? { value: bio.weightDelta, unit: "kg" }
                : undefined
            }
          />
          {student.bmiZScore !== null && (
            <HealthMetricRow
              label={t("studentZScore")}
              value={
                student.bmiZScore >= 0
                  ? `+${student.bmiZScore.toFixed(2)}`
                  : student.bmiZScore.toFixed(2)
              }
              badge={
                student.percentile !== null ? (
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {ordinalSuffix(student.percentile)} pct
                  </span>
                ) : undefined
              }
            />
          )}
          <HealthMetricRow
            label={t("studentFitnessScore")}
            value={
              student.fitnessScore !== null
                ? `${student.fitnessScore}/100`
                : "—"
            }
            badge={
              student.fitnessScore !== null ? (
                <Badge
                  variant={fitnessGood ? "success" : "warning"}
                  size="sm"
                >
                  {fitnessGood ? t("studentGood") : t("studentAtRisk")}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t("studentNoTests")}
                </span>
              )
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function HealthMetricRow({
  badge,
  delta,
  label,
  value,
}: {
  label: string;
  value: string;
  delta?: { value: number; unit: string };
  badge?: ReactNode;
}) {
  const deltaPositive = delta && delta.value > 0;
  const deltaNeutral = delta && delta.value === 0;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{value}</span>
        {delta && !deltaNeutral && (
          <span
            className={cn(
              "text-[10px] font-semibold",
              deltaPositive
                ? "text-success-600 dark:text-success-400"
                : "text-muted-foreground",
            )}
          >
            {deltaPositive ? "+" : ""}
            {delta.value} {delta.unit}
          </span>
        )}
        {badge}
      </div>
    </div>
  );
}
