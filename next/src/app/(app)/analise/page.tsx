"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Activity, LineChart as ChartIcon, Link2, Users } from "lucide-react";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { StudentPicker } from "@/components/ui/student-picker";
import { PillSelect } from "@/components/ui/pill-select";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { useUser } from "@/components/user-context";
import { useClasses } from "@/hooks/use-queries";
import { usePageTitle } from "@/hooks/use-page-title";
import { readApiResponse } from "@/lib/api-client";

type ChartType = "bmi" | "tests" | "class";

interface ClassStudent {
  latestBiometric: { imc: number | string; imcZone: string } | null;
}

export default function AnalisePage() {
  const t = useTranslations("analise");
  const common = useTranslations("common");
  usePageTitle(t("title"));
  const { role } = useUser();
  const locale = useLocale();

  const isStudent = role === "ALUNO";
  const canViewAnalysis = role === "ADMIN" || role === "PROFESSOR" || isStudent;

  const [students, setStudents] = useState<{ id: string; name: string; className?: string | null }[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [chart, setChart] = useState<ChartType>("bmi");
  const [bmiData, setBmiData] = useState<{ date: string; imc: number }[]>([]);
  const [testData, setTestData] = useState<Record<string, string | number>[]>([]);
  const { data: classes = [] } = useClasses({ enabled: !isStudent && canViewAnalysis });
  const [classId, setClassId] = useState<string>("");
  const [classData, setClassData] = useState<
    { name: string; ZSAF: number; ZMF: number; noData: number }[]
  >([]);

  useEffect(() => {
    if (!canViewAnalysis) {
      return;
    }

    let active = true;

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
        if (isStudent && nextStudents.length === 1) {
          setStudentId(nextStudents[0].id);
        }
      } catch {
        if (!active) {
          return;
        }
        setStudents([]);
        setStudentId(null);
      }
    })();

    return () => {
      active = false;
    };
  }, [canViewAnalysis, isStudent]);

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
        }[]>(bioRes);
        setBmiData(
          body
            .map((entry) => ({
              date: new Date(entry.recordedAt).toLocaleDateString(locale, {
                month: "short",
                year: "2-digit",
              }),
              imc: Number(entry.imc),
            }))
            .reverse()
        );
      } catch {
        setBmiData([]);
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
    { value: "bmi", label: t("chartBmi") },
    { value: "tests", label: t("chartTests") },
    ...(!isStudent ? [{ value: "class", label: t("chartClass") }] : []),
  ];

  if (!canViewAnalysis) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">{common("noPermission")}</p>
      </div>
    );
  }

  if (isStudent && students.length === 0) {
    return (
      <PageScaffold
        headerProps={{ title: t("title"), description: t("descriptionStudent"), eyebrow: "Analysis" }}
      >
        <EmptyState
          icon={Link2}
          title={t("unlinkedTitle")}
          description={t("unlinkedDescription")}
        />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold headerProps={{ title: t("title"), description: t("description"), eyebrow: "Analysis" }}>

      <PageSection tone="utility" layout="list">
        <div className="flex flex-wrap items-end gap-4">
          {chart !== "class" && !isStudent ? (
            <div className="w-full max-w-xs">
              <StudentPicker
                students={students}
                value={studentId}
                onChange={setStudentId}
              />
            </div>
          ) : null}

          {chart === "class" && classes.length > 0 ? (
            <div className="w-full max-w-xs">
              <PillSelect
                options={classes.map((schoolClass) => ({
                  value: schoolClass.id,
                  label: `${schoolClass.name} (${schoolClass.year})`,
                }))}
                value={classId}
                onChange={(value) => {
                  setClassId(value);
                  setClassData([]);
                }}
              />
            </div>
          ) : null}

          <PillSelect
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
        title={chart === "class" ? t("chartClass") : chart === "tests" ? t("chartTests") : t("chartBmi")}
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
        ) : chart === "bmi" ? (
          <div className="h-80 w-full animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bmiData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis domain={["auto", "auto"]} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Line
                  type="monotone"
                  dataKey="imc"
                  name={t("chartBmi")}
                  stroke="var(--color-navy-600)"
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  dot={{ r: 4, strokeWidth: 2, fill: "var(--color-background)", stroke: "var(--color-navy-600)" }}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : chart === "tests" ? (
          <div className="h-80 w-full animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={testData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="vai" name={t("barVaiVem")} fill="var(--color-navy-600)" radius={[4, 4, 0, 0]} animationDuration={1000} />
                <Bar dataKey="abd" name={t("barAbdominais")} fill="var(--color-gold-500)" radius={[4, 4, 0, 0]} animationDuration={1000} />
                <Bar dataKey="bracos" name={t("barExtensoes")} fill="var(--color-blue-400)" radius={[4, 4, 0, 0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
          <div className="h-72 w-full animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
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
          </div>
        )}
      </PageSection>
    </PageScaffold>
  );
}
