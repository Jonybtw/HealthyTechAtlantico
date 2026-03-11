"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
import { PageHeader } from "@/components/ui/page-header";
import { StudentPicker } from "@/components/ui/student-picker";
import { PillSelect } from "@/components/ui/pill-select";
import { EmptyState } from "@/components/ui/empty-state";
import { LineChart as ChartIcon, Users, Activity, Link2 } from "lucide-react";
import { useUser } from "@/components/user-context";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { useClasses } from "@/hooks/use-queries";

type ChartType = "bmi" | "tests" | "class";

interface ClassStudent {
  latestBiometric: { imc: number | string; imcZone: string } | null;
}

export default function AnalisePage() {
  const t = useTranslations("analise");
  const common = useTranslations("common");
  const { role } = useUser();

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
    { name: string; ZSAF: number; ZMF: number; "Sem dados": number }[]
  >([]);

  useEffect(() => {
    if (!canViewAnalysis) return;

    let active = true;

    (async () => {
      const res = await fetch("/api/students?limit=500");
      if (!res.ok) return;

      const body = await res.json();
      if (!active) return;

      const nextStudents = body.students.map(
        (student: { id: string; name: string; className?: string | null }) => ({
          id: student.id,
          name: student.name,
          className: student.className ?? null,
        })
      );
      setStudents(nextStudents);
      if (isStudent && nextStudents.length === 1) {
        setStudentId(nextStudents[0].id);
      }
    })();

    return () => {
      active = false;
    };
  }, [canViewAnalysis, isStudent]);

  useEffect(() => {
    if (!studentId) return;

    let active = true;

    (async () => {
      const [bioRes, testsRes] = await Promise.all([
        fetch(`/api/students/${studentId}/biometrics`),
        fetch(`/api/students/${studentId}/tests`),
      ]);

      if (!active) return;

      if (bioRes.ok) {
        const body = (await bioRes.json()) as {
          recordedAt: string;
          imc: number | string;
        }[];
        setBmiData(
          body
            .map((entry) => ({
              date: new Date(entry.recordedAt).toLocaleDateString("pt-PT", {
                month: "short",
                year: "2-digit",
              }),
              imc: Number(entry.imc),
            }))
            .reverse()
        );
      } else {
        setBmiData([]);
      }

      if (testsRes.ok) {
        const body = (await testsRes.json()) as {
          testId: string;
          valueNum: number | null;
          recordedAt: string;
        }[];
        const grouped = new Map<string, Record<string, string | number>>();
        for (const test of body) {
          const dateKey = new Date(test.recordedAt).toLocaleDateString("pt-PT", {
            month: "short",
            year: "2-digit",
          });
          if (!grouped.has(dateKey)) grouped.set(dateKey, { date: dateKey });
          grouped.get(dateKey)![test.testId] = test.valueNum ?? 0;
        }
        setTestData(Array.from(grouped.values()).reverse());
      } else {
        setTestData([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [studentId]);

  useEffect(() => {
    if (!classId || chart !== "class") return;

    let active = true;

    (async () => {
      const res = await fetch(
        `/api/classes/report?classId=${encodeURIComponent(classId)}`
      );
      if (!res.ok) return;

      const body = (await res.json()) as ClassStudent[];
      if (!active) return;

      let zsaf = 0;
      let zmf = 0;
      let noData = 0;
      for (const student of body) {
        const zone = student.latestBiometric?.imcZone ?? "";
        if (zone.toLowerCase().includes("saud") || zone === "ZSAF") zsaf++;
        else if (zone) zmf++;
        else noData++;
      }

      const selectedClass = classes.find((schoolClass) => schoolClass.id === classId);
      setClassData([
        {
          name: selectedClass?.name ?? "Turma",
          ZSAF: zsaf,
          ZMF: zmf,
          "Sem dados": noData,
        },
      ]);
    })();

    return () => {
      active = false;
    };
  }, [chart, classId, classes]);

  const chartOptions = [
    { value: "bmi", label: "IMC" },
    { value: "tests", label: "Testes" },
    ...(!isStudent ? [{ value: "class", label: "Média Turma" }] : []),
  ];

  if (!canViewAnalysis) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">{common("noPermission")}</p>
      </div>
    );
  }

  if (isStudent && students.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title={t("title")} description={t("descriptionStudent")} />
        <EmptyState
          icon={Link2}
          title="Perfil não associado"
          description="A tua conta ainda não está associada a um perfil de aluno. Contacta a escola para concluírem a ligação."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-5 flex flex-col gap-5 max-w-3xl">
        <div className="flex flex-wrap items-end gap-4">
          {chart !== "class" && !isStudent && (
            <div className="w-64">
              <StudentPicker
                students={students}
                value={studentId}
                onChange={setStudentId}
              />
            </div>
          )}
          {chart === "class" && classes.length > 0 && (
            <div className="w-64">
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
          )}
          <PillSelect
            options={chartOptions}
            value={chart}
            onChange={(value) => {
              setChart(value as ChartType);
              setClassData([]);
            }}
          />
        </div>

        {chart !== "class" && !studentId ? (
          <EmptyState
            icon={ChartIcon}
            title="Nenhum Aluno Selecionado"
            description="Selecione um aluno da lista acima para visualizar o histórico de avaliações biométricas e físicas."
          />
        ) : chart === "bmi" ? (
          <div className="h-80 w-full animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bmiData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis domain={["auto", "auto"]} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Line
                  type="monotone"
                  dataKey="imc"
                  name="IMC"
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
              <BarChart data={testData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="vai" name="Vai e Vem" fill="var(--color-navy-600)" radius={[4, 4, 0, 0]} animationDuration={1000} />
                <Bar dataKey="abd" name="Abdominais" fill="var(--color-gold-500)" radius={[4, 4, 0, 0]} animationDuration={1000} />
                <Bar dataKey="bracos" name="Extensões" fill="var(--color-blue-400)" radius={[4, 4, 0, 0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : !classId ? (
          <EmptyState
            icon={Users}
            title="Nenhuma Turma Selecionada"
            description="Selecione uma turma para visualizar a distribuição atualizada das Zonas de Aptidão Física dos alunos."
          />
        ) : classData.length === 0 ? (
          <div className="flex justify-center items-center h-40">
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
                <Bar dataKey="ZSAF" name="Zona Saudável" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} animationDuration={1000} />
                <Bar dataKey="ZMF" name="Zona de Melhoria" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} animationDuration={1000} />
                <Bar dataKey="Sem dados" name="Sem dados" fill="#64748b" stackId="a" radius={[0, 4, 4, 0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
