"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  Download,
  FileUp,
  LineChart as ChartIcon,
  Target,
  Users,
} from "lucide-react";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { ClassPicker } from "@/components/ui/class-picker";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/ui/kpi-card";
import { StudentIdentity } from "@/components/ui/student-identity";
import { useUser } from "@/components/user-context";
import { useClasses } from "@/hooks/use-queries";
import { readApiResponse } from "@/lib/api-client";

interface StudentRow {
  id: string;
  name: string;
  sex: string;
  className: string | null;
  latestBiometric: { imc: number | string; imcZone: string } | null;
  testCount: number;
}

function isHealthyZone(zone: string | null | undefined) {
  if (!zone) {
    return false;
  }

  const normalized = zone
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return normalized.includes("saudavel") || normalized.includes("healthy") || normalized.includes("zsaf");
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
      const response = await fetch(
        `/api/classes/report?classId=${encodeURIComponent(classId)}`,
      );
      const body = await readApiResponse<StudentRow[]>(response);

      if (!active) {
        return;
      }

      setStudents(body);
    })()
      .catch(() => {
        if (!active) {
          return;
        }

        setStudents([]);
        toast.error(t("loadError"));
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

  const selectedClass = classes.find((item) => item.id === classId) ?? null;

  const stats = useMemo(() => {
    const total = students.length;
    let healthy = 0;
    let improvement = 0;
    let noData = 0;

    for (const student of students) {
      if (!student.latestBiometric) {
        noData += 1;
        continue;
      }

      if (isHealthyZone(student.latestBiometric.imcZone)) {
        healthy += 1;
      } else {
        improvement += 1;
      }
    }

    const withData = total - noData;

    return {
      total,
      healthy,
      improvement,
      noData,
      withData,
      attention: improvement + noData,
      healthyPct: total > 0 ? Math.round((healthy / total) * 100) : 0,
      coveragePct: total > 0 ? Math.round((withData / total) * 100) : 0,
    };
  }, [students]);

  const classInsight = useMemo(() => {
    if (!students.length) {
      return t("insightSelectClass");
    }

    if (stats.noData === stats.total) {
      return t("insightNoCoverage");
    }

    if (stats.noData > 0) {
      return t("insightPendingCoverage", { count: stats.noData });
    }

    if (stats.healthyPct >= 70) {
      return t("insightHealthyHigh", { percent: stats.healthyPct });
    }

    if (stats.healthyPct >= 50) {
      return t("insightHealthyMid", { percent: stats.healthyPct });
    }

    return t("insightHealthyLow");
  }, [stats.healthyPct, stats.noData, stats.total, students.length, t]);

  const attentionStudents = useMemo(() => {
    return [...students]
      .filter((student) => {
        if (!student.latestBiometric) {
          return true;
        }

        return !isHealthyZone(student.latestBiometric.imcZone);
      })
      .sort((left, right) => {
        const leftMissing = left.latestBiometric ? 1 : 0;
        const rightMissing = right.latestBiometric ? 1 : 0;

        if (leftMissing !== rightMissing) {
          return leftMissing - rightMissing;
        }

        return left.name.localeCompare(right.name, "pt");
      });
  }, [students]);

  const columns = useMemo<Column<StudentRow>[]>(() => {
    return [
      {
        key: "name",
        header: t("colName"),
        sortable: true,
        className: "min-w-[260px]",
        render: (student) => <StudentIdentity student={student} />,
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
              {t("attentionReasonNoData")}
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
    ];
  }, [t]);

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
            variant="primary"
            icon={<FileUp className="size-4" />}
            loading={isImportingCsv}
            onClick={() => importInputRef.current?.click()}
          >
            {common("importCsv")}
          </Button>
          <Button
            size="sm"
            variant="primary"
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
        tone="primary"
        layout="analytics"
        eyebrow={t("workspaceEyebrow")}
        title={t("workspaceTitle")}
        description={t("workspaceDescription")}
      >
        {loadingClasses ? (
          <Skeleton className="h-28 rounded-2xl" />
        ) : classesError ? (
          <EmptyState
            icon={Users}
            title={t("loadClassesFailedTitle")}
            description={t("loadClassesFailedDescription")}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void refetchClasses()}
              >
                {common("refresh")}
              </Button>
            }
          />
        ) : classes.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
            <div className="space-y-2">
              <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("className")}
              </p>
              <ClassPicker
                classes={classes}
                value={classId}
                onChange={(value) => {
                  setClassId(value);
                  setStudents([]);
                }}
                placeholder={t("className")}
                className="w-full"
              />
            </div>

            <div className="rounded-[28px] border border-border/70 bg-background/68 p-5">
              <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t("classSummaryTitle")}
              </p>
              <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
                    {selectedClass?.name ?? t("noClassSelected")}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedClass?.year ?? t("classSummaryEmpty")}
                  </p>
                </div>
                {classId ? (
                  <Badge variant="info" size="md">
                    {stats.coveragePct}% {t("coverageShort")}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {classInsight}
              </p>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title={t("noClassesTitle")}
            description={t("noClassesDescription")}
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
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-40 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_360px]">
            <Skeleton className="h-[560px] rounded-2xl" />
            <div className="grid gap-5">
              <Skeleton className="h-[260px] rounded-2xl" />
              <Skeleton className="h-[320px] rounded-2xl" />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={Users}
              title={t("totalStudentsTitle")}
              value={stats.total}
              description={t("studentsUnit")}
              accent="blue"
            />
            <KpiCard
              icon={ChartIcon}
              title={t("biometricCoverageTitle")}
              value={`${stats.withData}/${stats.total}`}
              description={`${stats.coveragePct}% ${t("withDataLabel")}`}
              accent="green"
            />
            <KpiCard
              icon={Target}
              title={t("healthyZoneTitle")}
              value={`${stats.healthyPct}%`}
              description={`${stats.healthy} ${t("healthyZone")}`}
              accent="gold"
            />
            <KpiCard
              icon={AlertTriangle}
              title={t("attentionQueueTitle")}
              value={stats.attention}
              description={t("attentionQueueCompact")}
              accent="red"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_360px]">
            <PageSection
              tone="secondary"
              layout="list"
              title={t("rosterTitle")}
              description={t("rosterDescription", { count: students.length })}
            >
              <DataTable
                columns={columns}
                data={students}
                rowKey={(student) => student.id}
                onRowClick={(student) => router.push(`/alunos/${student.id}`)}
                emptyMessage={t("noStudents")}
                toolbarTitle={t("rosterToolbarTitle")}
                toolbarSummary={`${students.length} ${t("studentsUnit")}`}
                searchPlaceholder={t("searchStudents")}
              />
            </PageSection>

            <div className="grid gap-5">
              <PageSection
                tone="secondary"
                layout="analytics"
                title={t("coverageTitle")}
                description={t("coverageDescription")}
              >
                <ClassCoveragePanel
                  healthy={stats.healthy}
                  improvement={stats.improvement}
                  noData={stats.noData}
                  total={stats.total}
                  coveragePct={stats.coveragePct}
                  healthyLabel={t("healthyZone")}
                  improvementLabel={t("improvementZone")}
                  noDataLabel={t("noDataLabel")}
                  coverageLabel={t("biometricCoverageTitle")}
                />
              </PageSection>

              <PageSection
                tone="utility"
                layout="list"
                title={t("attentionQueueTitle")}
                description={t("attentionQueueDescription")}
                actions={
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    icon={<ChartIcon className="size-4" />}
                    onClick={() => router.push("/analise")}
                  >
                    {t("openAnalysis")}
                  </Button>
                }
              >
                {attentionStudents.length > 0 ? (
                  <div className="space-y-3">
                    {attentionStudents.slice(0, 5).map((student) => {
                      const needsBiometrics = !student.latestBiometric;
                      const badgeVariant = needsBiometrics ? "warning" : "danger";
                      const badgeLabel = needsBiometrics
                        ? t("attentionReasonNoData")
                        : t("attentionReasonImprovement");

                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => router.push(`/alunos/${student.id}`)}
                          className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-background/72 px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-300/40 hover:shadow-card"
                        >
                          <div className="min-w-0 flex-1">
                            <StudentIdentity
                              student={student}
                              subtitle={
                                <span>
                                  {student.testCount} {t("testsRecordedLabel")}
                                </span>
                              }
                            />
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge variant={badgeVariant} size="sm">
                                {badgeLabel}
                              </Badge>
                            </div>
                          </div>

                          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-success-500/18 bg-success-500/6 px-4 py-4">
                    <p className="text-sm font-semibold text-foreground">
                      {t("attentionNoneTitle")}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {t("attentionNoneDescription")}
                    </p>
                  </div>
                )}
              </PageSection>
            </div>
          </div>
        </>
      )}
    </PageScaffold>
  );
}

