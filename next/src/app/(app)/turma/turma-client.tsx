"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download, FileUp, ShieldOff, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { ClassPicker } from "@/components/ui/class-picker";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";
import { ChartFrame } from "@/components/ui/chart-frame";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { useClasses } from "@/hooks/use-queries";
import { readApiResponse } from "@/lib/api-client";
import { getInitials, getStudentSwatch } from "@/components/ui/student-picker";

interface StudentRow {
  id: string;
  name: string;
  sex: string;
  className: string | null;
  latestBiometric: { imc: number | string; imcZone: string } | null;
  testCount: number;
}

export default function TurmaPage() {
  const t = useTranslations("turma");
  const common = useTranslations("common");
  const { role } = useUser();
  const canViewClassReports = role === "ADMIN" || role === "PROFESSOR";
  const {
    data: classes = [],
    isLoading: loadingClasses,
    error: classesError,
    refetch: refetchClasses,
  } = useClasses({ enabled: canViewClassReports });
  const [classId, setClassId] = useState<string>("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (classesError) toast.error(t("loadError"));
  }, [classesError, t]);

  useEffect(() => {
    if (!canViewClassReports || !classId) return;

    let active = true;

    (async () => {
      const res = await fetch(
        `/api/classes/report?classId=${encodeURIComponent(classId)}`
      );
      const body = await readApiResponse<StudentRow[]>(res);
      if (!active) return;
      setStudents(body);
    })()
      .catch(() => {
        if (active) {
          setStudents([]);
          toast.error(t("loadError"));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canViewClassReports, classId, t]);

  const exportCsv = () => {
    if (!students.length) return;
    const escapeCsv = (v: string | number) => {
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const headers = [t("colName"), t("colSex"), t("colBmi"), t("colZone"), t("colTests")];
    const rows = students.map((student) =>
      [
        escapeCsv(student.name),
        escapeCsv(student.sex),
        student.latestBiometric ? Number(student.latestBiometric.imc).toFixed(1) : "",
        escapeCsv(student.latestBiometric?.imcZone ?? ""),
        student.testCount,
      ].join(",")
    );
      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "turma_report.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(common("exportCsv"));
    };

  const importClassesCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsImportingCsv(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/classes/import", {
        method: "POST",
        body: formData,
      });
      const result = await readApiResponse<{
        createdAcademicYears: number;
        createdClasses: number;
        failed: number;
      }>(response);

      toast.success(
        `Importadas ${result.createdClasses} turmas (${result.createdAcademicYears} anos letivos novos)`,
      );
      if (result.failed > 0) {
        toast.warning(`${result.failed} linhas falharam validacao`);
      }

      await refetchClasses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro na importacao CSV");
    } finally {
      event.target.value = "";
      setIsImportingCsv(false);
    }
  };

  const stats = useMemo(() => {
    if (!students.length) return { total: 0, healthyPct: 0, pending: 0 };
    const total = students.length;
    let healthyCount = 0;
    let pendingCount = 0;
    for (const student of students) {
      const zone = student.latestBiometric?.imcZone ?? "";
      if (zone.toLowerCase().includes("saud") || zone === "ZSAF") healthyCount++;
      if (!student.latestBiometric) pendingCount++;
    }
    return {
      total,
      healthyPct: Math.round((healthyCount / total) * 100),
      pending: pendingCount,
    };
  }, [students]);

  const zoneChartData = useMemo(() => {
    if (!students.length) return [];
    let zsaf = 0;
    let zmf = 0;
    let noData = 0;
    for (const student of students) {
      const zone = student.latestBiometric?.imcZone ?? "";
      if (zone.toLowerCase().includes("saud") || zone === "ZSAF") zsaf++;
      else if (zone) zmf++;
      else noData++;
    }
    return [
      {
        name: t("className"),
        [t("healthyZone")]: zsaf,
        [t("improvementZone")]: zmf,
        [t("noDataLabel")]: noData,
      },
    ];
  }, [students, t]);

  if (!canViewClassReports) {
    return (
      <PageScaffold headerProps={{ title: t("title"), description: t("description"), eyebrow: "GESTÃO · TURMA" }}>
        <EmptyState
          icon={ShieldOff}
          title="Sem acesso a relatórios de turma"
          description="Esta área está reservada a professores e administradores."
        />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      headerProps={{ 
        title: t("title"), 
        description: t("description"), 
        eyebrow: "GESTÃO · TURMA" 
      }}
      headerActions={
        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={importClassesCsv}
          />
          <Button
            size="sm"
            variant="ghost"
            icon={<FileUp className="size-4" />}
            loading={isImportingCsv}
            onClick={() => importInputRef.current?.click()}
            className="rounded-full"
          >
            {common("importCsv")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Download className="size-4" />}
            onClick={exportCsv}
            disabled={!students.length}
            className="rounded-full"
          >
            {common("exportCsv")}
          </Button>
        </div>
      }
    >

      {/* Class Selection */}
      <div className="mb-8">
        {loadingClasses ? (
          <Skeleton className="h-14 w-full max-w-[320px] rounded-2xl" />
        ) : classesError ? (
          <EmptyState
            icon={Users}
            title="Erro ao carregar turmas"
            description="Tente novamente para selecionar uma turma."
            action={
              <Button size="sm" variant="secondary" onClick={() => void refetchClasses()}>
                Recarregar
              </Button>
            }
          />
        ) : classes.length > 0 ? (
          <div className="w-full max-w-[320px] animate-fade-in-up">
            <ClassPicker
              classes={classes}
              value={classId}
              onChange={(value) => {
                setLoading(true);
                setClassId(value);
                setStudents([]);
              }}
              placeholder={t("className")}
            />
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="Sem turmas"
            description="Ainda não existem turmas criadas."
          />
        )}
      </div>

      {!classId ? (
        <EmptyState
          icon={Users}
          title="Selecione uma Turma"
          description="Escolha uma turma acima para carregar o dashboard estratégico."
        />
      ) : loading ? (
        <div className="space-y-8 animate-fade-in">
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 min-w-[200px] rounded-3xl" />)}
          </div>
          <Skeleton className="h-96 w-full rounded-[2.5rem]" />
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Dashboard Summary Cards */}
          <section className="flex gap-4 overflow-x-auto pb-4 no-scrollbar animate-fade-in-up">
            {/* Total Alunos */}
            <div className="glass shadow-xl min-w-[180px] p-6 rounded-[2rem] flex flex-col gap-4 border border-white/5 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">groups</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Total Alunos</p>
                  <h2 className="text-3xl font-black text-foreground italic">{stats.total}</h2>
                </div>
            </div>

            {/* ZAF Saudável */}
            <div className="glass shadow-xl min-w-[240px] p-6 rounded-[2rem] flex flex-col gap-4 border border-white/5 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors" />
                <div className="flex items-center justify-between">
                   <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-2xl">verified_user</span>
                   </div>
                   <span className="text-secondary font-black text-lg italic">{stats.healthyPct}%</span>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">ZAF Saudável</p>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#eec147] to-[#f59e0b] shadow-[0_0_15px_rgba(238,193,71,0.3)] transition-all duration-1000" 
                      style={{ width: `${stats.healthyPct}%` }}
                    />
                  </div>
                </div>
            </div>

            {/* Pendente */}
            <div className="glass shadow-xl min-w-[180px] p-6 rounded-[2rem] flex flex-col gap-4 border border-white/5 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-20 h-20 bg-danger-500/5 rounded-full blur-2xl" />
                <div className="w-10 h-10 rounded-2xl bg-danger-500/10 flex items-center justify-center text-danger-400">
                  <span className="material-symbols-outlined text-2xl">report_problem</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Pendente</p>
                  <h2 className="text-3xl font-black text-danger-400 italic">{stats.pending.toString().padStart(2, '0')}</h2>
                </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">
            
            {/* Main Student List */}
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex justify-between items-center px-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 italic">Lista Escolar</h3>
                <span className="text-[10px] font-bold text-muted-foreground/40 bg-white/5 px-3 py-1 rounded-full">{students.length} RESULTADOS</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {students.map((student, idx) => {
                  const isHealthy = student.latestBiometric?.imcZone.toLowerCase().includes("saud") || student.latestBiometric?.imcZone === "ZSAF";
                  const isPending = !student.latestBiometric;

                  return (
                    <div 
                      key={student.id} 
                      className="glass p-5 rounded-[1.5rem] flex items-center justify-between border border-white/5 transition-all hover:scale-[1.01] hover:bg-white/[0.03] group animate-fade-in-up"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-center gap-5">
                          <Avatar className="size-14 rounded-2xl ring-2 ring-white/5 transition-transform group-hover:scale-110">
                            <AvatarFallback 
                              className="rounded-2xl text-xs font-black shadow-inner italic"
                              style={getStudentSwatch(student)}
                            >
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col gap-1">
                            <h4 className="font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{student.name}</h4>
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                {isPending ? "Pendente de Avaliação" : "Última Biometria: 12 Out"}
                            </p>
                          </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {isPending ? (
                          <span className="px-4 py-1.5 bg-danger-500/10 text-danger-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-danger-500/20 shadow-sm shadow-danger-500/20 italic">Pendente</span>
                        ) : isHealthy ? (
                          <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-500/20 shadow-sm shadow-emerald-500/20 italic">Saudável</span>
                        ) : (
                          <span className="px-4 py-1.5 bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-wider rounded-full border border-secondary/20 shadow-sm shadow-secondary/20 italic">Em Risco</span>
                        )}
                        <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tighter">Clique para ver perfil</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Analytics Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-28">
              <PageSection
                tone="secondary"
                layout="analytics"
                title={
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-2xl">analytics</span>
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Distribuição ZAF</span>
                  </div>
                }
                className="animate-fade-in-up delay-200"
              >
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zoneChartData} layout="vertical" margin={{ left: -20 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" hide />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'transparent' }} />
                      <Bar 
                        dataKey={t("healthyZone")} 
                        fill="#10b981" 
                        stackId="a" 
                        radius={[20, 0, 0, 20]} 
                      />
                      <Bar 
                        dataKey={t("improvementZone")} 
                        fill="#fbbf24" 
                        stackId="a" 
                      />
                      <Bar 
                        dataKey={t("noDataLabel")} 
                        fill="#4b5563" 
                        stackId="a" 
                        radius={[0, 20, 20, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5 px-2">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-emerald-400 font-black text-xl italic">{stats.healthyPct}%</span>
                        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest italic">Saudável</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-amber-400 font-black text-xl italic">{100 - stats.healthyPct}%</span>
                        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest italic">Intervenção</span>
                    </div>
                </div>
              </PageSection>

              <div className="rounded-[2rem] p-[1px] bg-gradient-to-br from-white/10 to-transparent">
                  <div className="bg-navy-950/40 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5 space-y-4">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                              <span className="material-symbols-outlined text-3xl">insights</span>
                          </div>
                      </div>
                      <h3 className="text-lg font-black text-foreground italic">Insight da Turma</h3>
                      <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                          Baseado nos últimos testes, a turma apresenta um bom desenvolvimento aeróbio, mas necessita de foco em flexibilidade.
                      </p>
                      <Button variant="sanctuary" className="w-full h-14 rounded-3xl font-black italic uppercase tracking-widest text-xs">
                          Ver Relatório IA
                      </Button>
                  </div>
              </div>
            </aside>

          </div>
        </div>
      )}
    </PageScaffold>
  );
}

