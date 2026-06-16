"use client";

// Componente cliente de /analise: carrega alunos, métricas e relatórios por
// turma para comparar indicadores de saúde e aptidão física.

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  CheckCircle2,
  LineChart as ChartIcon,
  Mail,
  Ruler,
  Scale,
  Send,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, interactiveControlClasses } from "@/components/ui/button";
import {
  ChartFrame,
  ResponsiveChartContainer,
} from "@/components/ui/chart-frame";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { ClassPicker } from "@/components/ui/class-picker";
import { EmptyState } from "@/components/ui/empty-state";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { StudentPicker } from "@/components/ui/student-picker";
import { useReducedEffects } from "@/hooks/use-reduced-effects";
import { useUser } from "@/components/user-context";
import { useClasses } from "@/hooks/use-queries";
import { readApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type AnalysisMode = "student" | "class";
type StudentLens = "height" | "weight" | "bmi" | "tests";

type StudentOption = {
  id: string;
  name: string;
  className?: string | null;
};

type BioHistoryPoint = {
  label: string;
  recordedAt: string;
  imc: number;
  height: number;
  weight: number;
};

type TestHistoryPoint = {
  label: string;
  recordedAt: string;
  [key: string]: string | number;
};

type ClassReportItem = {
  latestBiometric: { imc: number | string; imcZone: string } | null;
};

type ClassSummary = {
  name: string;
  healthy: number;
  improvement: number;
  noData: number;
  total: number;
};

type ClassEmailSummary = {
  students: number;
  sent: number;
  failed: number;
  skippedNoGuardian: number;
  firstError: string | null;
};

type BioApiRecord = {
  recordedAt: string;
  imc: number | string;
  heightM: number | string;
  weightKg: number | string;
};

type TestApiRecord = {
  testId: string;
  valueNum: number | null;
  recordedAt: string;
};

type BioSeriesMeta = {
  title: string;
  description: string;
  dataKey: "height" | "weight" | "imc";
  stroke: string;
  gradientId: string;
  unit?: string;
};

function sectionAnimation(index: number, re: boolean) {
  if (re) return {};
  return { animationDelay: `${index * 70}ms` };
}

function BioPanel({ children, className, index, reducedEffects }: { children: React.ReactNode; className?: string; index: number; reducedEffects: boolean }) {
  return (
    <section style={sectionAnimation(index, reducedEffects)} className={cn("relative overflow-hidden rounded-[12px] border border-border bg-card/88 shadow-[0_4px_12px_rgba(9,21,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-navy-950/68 dark:shadow-[0_4px_18px_rgba(0,0,0,0.22)]", !reducedEffects && "animate-fade-in-up opacity-0", className)}>
      <div className="relative">{children}</div>
    </section>
  );
}

const TEST_ORDER = [
  "vai",
  "vaivem",
  "cooper",
  "milha",
  "abd",
  "abdominais",
  "bracos",
  "extensoes",
  "velocidade",
  "agilidade",
  "senta",
  "senta_alcanca",
];

const TEST_COLORS = ["#0f766e", "#1d4ed8", "#d97706", "#7c3aed"];

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function formatAxisDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function formatStatusDate(value: string | null, locale: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getTestLabel(
  testId: string,
  t: ReturnType<typeof useTranslations>,
  protocolos: ReturnType<typeof useTranslations>,
) {
  const key = testId.toLowerCase();

  if (key === "vai" || key === "vaivem") return t("barVaiVem");
  if (key === "abd" || key === "abdominais") return t("barAbdominais");
  if (key === "bracos" || key === "extensoes") return t("barExtensoes");
  if (key === "cooper") return protocolos("testCooper");
  if (key === "milha") return protocolos("testMilha");
  if (key === "velocidade") return protocolos("testVelocidade");
  if (key === "agilidade") return protocolos("testAgilidade");
  if (key === "senta" || key === "senta_alcanca") {
    return protocolos("testSentaAlcanca");
  }

  return testId;
}

export default function AnaliseClient() {
  const t = useTranslations("analise");
  const common = useTranslations("common");
  const protocolos = useTranslations("protocolos");
  const locale = useLocale();
  const { role } = useUser();

  const canViewAnalysis = role === "ADMIN" || role === "PROFESSOR";
  const reducedEffects = useReducedEffects();

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [mode, setMode] = useState<AnalysisMode>("student");
  const [lens, setLens] = useState<StudentLens>("height");
  const [bioData, setBioData] = useState<BioHistoryPoint[]>([]);
  const [testData, setTestData] = useState<TestHistoryPoint[]>([]);
  const [classId, setClassId] = useState("");
  const [classSummary, setClassSummary] = useState<ClassSummary | null>(null);
  const [loadingClassSummary, setLoadingClassSummary] = useState(false);
  const [sendingClassReports, setSendingClassReports] = useState(false);
  const [classEmailSummary, setClassEmailSummary] =
    useState<ClassEmailSummary | null>(null);
  const { data: classes = [] } = useClasses({ enabled: canViewAnalysis });

  useEffect(() => {
    if (!canViewAnalysis) {
      return;
    }

    let active = true;
    setLoadingStudents(true);

    void (async () => {
      try {
        const response = await fetch("/api/students?limit=500");
        const body = await readApiResponse<{ students: StudentOption[] }>(
          response,
        );

        if (!active) {
          return;
        }

        setStudents(
          body.students.map((student) => ({
            id: student.id,
            name: student.name,
            className: student.className ?? null,
          })),
        );
      } catch {
        if (!active) {
          return;
        }

        toast.error(common("studentListLoadError"));
        setStudents([]);
        setStudentId(null);
      } finally {
        if (active) {
          setLoadingStudents(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [canViewAnalysis, common]);

  useEffect(() => {
    if (!canViewAnalysis || loadingStudents || students.length === 0) {
      return;
    }

    setStudentId((current) => {
      if (current && students.some((student) => student.id === current)) {
        return current;
      }

      return students[0].id;
    });
  }, [canViewAnalysis, loadingStudents, students]);

  useEffect(() => {
    if (!canViewAnalysis || classes.length === 0) {
      return;
    }

    setClassId((current) => {
      if (current && classes.some((item) => item.id === current)) {
        return current;
      }

      return classes[0].id;
    });
  }, [canViewAnalysis, classes]);

  useEffect(() => {
    if (!studentId) {
      setBioData([]);
      setTestData([]);
      return;
    }

    let active = true;

    void (async () => {
      const [bioResponse, testsResponse] = await Promise.all([
        fetch(`/api/students/${studentId}/biometrics`),
        fetch(`/api/students/${studentId}/tests`),
      ]);

      if (!active) {
        return;
      }

      try {
        const body = await readApiResponse<BioApiRecord[]>(bioResponse);
        if (!active) {
          return;
        }

        setBioData(
          body
            .map((entry) => ({
              label: formatAxisDate(entry.recordedAt, locale),
              recordedAt: entry.recordedAt,
              imc: toNumber(entry.imc),
              height: toNumber(entry.heightM) * 100,
              weight: toNumber(entry.weightKg),
            }))
            .reverse(),
        );
      } catch {
        if (active) {
          setBioData([]);
        }
      }

      try {
        const body = await readApiResponse<TestApiRecord[]>(testsResponse);
        if (!active) {
          return;
        }

        const grouped = new Map<string, TestHistoryPoint>();

        for (const test of body) {
          const dayKey = new Date(test.recordedAt).toISOString().slice(0, 10);

          if (!grouped.has(dayKey)) {
            grouped.set(dayKey, {
              label: formatAxisDate(test.recordedAt, locale),
              recordedAt: test.recordedAt,
            });
          }

          grouped.get(dayKey)![test.testId] = test.valueNum ?? 0;
        }

        setTestData(Array.from(grouped.values()).reverse());
      } catch {
        if (active) {
          setTestData([]);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [locale, studentId]);

  useEffect(() => {
    if (mode !== "class" || !classId) {
      setClassSummary(null);
      setLoadingClassSummary(false);
      return;
    }

    let active = true;
    setLoadingClassSummary(true);

    void (async () => {
      try {
        const response = await fetch(
          `/api/classes/report?classId=${encodeURIComponent(classId)}`,
        );
        const body = await readApiResponse<ClassReportItem[]>(response);

        if (!active) {
          return;
        }

        let healthy = 0;
        let improvement = 0;
        let noData = 0;

        for (const student of body) {
          const zone = student.latestBiometric?.imcZone ?? "";

          if (zone.toLowerCase().includes("saud") || zone === "ZSAF") {
            healthy += 1;
          } else if (zone) {
            improvement += 1;
          } else {
            noData += 1;
          }
        }

        const selectedClass = classes.find((item) => item.id === classId);

        setClassSummary({
          name: selectedClass?.name ?? t("chartClass"),
          healthy,
          improvement,
          noData,
          total: body.length,
        });
      } catch {
        if (active) {
          setClassSummary(null);
        }
      } finally {
        if (active) {
          setLoadingClassSummary(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [classId, classes, mode, t]);

  const currentStudent = students.find((student) => student.id === studentId);
  const currentClass = classes.find((item) => item.id === classId);
  const isClassMode = mode === "class";
  const activeBioSeries: BioSeriesMeta | null =
    lens === "height"
      ? {
          title: t("chartHeight"),
          description: t("chartHeightDescription"),
          dataKey: "height",
          stroke: "#0f9f6e",
          gradientId: "analysis-height",
          unit: "cm",
        }
      : lens === "weight"
        ? {
            title: t("chartWeight"),
            description: t("chartWeightDescription"),
            dataKey: "weight",
            stroke: "#2563eb",
            gradientId: "analysis-weight",
            unit: "kg",
          }
        : lens === "bmi"
          ? {
              title: t("chartBmi"),
              description: t("chartBmiDescription"),
              dataKey: "imc",
              stroke: "#d4a11e",
              gradientId: "analysis-bmi",
            }
          : null;

  const modeOptions = [
    {
      value: "student",
      label: t("modeStudentTitle"),
      icon: <ChartIcon className="size-4" />,
    },
    {
      value: "class",
      label: t("modeClassTitle"),
      icon: <Users className="size-4" />,
    },
  ] satisfies {
    value: AnalysisMode;
    label: string;
    icon: React.ReactNode;
  }[];

  const lensOptions = [
    { value: "height", label: t("chartHeight"), icon: <Ruler className="size-4" /> },
    { value: "weight", label: t("chartWeight"), icon: <Scale className="size-4" /> },
    { value: "bmi", label: t("chartBmi"), icon: <Activity className="size-4" /> },
    { value: "tests", label: t("chartTests"), icon: <CheckCircle2 className="size-4" /> },
  ] satisfies {
    value: StudentLens;
    label: string;
    icon: React.ReactNode;
  }[];

  const testSeriesKeys = Array.from(
    new Set(
      testData.flatMap((row) =>
        Object.keys(row).filter((key) => key !== "label" && key !== "recordedAt"),
      ),
    ),
  );

  const orderedTestKeys = [
    ...TEST_ORDER.filter((key) => testSeriesKeys.includes(key)),
    ...testSeriesKeys.filter((key) => !TEST_ORDER.includes(key)),
  ].slice(0, 4);

  const testSeries = orderedTestKeys.map((key, index) => ({
    key,
    label: getTestLabel(key, t, protocolos),
    color: TEST_COLORS[index % TEST_COLORS.length],
  }));

  const bioAxisDomain = (() => {
    if (!activeBioSeries || bioData.length === 0) {
      return undefined;
    }

    const values = bioData.map((point) => point[activeBioSeries.dataKey]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding =
      activeBioSeries.dataKey === "height"
        ? 2
        : activeBioSeries.dataKey === "weight"
          ? 1.5
          : 0.6;

    return [Math.max(0, min - padding), max + padding] as [number, number];
  })();

  const studentHistoryCount = bioData.length;
  const testSessionCount = testData.length;
  const latestBioPoint = bioData.at(-1) ?? null;
  const latestTestPoint = testData.at(-1) ?? null;
  const studentModeHasData =
    lens === "tests" ? testSessionCount > 0 : studentHistoryCount > 0;
  const scopeValue = isClassMode
    ? (currentClass?.name ?? t("currentScopePendingClass"))
    : (currentStudent?.name ?? t("currentScopePendingStudent"));
  const scopeSupport = isClassMode
    ? (currentClass?.year ?? t("noClassSelected"))
    : (currentStudent?.className ?? t("noStudentSelected"));
  const latestBioValue =
    formatStatusDate(latestBioPoint?.recordedAt ?? null, locale) ??
    common("noData");
  const latestTestValue =
    formatStatusDate(latestTestPoint?.recordedAt ?? null, locale) ??
    common("noData");
  const classWithDataCount = Math.max(
    0,
    (classSummary?.healthy ?? 0) + (classSummary?.improvement ?? 0),
  );
  const classCoveragePct =
    classSummary && classSummary.total > 0
      ? Math.round((classWithDataCount / classSummary.total) * 100)
      : 0;
  const studentSummaryTiles = useMemo(
    () => [
      {
        label: t("currentScope"),
        value: scopeValue,
        support: scopeSupport,
      },
      {
        label: t("latestRecord"),
        value: latestBioValue,
        support: t("biometricRecords"),
      },
      {
        label: t("latestSession"),
        value: latestTestValue,
        support: t("testSessions"),
      },
    ],
    [latestBioValue, latestTestValue, scopeSupport, scopeValue, t],
  );
  const classSummaryTiles = useMemo(
    () => [
      {
        label: t("currentScope"),
        value: scopeValue,
        support: scopeSupport,
      },
      {
        label: t("recordsTracked"),
        value: String(classSummary?.total ?? 0),
        support: t("studentsTracked"),
      },
    ],
    [classSummary?.total, scopeSupport, scopeValue, t],
  );

  const handleSendClassReports = async () => {
    if (!classId) {
      toast.error(t("noClassSelected"));
      return;
    }

    setSendingClassReports(true);
    setClassEmailSummary(null);

    try {
      const response = await fetch("/api/classes/reports/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          title: t("classEmailDefaultTitle"),
        }),
      });
      const result = await readApiResponse<ClassEmailSummary>(response);

      setClassEmailSummary(result);

      if (result.sent > 0 && result.failed === 0) {
        toast.success(t("classEmailSuccess", { count: result.sent }));
      } else if (result.sent > 0) {
        toast.warning(
          t("classEmailPartial", {
            sent: result.sent,
            failed: result.failed,
          }),
        );
      } else if (result.skippedNoGuardian > 0 && result.failed === 0) {
        toast.warning(t("classEmailNoGuardians"));
      } else {
        toast.error(result.firstError ?? t("classEmailNoneSent"));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("classEmailError"),
      );
    } finally {
      setSendingClassReports(false);
    }
  };

  if (!canViewAnalysis) {
    return (
      <PageScaffold
        headerProps={{
          eyebrow: t("eyebrow"),
          title: t("title"),
          description: t("description"),
        }}
      >
        <EmptyState
          icon={ShieldAlert}
          title={common("noPermission")}
          description={t("description")}
        />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      headerProps={{
        eyebrow: t("eyebrow"),
        title: t("title"),
        description: t("description"),
      }}
    >
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.08fr)_360px]">
        <div className="space-y-5">
          <BioPanel index={0} reducedEffects={reducedEffects} className="p-5">
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,360px)] lg:items-end">
                <div className="space-y-2">
                  <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("readingMode")}
                  </p>
                  <AnalysisControlGroup
                    options={modeOptions}
                    value={mode}
                    onChange={setMode}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {isClassMode
                      ? t("classSelectionLabel")
                      : t("studentSelectionLabel")}
                  </p>
                  {isClassMode ? (
                    classes.length > 0 ? (
                      <ClassPicker
                        classes={classes}
                        value={classId}
                        onChange={(value) => {
                          setClassId(value);
                          setClassSummary(null);
                          setClassEmailSummary(null);
                        }}
                        placeholder={t("classSelectionLabel")}
                        className="w-full"
                      />
                    ) : (
                      <div className="rounded-[12px] border border-dashed border-border/80 bg-background/55 px-4 py-3 text-sm text-muted-foreground">
                        {t("noClassesAvailableDescription")}
                      </div>
                    )
                  ) : (
                    <StudentPicker
                      students={students}
                      value={studentId}
                      onChange={setStudentId}
                      loading={loadingStudents}
                    />
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "grid gap-3",
                  isClassMode ? "sm:grid-cols-2" : "sm:grid-cols-3",
                )}
              >
                {(isClassMode ? classSummaryTiles : studentSummaryTiles).map(
                  (tile) => (
                    <AnalysisSummaryTile
                      key={tile.label}
                      label={tile.label}
                      value={tile.value}
                      support={tile.support}
                    />
                  ),
                )}
              </div>
            </div>
          </BioPanel>

          <BioPanel index={1} reducedEffects={reducedEffects} className="overflow-hidden p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{isClassMode ? t("classSnapshotTitle") : t("studentSnapshotTitle")}</p>
                <h3 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">{isClassMode ? (currentClass?.name ?? t("distributionCurrent")) : lens === "tests" ? t("chartTests") : (activeBioSeries?.title ?? t("chartBmi"))}</h3>
              </div>
              {!isClassMode && <AnalysisControlGroup options={lensOptions} value={lens} onChange={setLens} align="end" />}
            </div>
            {isClassMode ? (
              classes.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title={t("noClassesAvailableTitle")}
                  description={t("noClassesAvailableDescription")}
                />
              ) : !classId ? (
                <EmptyState
                  icon={Users}
                  title={t("noClassSelected")}
                  description={t("noClassSelectedDesc")}
                />
              ) : loadingClassSummary ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-24 animate-pulse rounded-[12px] bg-muted/30"
                    />
                  ))}
                </div>
              ) : classSummary ? (
                <ClassDistributionCard
                  title={t("distributionCurrent")}
                  total={classSummary.total}
                  healthy={classSummary.healthy}
                  improvement={classSummary.improvement}
                  noData={classSummary.noData}
                  healthyLabel={t("healthyZone")}
                  improvementLabel={t("improvementZone")}
                  noDataLabel={t("noDataLabel")}
                />
              ) : (
                <EmptyState
                  icon={ChartIcon}
                  title={t("emptyClassDataTitle")}
                  description={t("emptyClassDataDescription")}
                />
              )
            ) : !studentId ? (
              <EmptyState
                icon={ChartIcon}
                title={t("noStudentSelected")}
                description={t("noStudentSelectedDesc")}
              />
            ) : lens === "tests" ? (
              testSessionCount > 0 && testSeries.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {testSeries.map((series) => (
                      <Badge key={series.key} variant="info" size="md">
                        {series.label}
                      </Badge>
                    ))}
                    <Badge variant="default" size="md">
                      {t("recordsTracked")}: {testSessionCount}
                    </Badge>
                  </div>
                  <ChartFrame className="h-[360px] w-full">
                    <ResponsiveChartContainer width="100%" height="100%">
                      <BarChart
                        data={testData}
                        margin={{ top: 8, right: 8, left: -12, bottom: 8 }}
                        barGap={10}
                        barSize={28}
                      >
                        <CartesianGrid
                          strokeDasharray="4 4"
                          stroke="rgba(9,21,35,0.08)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          dy={10}
                          tick={{ fill: "#5f6d7b", fontSize: 12, fontWeight: 600 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          dx={-8}
                          tick={{ fill: "#5f6d7b", fontSize: 12, fontWeight: 600 }}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(9,21,35,0.03)" }} />
                        {testSeries.map((series) => (
                          <Bar
                            key={series.key}
                            dataKey={series.key}
                            name={series.label}
                            fill={series.color}
                            radius={[8, 8, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveChartContainer>
                  </ChartFrame>
                </div>
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title={t("emptyTestsDataTitle")}
                  description={t("emptyTestsDataDescription")}
                />
              )
            ) : studentModeHasData && activeBioSeries ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="info" size="md">
                    {t("currentLens")}: {activeBioSeries.title}
                  </Badge>
                  <Badge variant="default" size="md">
                    {t("recordsTracked")}: {studentHistoryCount}
                  </Badge>
                  <Badge variant="default" size="md">
                    {t("latestRecord")}:{" "}
                    {formatStatusDate(latestBioPoint?.recordedAt ?? null, locale) ??
                      common("noData")}
                  </Badge>
                </div>
                <ChartFrame className="h-[360px] w-full">
                  <ResponsiveChartContainer width="100%" height="100%">
                    <AreaChart
                      data={bioData}
                      margin={{ top: 8, right: 8, left: -12, bottom: 8 }}
                    >
                      <defs>
                        <linearGradient
                          id={activeBioSeries.gradientId}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={activeBioSeries.stroke}
                            stopOpacity={0.28}
                          />
                          <stop
                            offset="95%"
                            stopColor={activeBioSeries.stroke}
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke="rgba(9,21,35,0.08)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        tick={{ fill: "#5f6d7b", fontSize: 12, fontWeight: 600 }}
                      />
                      <YAxis
                        domain={bioAxisDomain}
                        axisLine={false}
                        tickLine={false}
                        dx={-8}
                        tick={{ fill: "#5f6d7b", fontSize: 12, fontWeight: 600 }}
                        tickFormatter={
                          activeBioSeries.unit
                            ? (value) => `${value}${activeBioSeries.unit}`
                            : undefined
                        }
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey={activeBioSeries.dataKey}
                        name={activeBioSeries.title}
                        stroke={activeBioSeries.stroke}
                        strokeWidth={3}
                        fill={`url(#${activeBioSeries.gradientId})`}
                        activeDot={{
                          r: 5,
                          fill: activeBioSeries.stroke,
                          strokeWidth: 0,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveChartContainer>
                </ChartFrame>
              </div>
            ) : (
              <EmptyState
                icon={Activity}
                title={t("emptyStudentDataTitle")}
                description={t("emptyStudentDataDescription")}
              />
            )}
          </BioPanel>
        </div>

        <BioPanel index={2} reducedEffects={reducedEffects} className="p-5 xl:sticky xl:top-24">
          {isClassMode ? (
            classes.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t("noClassesAvailableTitle")}
                description={t("noClassesAvailableDescription")}
              />
            ) : !classId ? (
              <EmptyState
                icon={Users}
                title={t("noClassSelected")}
                description={t("noClassSelectedDesc")}
              />
            ) : classSummary ? (
              <div className="space-y-4">
                <AnalysisMetricTile
                  label={t("currentScope")}
                  value={scopeValue}
                  support={scopeSupport}
                  tone="info"
                />
                <AnalysisMetricTile
                  label={t("dataCoverage")}
                  value={`${classWithDataCount}/${classSummary.total}`}
                  support={`${classCoveragePct}% ${t("withData")}`}
                  tone="success"
                />
                <div className="rounded-3xl border border-border/70 bg-background/75 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gold-100 text-gold-700 dark:bg-gold-500/10 dark:text-gold-300">
                      <Mail className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-foreground">
                        {t("classEmailTitle")}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {t("classEmailDescription")}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="mt-4 h-12 w-full justify-center"
                    icon={<Send className="size-4" />}
                    loading={sendingClassReports}
                    onClick={handleSendClassReports}
                    disabled={!classId || classSummary.total === 0}
                  >
                    {t("classEmailButton")}
                  </Button>

                  {classEmailSummary ? (
                    <div className="mt-4 rounded-2xl border border-border/70 bg-surface-secondary px-4 py-3 text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground">
                        {t("classEmailSummaryTitle")}
                      </p>
                      <p className="mt-1">
                        {t("classEmailSummary", {
                          sent: classEmailSummary.sent,
                          failed: classEmailSummary.failed,
                          skipped: classEmailSummary.skippedNoGuardian,
                        })}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={ChartIcon}
                title={t("emptyClassDataTitle")}
                description={t("emptyClassDataDescription")}
              />
            )
          ) : !studentId ? (
            <EmptyState
              icon={ChartIcon}
              title={t("noStudentSelected")}
              description={t("noStudentSelectedDesc")}
            />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <AnalysisMetricTile
                  label={t("biometricRecords")}
                  value={String(studentHistoryCount)}
                  support={latestBioValue}
                  tone={studentHistoryCount > 0 ? "success" : "default"}
                />
                <AnalysisMetricTile
                  label={t("testSessions")}
                  value={String(testSessionCount)}
                  support={latestTestValue}
                  tone={testSessionCount > 0 ? "info" : "default"}
                />
              </div>
              {latestBioPoint ? (
                <div className="grid gap-3">
                  <AnalysisMetricTile
                    label={t("chartHeight")}
                    value={`${latestBioPoint.height.toFixed(1)} cm`}
                    support={t("latestRecord")}
                    tone="default"
                  />
                  <AnalysisMetricTile
                    label={t("chartWeight")}
                    value={`${latestBioPoint.weight.toFixed(1)} kg`}
                    support={t("latestRecord")}
                    tone="default"
                  />
                  <AnalysisMetricTile
                    label={t("chartBmi")}
                    value={latestBioPoint.imc.toFixed(1)}
                    support={t("latestRecord")}
                    tone="warning"
                  />
                </div>
              ) : (
                <div className="rounded-[12px] border border-dashed border-border/80 bg-background/55 px-4 py-5 text-sm leading-relaxed text-muted-foreground">
                  {lens === "tests"
                    ? t("emptyTestsDataDescription")
                    : t("emptyStudentDataDescription")}
                </div>
              )}
            </div>
          )}
        </BioPanel>
      </div>
    </PageScaffold>
  );
}

function AnalysisSummaryTile({
  label,
  value,
  support,
}: {
  label: string;
  value: string;
  support: string;
}) {
  return (
    <div className="rounded-[12px] border border-border/70 bg-background/70 p-4">
      <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{support}</p>
    </div>
  );
}

function AnalysisMetricTile({
  label,
  value,
  support,
  tone,
}: {
  label: string;
  value: string;
  support: string;
  tone: "default" | "success" | "warning" | "info";
}) {
  const dotClassName =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "warning"
        ? "bg-amber-500"
        : tone === "info"
          ? "bg-blue-500"
          : "bg-slate-300";

  return (
    <div className="rounded-[12px] border border-border/70 bg-background/72 p-4">
      <div className="flex items-center gap-2">
        <span className={`size-2.5 rounded-full ${dotClassName}`} />
        <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{support}</p>
    </div>
  );
}

function ClassDistributionCard({
  title,
  total,
  healthy,
  improvement,
  noData,
  healthyLabel,
  improvementLabel,
  noDataLabel,
}: {
  title: string;
  total: number;
  healthy: number;
  improvement: number;
  noData: number;
  healthyLabel: string;
  improvementLabel: string;
  noDataLabel: string;
}) {
  const safeTotal = total || 1;
  const healthyWidth = (healthy / safeTotal) * 100;
  const improvementWidth = (improvement / safeTotal) * 100;
  const noDataWidth = (noData / safeTotal) * 100;

  return (
    <div className="rounded-[12px] border border-border/70 bg-background/72 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {title}
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-foreground">
            {total} alunos
          </h3>
        </div>
        <Badge variant="info" size="md">
          {total > 0 ? `${Math.round((healthy / total) * 100)}%` : "0%"}
        </Badge>
      </div>

      <div className="mt-5 h-5 overflow-hidden rounded-full bg-muted/80">
        <div className="flex h-full w-full">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${healthyWidth}%` }}
          />
          <div
            className="h-full bg-amber-500"
            style={{ width: `${improvementWidth}%` }}
          />
          <div
            className="h-full bg-slate-300"
            style={{ width: `${noDataWidth}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <DistributionStat
          color="bg-emerald-500"
          label={healthyLabel}
          value={healthy}
        />
        <DistributionStat
          color="bg-amber-500"
          label={improvementLabel}
          value={improvement}
        />
        <DistributionStat color="bg-slate-300" label={noDataLabel} value={noData} />
      </div>
    </div>
  );
}

function AnalysisControlGroup<T extends string>({
  options,
  value,
  onChange,
  align = "start",
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  align?: "start" | "end";
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "flex flex-wrap gap-2",
        align === "end" ? "justify-start sm:justify-end" : "justify-start",
      )}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              interactiveControlClasses.choiceBase,
              "inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
              active
                ? interactiveControlClasses.choiceActive
                : interactiveControlClasses.choiceInactive,
            )}
          >
            {option.icon}
            <span className="leading-tight">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function DistributionStat({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[12px] border border-border/70 bg-background/65 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className={`size-2.5 rounded-full ${color}`} />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">
        {value}
      </p>
    </div>
  );
}
