"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertTriangle,
  Download,
  FileUp,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { ClassPicker } from "@/components/ui/class-picker";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartFrame } from "@/components/ui/chart-frame";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { useUser } from "@/components/user-context";
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
  const router = useRouter();
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
  const [classId, setClassId] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (classesError) {
      toast.error(t("loadError"));
    }
  }, [classesError, t]);

  useEffect(() => {
    if (!canViewClassReports || !classId) {
      return;
    }

    let active = true;
    setLoading(true);

    (async () => {
      const res = await fetch(
        `/api/classes/report?classId=${encodeURIComponent(classId)}`,
      );
      const body = await readApiResponse<StudentRow[]>(res);
      if (!active) {
        return;
      }
      setStudents(body);
    })()
      .catch(() => {
        if (active) {
          setStudents([]);
          toast.error(t("loadError"));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [canViewClassReports, classId, t]);

  const exportCsv = () => {
    if (!students.length) {
      return;
    }

    const escapeCsv = (value: string | number) => {
      const nextValue = String(value);
      return nextValue.includes(",") ||
        nextValue.includes('"') ||
        nextValue.includes("\n")
        ? `"${nextValue.replace(/"/g, '""')}"`
        : nextValue;
    };

    const headers = [
      t("colName"),
      t("colSex"),
      t("colBmi"),
      t("colZone"),
      t("colTests"),
    ];
    const rows = students.map((student) =>
      [
        escapeCsv(student.name),
        escapeCsv(student.sex),
        student.latestBiometric
          ? Number(student.latestBiometric.imc).toFixed(1)
          : "",
        escapeCsv(student.latestBiometric?.imcZone ?? ""),
        student.testCount,
      ].join(","),
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

  const importClassesCsv = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
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
      toast.error(
        error instanceof Error ? error.message : "Erro na importacao CSV",
      );
    } finally {
      event.target.value = "";
      setIsImportingCsv(false);
    }
  };

  const stats = useMemo(() => {
    if (!students.length) {
      return { total: 0, healthyPct: 0, pending: 0 };
    }

    const total = students.length;
    let healthyCount = 0;
    let pendingCount = 0;

    for (const student of students) {
      const zone = student.latestBiometric?.imcZone ?? "";
      if (zone.toLowerCase().includes("saud") || zone === "ZSAF") {
        healthyCount += 1;
      }
      if (!student.latestBiometric) {
        pendingCount += 1;
      }
    }

    return {
      total,
      healthyPct: Math.round((healthyCount / total) * 100),
      pending: pendingCount,
    };
  }, [students]);

  const zoneChartData = useMemo(() => {
    if (!students.length) {
      return [];
    }

    let healthy = 0;
    let improvement = 0;
    let noData = 0;

    for (const student of students) {
      const zone = student.latestBiometric?.imcZone ?? "";
      if (zone.toLowerCase().includes("saud") || zone === "ZSAF") {
        healthy += 1;
      } else if (zone) {
        improvement += 1;
      } else {
        noData += 1;
      }
    }

    return [
      {
        name: t("className"),
        [t("healthyZone")]: healthy,
        [t("improvementZone")]: improvement,
        [t("noDataLabel")]: noData,
      },
    ];
  }, [students, t]);

  const classInsight = useMemo(() => {
    if (!students.length) {
      return "Selecione uma turma com registos para gerar a leitura rapida.";
    }

    if (stats.pending === stats.total) {
      return "A turma ainda nao tem medicoes biometricas registadas.";
    }

    if (stats.pending > 0) {
      return `${stats.pending} aluno${stats.pending === 1 ? "" : "s"} continuam pendentes de avaliacao, o que pode distorcer a leitura agregada.`;
    }

    if (stats.healthyPct >= 70) {
      return `${stats.healthyPct}% da turma esta em zona saudavel, com uma base consistente para acompanhamento preventivo.`;
    }

    if (stats.healthyPct >= 50) {
      return `${stats.healthyPct}% da turma esta em zona saudavel; vale a pena reforcar acompanhamento nos alunos em melhoria.`;
    }

    return `A maioria da turma esta fora da zona saudavel; recomenda-se priorizar intervencao e nova medicao de seguimento.`;
  }, [stats, students.length]);

  const columns = useMemo<Column<StudentRow>[]>(
    () => [
      {
        key: "name",
        header: t("colName"),
        sortable: true,
        className: "min-w-[260px]",
        render: (student) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-11 rounded-2xl ring-1 ring-border/70">
              <AvatarFallback
                className="rounded-2xl text-xs font-semibold"
                style={getStudentSwatch(student)}
              >
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {student.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {student.className ?? t("className")}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "sex",
        header: t("colSex"),
        sortable: true,
        render: (student) => (
          <span className="text-sm font-medium text-foreground">
            {student.sex}
          </span>
        ),
      },
      {
        key: "latestBiometric",
        header: t("colBmi"),
        sortable: true,
        render: (student) => (
          <span className="text-sm font-semibold text-foreground">
            {student.latestBiometric
              ? Number(student.latestBiometric.imc).toFixed(1)
              : "—"}
          </span>
        ),
      },
      {
        key: "zone",
        header: t("colZone"),
        render: (student) =>
          student.latestBiometric ? (
            <ZoneBadge zone={student.latestBiometric.imcZone} size="sm" />
          ) : (
            <Badge variant="warning" size="sm">
              {t("noDataLabel")}
            </Badge>
          ),
      },
      {
        key: "testCount",
        header: t("colTests"),
        sortable: true,
        render: (student) => (
          <span className="text-sm font-semibold text-foreground">
            {student.testCount}
          </span>
        ),
      },
    ],
    [t],
  );

  if (!canViewClassReports) {
    return (
      <PageScaffold
        headerProps={{
          title: t("title"),
          description: t("description"),
          eyebrow: "GESTAO · TURMA",
        }}
      >
        <EmptyState
          icon={AlertTriangle}
          title="Sem acesso a relatorios de turma"
          description="Esta area esta reservada a professores e administradores."
        />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      className="gap-5"
      headerProps={{
        title: t("title"),
        description: t("description"),
        eyebrow: "GESTAO · TURMA",
      }}
      headerActions={
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={importClassesCsv}
          />
          <Button
            size="sm"
            variant="outline"
            icon={<FileUp className="size-4" />}
            loading={isImportingCsv}
            onClick={() => importInputRef.current?.click()}
          >
            {common("importCsv")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<Download className="size-4" />}
            onClick={exportCsv}
            disabled={!students.length}
          >
            {common("exportCsv")}
          </Button>
        </div>
      }
    >
      <PageSection
        tone="utility"
        title="Selecao da turma"
        description="Escolha uma turma para carregar os indicadores e a lista de alunos."
      >
        {loadingClasses ? (
          <Skeleton className="h-14 w-full max-w-[320px] rounded-2xl" />
        ) : classesError ? (
          <EmptyState
            icon={Users}
            title="Erro ao carregar turmas"
            description="Tente novamente para selecionar uma turma."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void refetchClasses()}
              >
                Recarregar
              </Button>
            }
          />
        ) : classes.length > 0 ? (
          <div className="w-full max-w-[320px]">
            <ClassPicker
              classes={classes}
              value={classId}
              onChange={(value) => {
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
            description="Ainda nao existem turmas criadas."
          />
        )}
      </PageSection>

      {!classId ? (
        <EmptyState
          icon={Users}
          title={t("noClassSelected")}
          description={t("noClassSelectedDesc")}
        />
      ) : loading ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_340px]">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-44 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-[420px] rounded-xl" />
          </div>
          <div className="grid gap-4">
            <Skeleton className="h-[320px] rounded-xl" />
            <Skeleton className="h-[220px] rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard
              icon={Users}
              title="Total de alunos"
              value={stats.total}
              description={t("studentsUnit")}
              accent="blue"
            />
            <KpiCard
              icon={Target}
              title={t("healthyZone")}
              value={stats.healthyPct}
              description="%"
              accent="gold"
            />
            <KpiCard
              icon={AlertTriangle}
              title="Pendentes"
              value={stats.pending}
              description="por avaliar"
              accent="red"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_340px]">
            <PageSection
              tone="secondary"
              layout="list"
              title="Alunos da turma"
              description={`${students.length} ${t("studentsUnit")} com resumo biometrico e de testes.`}
            >
              <DataTable
                columns={columns}
                data={students}
                rowKey={(student) => student.id}
                onRowClick={(student) => router.push(`/alunos/${student.id}`)}
                emptyMessage={t("noStudents")}
                toolbarTitle={t("title")}
                toolbarSummary={`${students.length} ${t("studentsUnit")}`}
              />
            </PageSection>

            <div className="grid gap-5">
              <PageSection
                tone="secondary"
                layout="analytics"
                title={t("zafDistribution")}
                description="Distribuicao atual da turma entre zona saudavel, zona de melhoria e alunos sem dados."
              >
                <ChartFrame className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={zoneChartData}
                      layout="vertical"
                      margin={{ top: 12, right: 8, bottom: 12, left: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" hide />
                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{ fill: "transparent" }}
                      />
                      <Bar
                        dataKey={t("healthyZone")}
                        fill="var(--color-success-500)"
                        stackId="zone"
                        radius={[18, 0, 0, 18]}
                      />
                      <Bar
                        dataKey={t("improvementZone")}
                        fill="var(--color-warning-500)"
                        stackId="zone"
                      />
                      <Bar
                        dataKey={t("noDataLabel")}
                        fill="var(--color-navy-400)"
                        stackId="zone"
                        radius={[0, 18, 18, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-border/60 bg-background/45 px-3 py-3 text-center">
                    <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {t("healthyZone")}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-success-600">
                      {stats.healthyPct}%
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/45 px-3 py-3 text-center">
                    <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {t("improvementZone")}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-warning-600">
                      {Math.max(0, 100 - stats.healthyPct - Math.round((stats.pending / Math.max(stats.total, 1)) * 100))}%
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/45 px-3 py-3 text-center">
                    <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {t("noDataLabel")}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-navy-700 dark:text-navy-200">
                      {stats.pending}
                    </p>
                  </div>
                </div>
              </PageSection>

              <PageSection
                tone="utility"
                layout="list"
                title="Leitura rapida"
                description="Resumo imediato para decidir o proximo acompanhamento."
              >
                <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/45 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gold-400/18 text-gold-700 dark:text-gold-300">
                    <Sparkles className="size-5" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      Insight da turma
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {classInsight}
                    </p>
                  </div>
                </div>
              </PageSection>
            </div>
          </div>
        </>
      )}
    </PageScaffold>
  );
}