function ClassCoveragePanel({
  total,
  healthy,
  improvement,
  noData,
  coveragePct,
  healthyLabel,
  improvementLabel,
  noDataLabel,
  coverageLabel,
}: {
  total: number;
  healthy: number;
  improvement: number;
  noData: number;
  coveragePct: number;
  healthyLabel: string;
  improvementLabel: string;
  noDataLabel: string;
  coverageLabel: string;
}) {
  const safeTotal = total || 1;
  const healthyWidth = (healthy / safeTotal) * 100;
  const improvementWidth = (improvement / safeTotal) * 100;
  const noDataWidth = (noData / safeTotal) * 100;

  return (
    <div className="space-y-4 rounded-[28px] border border-border/70 bg-background/70 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {coverageLabel}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-foreground">
            {coveragePct}%
          </p>
        </div>
        <Badge variant="info" size="md">
          {total} alunos
        </Badge>
      </div>

      <div className="overflow-hidden rounded-full bg-muted/80">
        <div className="flex h-4 w-full">
          <div
            className="h-full bg-success-500"
            style={{ width: `${healthyWidth}%` }}
          />
          <div
            className="h-full bg-danger-500"
            style={{ width: `${improvementWidth}%` }}
          />
          <div
            className="h-full bg-navy-400"
            style={{ width: `${noDataWidth}%` }}
          />
        </div>
      </div>

      <div className="grid gap-3">
        <CoverageStatRow label={healthyLabel} value={healthy} tone="success" />
        <CoverageStatRow
          label={improvementLabel}
          value={improvement}
          tone="danger"
        />
        <CoverageStatRow label={noDataLabel} value={noData} tone="default" />
      </div>
    </div>
  );
}

function CoverageStatRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "danger" | "default";
}) {
  const dotClassName =
    tone === "success"
      ? "bg-success-500"
      : tone === "danger"
        ? "bg-danger-500"
        : "bg-navy-400";

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className={`size-2.5 rounded-full ${dotClassName}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-lg font-semibold tracking-[-0.03em] text-foreground">
        {value}
      </span>
    </div>
  );
}
