"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Activity, CheckCircle2, LineChart as ChartIcon, ShieldAlert, Users, Ruler, Scale } from "lucide-react";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { StudentPicker } from "@/components/ui/student-picker";
import { PillSelect } from "@/components/ui/pill-select";
import { ClassPicker } from "@/components/ui/class-picker";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { ChartFrame } from "@/components/ui/chart-frame";
import { useUser } from "@/components/user-context";
import { useClasses } from "@/hooks/use-queries";
import { readApiResponse } from "@/lib/api-client";

type ChartType = "height" | "weight" | "bmi" | "tests" | "class";

interface ClassStudent {
  latestBiometric: { imc: number | string; imcZone: string } | null;
}

export default function AnalisePage() {
  const t = useTranslations("analise");
  const common = useTranslations("common");
  const { role } = useUser();
  const locale = useLocale();

  const canViewAnalysis = role === "ADMIN" || role === "PROFESSOR";

  const [students, setStudents] = useState<{ id: string; name: string; className?: string | null }[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [chart, setChart] = useState<ChartType>("height");
  const [bioData, setBioData] = useState<{ date: string; imc: number; height: number; weight: number }[]>([]);
  const [testData, setTestData] = useState<Record<string, string | number>[]>([]);
  const { data: classes = [] } = useClasses({ enabled: canViewAnalysis });
  const [classId, setClassId] = useState<string>("");
  const [classData, setClassData] = useState<
    { name: string; ZSAF: number; ZMF: number; noData: number }[]
  >([]);

  useEffect(() => {
    if (!canViewAnalysis) {
      return;
    }

    let active = true;
    setLoadingStudents(true);

    void (async () => {
      try {
        const response = await fetch("/api/students?limit=500");
        const body = await readApiResponse<{
          students: { id: string; name: string; className?: string | null }[];
        }>(response);
        if (!active) {
          return;
        }

        const nextStudents = body.students.map((student) => ({
          id: student.id,
          name: student.name,
          className: student.className ?? null,
        }));
        setStudents(nextStudents);
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
    if (!studentId) {
      return;
    }

    let active = true;

    void (async () => {
      const [bioRes, testsRes] = await Promise.all([
        fetch(`/api/students/${studentId}/biometrics`),
        fetch(`/api/students/${studentId}/tests`),
      ]);

      if (!active) {
        return;
      }

      try {
        const body = await readApiResponse<{
          recordedAt: string;
          imc: number | string;
          heightM: number;
          weightKg: number;
        }[]>(bioRes);
        setBioData(
          body
            .map((entry) => ({
              date: new Date(entry.recordedAt).toLocaleDateString(locale, {
                month: "short",
                year: "2-digit",
              }),
              imc: Number(entry.imc),
              height: Number(entry.heightM) * 100,
              weight: Number(entry.weightKg),
            }))
            .reverse()
        );
      } catch {
        setBioData([]);
      }

      try {
        const body = await readApiResponse<{
          testId: string;
          valueNum: number | null;
          recordedAt: string;
        }[]>(testsRes);
        const grouped = new Map<string, Record<string, string | number>>();
        for (const test of body) {
          const dateKey = new Date(test.recordedAt).toLocaleDateString(locale, {
            month: "short",
            year: "2-digit",
          });
          if (!grouped.has(dateKey)) {
            grouped.set(dateKey, { date: dateKey });
          }
          grouped.get(dateKey)![test.testId] = test.valueNum ?? 0;
        }
        setTestData(Array.from(grouped.values()).reverse());
      } catch {
        setTestData([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [locale, studentId]);

  useEffect(() => {
    if (!classId || chart !== "class") {
      return;
    }

    let active = true;

    void (async () => {
      try {
        const response = await fetch(
          `/api/classes/report?classId=${encodeURIComponent(classId)}`
        );
        const body = await readApiResponse<ClassStudent[]>(response);
        if (!active) {
          return;
        }

        let zsaf = 0;
        let zmf = 0;
        let noData = 0;

        for (const student of body) {
          const zone = student.latestBiometric?.imcZone ?? "";
          if (zone.toLowerCase().includes("saud") || zone === "ZSAF") {
            zsaf++;
          } else if (zone) {
            zmf++;
          } else {
            noData++;
          }
        }

        const selectedClass = classes.find((schoolClass) => schoolClass.id === classId);
        setClassData([
          {
            name: selectedClass?.name ?? "Turma",
            ZSAF: zsaf,
            ZMF: zmf,
            noData,
          },
        ]);
      } catch {
        if (!active) {
          return;
        }
        setClassData([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [chart, classId, classes]);

  const chartOptions = [
    { value: "height", label: t("chartHeight"), icon: <Ruler className="size-4" /> },
    { value: "weight", label: t("chartWeight"), icon: <Scale className="size-4" /> },
    { value: "bmi", label: t("chartBmi"), icon: <Activity className="size-4" /> },
    { value: "tests", label: t("chartTests"), icon: <CheckCircle2 className="size-4" /> },
    { value: "class", label: t("chartClass"), icon: <Users className="size-4" /> },
  ];

  if (!canViewAnalysis) {
    return (
      <PageScaffold headerProps={{ title: t("title"), description: t("description") }}>
        <EmptyState
          icon={ShieldAlert}
          title={common("noPermission")}
          description={t("description")}
        />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold headerProps={{ title: t("title"), description: t("description") }}>

      <PageSection tone="secondary" layout="list">
        <div className="flex flex-wrap items-end gap-4">
          {chart !== "class" ? (
            <div className="w-full max-w-xs">
              <StudentPicker
                students={students}
                value={studentId}
                onChange={setStudentId}
                loading={loadingStudents}
              />
            </div>
          ) : null}

          {chart === "class" && classes.length > 0 ? (
            <ClassPicker
              classes={classes}
              value={classId}
              onChange={(value) => {
                setClassId(value);
                setClassData([]);
              }}
              placeholder={t("chartClass")}
            />
          ) : null}

          <PillSelect
            size="lg"
            options={chartOptions}
            value={chart}
            onChange={(value) => {
              setChart(value as ChartType);
              setClassData([]);
            }}
          />
        </div>
      </PageSection>

      <PageSection
        title={chart === "class" ? t("chartClass") : chart === "tests" ? t("chartTests") : chart === "height" ? t("chartHeight") : chart === "weight" ? t("chartWeight") : t("chartBmi")}
        description={chart === "class" ? t("classDistribution") : t("description")}
        tone="secondary"
        layout="analytics"
      >
        {chart !== "class" && !studentId ? (
          <EmptyState
            icon={ChartIcon}
            title={t("noStudentSelected")}
            description={t("noStudentSelectedDesc")}
          />
        ) : chart === "bmi" || chart === "height" || chart === "weight" ? (
          <ChartFrame className="h-80 w-full animate-fade-in">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={bioData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBmi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-navy-600)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-navy-600)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-success-500)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-success-500)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-blue-500)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-blue-500)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis 
                  domain={["auto", "auto"]} 
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false} 
                  dx={-10} 
                  tickFormatter={
                    chart === "height" ? (v) => `${v}cm` : chart === "weight" ? (v) => `${v}kg` : undefined
                  } 
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                {chart === "bmi" && (
                  <Area
                    type="natural"
                    dataKey="imc"
                    name={t("chartBmi")}
                    stroke="var(--color-navy-600)"
                    fillOpacity={1}
                    fill="url(#colorBmi)"
                    strokeWidth={3}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-navy-600)" }}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                )}
                {chart === "height" && (
                  <Area
                    type="natural"
                    dataKey="height"
                    name={t("chartHeight")}
                    stroke="var(--color-success-600)"
                    fillOpacity={1}
                    fill="url(#colorHeight)"
                    strokeWidth={3}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-success-600)" }}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                )}
                {chart === "weight" && (
                  <Area
                    type="natural"
                    dataKey="weight"
                    name={t("chartWeight")}
                    stroke="var(--color-blue-600)"
                    fillOpacity={1}
                    fill="url(#colorWeight)"
                    strokeWidth={3}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-blue-600)" }}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </ChartFrame>
        ) : chart === "tests" ? (
          <ChartFrame className="h-80 w-full animate-fade-in">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={testData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="vai" name={t("barVaiVem")} fill="var(--color-navy-600)" radius={[6, 6, 0, 0]} animationDuration={1000} />
                <Bar dataKey="abd" name={t("barAbdominais")} fill="var(--color-gold-500)" radius={[6, 6, 0, 0]} animationDuration={1000} />
                <Bar dataKey="bracos" name={t("barExtensoes")} fill="var(--color-blue-400)" radius={[6, 6, 0, 0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        ) : !classId ? (
          <EmptyState
            icon={Users}
            title={t("noClassSelected")}
            description={t("noClassSelectedDesc")}
          />
        ) : classData.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <Activity className="size-8 animate-pulse text-muted-foreground opacity-50" />
          </div>
        ) : (
          <ChartFrame className="h-72 w-full animate-fade-in">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={classData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "var(--color-foreground)", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="ZSAF" name={t("healthyZone")} fill="var(--color-success-500)" stackId="a" radius={[0, 0, 0, 0]} animationDuration={1000} />
                <Bar dataKey="ZMF" name={t("improvementZone")} fill="var(--color-warning-500)" stackId="a" radius={[0, 0, 0, 0]} animationDuration={1000} />
                <Bar dataKey="noData" name={t("noDataLabel")} fill="var(--color-muted-foreground)" stackId="a" radius={[0, 4, 4, 0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        )}
      </PageSection>
    </PageScaffold>
  );
}


