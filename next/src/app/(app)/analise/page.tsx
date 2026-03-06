"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
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
import { LineChart as ChartIcon, Users, Activity } from "lucide-react";

type ChartType = "bmi" | "tests" | "class";

interface ClassOption {
  id: string;
  name: string;
  year: string;
}

interface ClassStudent {
  latestBiometric: { imc: number | string; imcZone: string } | null;
}

export default function AnalisePage() {
  const t = useTranslations("analise");
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown>)?.role as string;

  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [chart, setChart] = useState<ChartType>("bmi");
  const [bmiData, setBmiData] = useState<{ date: string; imc: number }[]>([]);
  const [testData, setTestData] = useState<Record<string, unknown>[]>([]);

  // Class chart state
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classId, setClassId] = useState<string | null>(null);
  const [classData, setClassData] = useState<{ name: string; ZSAF: number; ZMF: number; "Sem dados": number }[]>([]);

  const loadStudents = useCallback(async () => {
    const res = await fetch("/api/students?limit=500");
    if (res.ok) {
      const body = await res.json();
      setStudents(body.students.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
      if (role === "ALUNO" && body.students.length === 1) {
        setStudentId(body.students[0].id);
      }
    }
  }, [role]);

  const loadClasses = useCallback(async () => {
    const res = await fetch("/api/classes");
    if (res.ok) {
      const body = await res.json();
      const all: ClassOption[] = [];
      for (const ay of body as { label: string; classes: { id: string; name: string }[] }[]) {
        for (const c of ay.classes) {
          all.push({ id: c.id, name: c.name, year: ay.label });
        }
      }
      setClasses(all);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (role !== "ALUNO") loadClasses();
  }, [role, loadClasses]);

  /* Fetch student data when studentId changes */
  useEffect(() => {
    if (!studentId) return;

    const fetchBio = async () => {
      const res = await fetch(`/api/students/${studentId}/biometrics`);
      if (res.ok) {
        const body = await res.json();
        setBmiData(
          (body as { recordedAt: string; imc: number | string }[])
            .map((b) => ({
              date: new Date(b.recordedAt).toLocaleDateString("pt-PT", {
                month: "short",
                year: "2-digit",
              }),
              imc: Number(b.imc),
            }))
            .reverse()
        );
      }
    };

    const fetchTests = async () => {
      const res = await fetch(`/api/students/${studentId}/tests`);
      if (res.ok) {
        const body = await res.json();
        const grouped = new Map<string, Record<string, unknown>>();
        for (const t of body as { testId: string; valueNum: number | null; recordedAt: string }[]) {
          const dateKey = new Date(t.recordedAt).toLocaleDateString("pt-PT", {
            month: "short",
            year: "2-digit",
          });
          if (!grouped.has(dateKey)) grouped.set(dateKey, { date: dateKey });
          grouped.get(dateKey)![t.testId] = t.valueNum ?? 0;
        }
        setTestData(Array.from(grouped.values()).reverse());
      }
    };

    fetchBio();
    fetchTests();
  }, [studentId]);

  /* Fetch class report when classId changes (class chart) */
  useEffect(() => {
    if (!classId || chart !== "class") return;
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return;
    fetch(`/api/classes/report?year=${encodeURIComponent(cls.year)}`)
      .then(async (res) => {
        if (!res.ok) return;
        const body = (await res.json()) as ClassStudent[];
        let zsaf = 0, zmf = 0, noData = 0;
        for (const s of body) {
          const zone = s.latestBiometric?.imcZone ?? "";
          if (zone.toLowerCase().includes("saud") || zone === "ZSAF") zsaf++;
          else if (zone) zmf++;
          else noData++;
        }
        setClassData([{ name: cls.name, ZSAF: zsaf, ZMF: zmf, "Sem dados": noData }]);
      })
      .catch(() => { });
  }, [classId, chart, classes]);

  const chartOptions = [
    { value: "bmi", label: "IMC" },
    { value: "tests", label: "Testes" },
    ...(role !== "ALUNO" ? [{ value: "class", label: "Média Turma" }] : []),
  ];

  /* Premium Glassmorphic Tooltip */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/90 glass p-3 border border-border/50 shadow-float rounded-xl text-sm">
          <p className="font-semibold mb-2 tracking-tight text-foreground">{label}</p>
          <div className="flex flex-col gap-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-muted-foreground mr-2">{entry.name}:</span>
                <span className="font-bold text-foreground">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-5">
        <div className="flex flex-wrap items-end gap-4">
          {chart !== "class" && role !== "ALUNO" && (
            <div className="w-64">
              <StudentPicker students={students} value={studentId} onChange={setStudentId} />
            </div>
          )}
          {chart === "class" && classes.length > 0 && (
            <div className="w-64">
              <PillSelect
                options={classes.map((c) => ({ value: c.id, label: `${c.name} (${c.year})` }))}
                value={classId ?? ""}
                onChange={setClassId}
              />
            </div>
          )}
          <PillSelect
            options={chartOptions}
            value={chart}
            onChange={(v) => {
              setChart(v as ChartType);
              setClassData([]);
            }}
          />
        </div>

        {/* Student charts */}
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
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
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
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="vai" name="Vai e Vem" fill="var(--color-navy-600)" radius={[4, 4, 0, 0]} animationDuration={1000} />
                <Bar dataKey="abd" name="Abdominais" fill="var(--color-gold-500)" radius={[4, 4, 0, 0]} animationDuration={1000} />
                <Bar dataKey="bracos" name="Extensões" fill="var(--color-blue-400)" radius={[4, 4, 0, 0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* Class ZAF distribution chart */
          !classId ? (
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
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }} />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar dataKey="ZSAF" name="Zona Saudável" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} animationDuration={1000} />
                  <Bar dataKey="ZMF" name="Zona de Melhoria" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} animationDuration={1000} />
                  <Bar dataKey="Sem dados" name="Sem dados" fill="var(--color-muted)" stackId="a" radius={[0, 4, 4, 0]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )
        )}
      </div>
    </div>
  );
}
