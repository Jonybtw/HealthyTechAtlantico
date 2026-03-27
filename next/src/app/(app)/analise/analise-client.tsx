"use client";

import { useEffect, useState, useMemo } from "react";
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
import { MeshGlow } from "@/components/ui/mesh-glow";

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
    if (!canViewAnalysis) return;

    let active = true;
    setLoadingStudents(true);

    void (async () => {
      try {
        const response = await fetch("/api/students?limit=500");
        const body = await readApiResponse<{
          students: { id: string; name: string; className?: string | null }[];
        }>(response);
        if (!active) return;

        const nextStudents = body.students.map((student) => ({
          id: student.id,
          name: student.name,
          className: student.className ?? null,
        }));
        setStudents(nextStudents);
      } catch {
        if (!active) return;
        toast.error(common("studentListLoadError"));
        setStudents([]);
        setStudentId(null);
      } finally {
        if (active) setLoadingStudents(false);
      }
    })();

    return () => { active = false; };
  }, [canViewAnalysis, common]);

  useEffect(() => {
    if (!studentId) return;

    let active = true;
    void (async () => {
      const [bioRes, testsRes] = await Promise.all([
        fetch(`/api/students/${studentId}/biometrics`),
        fetch(`/api/students/${studentId}/tests`),
      ]);

      if (!active) return;

      try {
        const body = await readApiResponse<{
          recordedAt: string;
          imc: number | string;
          heightM: number;
          weightKg: number;
        }[]>(bioRes);
        setBioData(
          body.map((entry) => ({
            date: new Date(entry.recordedAt).toLocaleDateString(locale, {
              month: "short",
              year: "2-digit",
            }),
            imc: Number(entry.imc),
            height: Number(entry.heightM) * 100,
            weight: Number(entry.weightKg),
          })).reverse()
        );
      } catch { setBioData([]); }

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
          if (!grouped.has(dateKey)) grouped.set(dateKey, { date: dateKey });
          grouped.get(dateKey)![test.testId] = test.valueNum ?? 0;
        }
        setTestData(Array.from(grouped.values()).reverse());
      } catch { setTestData([]); }
    })();

    return () => { active = false; };
  }, [locale, studentId]);

  useEffect(() => {
    if (!classId || chart !== "class") return;

    let active = true;
    void (async () => {
      try {
        const response = await fetch(`/api/classes/report?classId=${encodeURIComponent(classId)}`);
        const body = await readApiResponse<ClassStudent[]>(response);
        if (!active) return;

        let zsaf = 0; let zmf = 0; let noData = 0;
        for (const student of body) {
          const zone = student.latestBiometric?.imcZone ?? "";
          if (zone.toLowerCase().includes("saud") || zone === "ZSAF") zsaf++;
          else if (zone) zmf++;
          else noData++;
        }

        const selectedClass = classes.find((c) => c.id === classId);
        setClassData([{
          name: selectedClass?.name ?? "Turma",
          ZSAF: zsaf,
          ZMF: zmf,
          noData,
        }]);
      } catch {
        if (active) setClassData([]);
      }
    })();

    return () => { active = false; };
  }, [chart, classId, classes]);

  const chartOptions = [
    { value: "height", label: t("chartHeight"), icon: <Ruler className="size-4" /> },
    { value: "weight", label: t("chartWeight"), icon: <Scale className="size-4" /> },
    { value: "bmi", label: t("chartBmi"), icon: <Activity className="size-4" /> },
    { value: "tests", label: t("chartTests"), icon: <CheckCircle2 className="size-4" /> },
    { value: "class", label: t("chartClass"), icon: <Users className="size-4" /> },
  ];

  const currentStudent = useMemo(() => students.find(s => s.id === studentId), [students, studentId]);

  if (!canViewAnalysis) {
    return (
      <PageScaffold headerProps={{ title: t("title"), description: t("description"), eyebrow: "DADOS · ANÁLISE" }}>
        <EmptyState icon={ShieldAlert} title={common("noPermission")} description={t("description")} />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold headerProps={{ 
      title: t("title"), 
      description: t("description"), 
      eyebrow: "DADOS · ANÁLISE" 
    }}>
      <div className="relative">
        <MeshGlow className="top-0 right-0 opacity-20" />
        <MeshGlow className="bottom-0 left-0 opacity-10" />

        <PageSection layout="list" className="bg-transparent mb-8">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-6">
            {chart !== "class" && (
              <div className="w-full md:w-auto min-w-[300px]">
                <StudentPicker
                  students={students}
                  value={studentId}
                  onChange={setStudentId}
                  loading={loadingStudents}
                />
              </div>
            )}

            {chart === "class" && classes.length > 0 && (
              <ClassPicker
                classes={classes}
                value={classId}
                onChange={(value) => {
                  setClassId(value);
                  setClassData([]);
                }}
                placeholder={t("chartClass")}
              />
            )}

            <div className="flex-1">
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
          </div>
        </PageSection>

        <PageSection
          title={chart === "class" ? t("chartClass") : chart === "tests" ? t("chartTests") : chart === "height" ? t("chartHeight") : chart === "weight" ? t("chartWeight") : t("chartBmi")}
          description={chart === "class" ? t("classDistribution") : t("description")}
          className="glass-card overflow-hidden"
          layout="analytics"
        >
          <div className="relative p-2 md:p-6 min-h-[450px]">
            <MeshGlow className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 scale-150" />
            
            {chart !== "class" && !studentId ? (
              <EmptyState icon={ChartIcon} title={t("noStudentSelected")} description={t("noStudentSelectedDesc")} />
            ) : (chart === "bmi" || chart === "height" || chart === "weight") ? (
              <ChartFrame className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bioData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500 }} 
                      axisLine={false} 
                      tickLine={false} 
                      dy={15} 
                    />
                    <YAxis 
                      domain={["auto", "auto"]} 
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500 }} 
                      axisLine={false} 
                      tickLine={false} 
                      dx={-10} 
                      tickFormatter={chart === "height" ? (v) => `${v}cm` : chart === "weight" ? (v) => `${v}kg` : undefined} 
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      height={36}
                      iconType="circle"
                      content={({ payload }) => (
                        <div className="flex justify-end gap-4 mb-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                          {payload?.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              {entry.value}
                            </div>
                          ))}
                        </div>
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey={chart === "bmi" ? "imc" : chart === "height" ? "height" : "weight"}
                      name={chart === "bmi" ? t("chartBmi") : chart === "height" ? t("chartHeight") : t("chartWeight")}
                      stroke={chart === "height" ? "#10B981" : chart === "weight" ? "#3B82F6" : "#d8ad34"}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorMain)"
                      activeDot={{ r: 6, strokeWidth: 0, fill: "#fff" }}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartFrame>
            ) : chart === "tests" ? (
              <ChartFrame className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={testData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} barSize={24} barGap={8}>
                    <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500 }} 
                      axisLine={false} 
                      tickLine={false} 
                      dy={15} 
                    />
                    <YAxis 
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500 }} 
                      axisLine={false} 
                      tickLine={false} 
                      dx={-10} 
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                    <Bar dataKey="vai" name={t("barVaiVem")} fill="#1E3A8A" radius={[4, 4, 0, 0]} animationDuration={1000} />
                    <Bar dataKey="abd" name={t("barAbdominais")} fill="#d8ad34" radius={[4, 4, 0, 0]} animationDuration={1000} />
                    <Bar dataKey="bracos" name={t("barExtensoes")} fill="#3B82F6" radius={[4, 4, 0, 0]} animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
            ) : !classId ? (
              <EmptyState icon={Users} title={t("noClassSelected")} description={t("noClassSelectedDesc")} />
            ) : classData.length === 0 ? (
              <div className="flex h-40 items-center justify-center">
                <Activity className="size-8 animate-pulse text-primary-500 opacity-50" />
              </div>
            ) : (
              <ChartFrame className="h-[300px] w-full mt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#fff", fontSize: 14, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                    <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                    <Bar dataKey="ZSAF" name={t("healthyZone")} fill="#10B981" stackId="a" radius={[0, 0, 0, 0]} animationDuration={1000} />
                    <Bar dataKey="ZMF" name={t("improvementZone")} fill="#d8ad34" stackId="a" radius={[0, 0, 0, 0]} animationDuration={1000} />
                    <Bar dataKey="noData" name={t("noDataLabel")} fill="rgba(255,255,255,0.1)" stackId="a" radius={[0, 20, 20, 0]} animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
            )}
          </div>
        </PageSection>

        {currentStudent && (
          <PageSection className="mt-8 glass-card border-gold-500/20">
            <div className="flex items-start gap-4 p-4">
              <div className="size-10 rounded-full bg-gold-500/10 flex items-center justify-center shrink-0">
                <ChartIcon className="size-5 text-gold-500 shadow-[0_0_10px_rgba(216,173,52,0.5)]" />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-gold-500 mb-1">Destaque de Evolução</h4>
                <p className="text-slate-300 text-[13px] leading-relaxed">
                  O aluno <span className="text-white font-semibold">{currentStudent.name}</span> apresenta uma tendência 
                  {bioData.length > 1 && bioData[0].imc < bioData[1].imc ? " crescente " : " estável "} 
                  nos indicadores de saúde. Recomenda-se manter o acompanhamento periódico nas sessões de biometria.
                </p>
              </div>
            </div>
          </PageSection>
        )}
      </div>
    </PageScaffold>
  );
}
