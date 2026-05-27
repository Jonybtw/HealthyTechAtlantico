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
  Mars,
  UserPlus,
  Venus,
  Target,
  Users,
} from "lucide-react";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { ClassPicker } from "@/components/ui/class-picker";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { PillSelect } from "@/components/ui/pill-select";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentIdentity } from "@/components/ui/student-identity";
import { useUser } from "@/components/user-context";
import { useClasses } from "@/hooks/use-queries";
import { readApiResponse } from "@/lib/api-client";

interface StudentRow {
  id: string;
  name: string;
  sex: string;
  className: string | null;
  processNumber: string | null;
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
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [quickStudentForm, setQuickStudentForm] = useState({
    processNumber: "",
    name: "",
    sex: "M",
    birthDate: "",
  });
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (classesError) {
      toast.error(t("loadError"));
    }
  }, [classesError, t]);

  useEffect(() => {
    if (!canViewClassReports || loadingClasses || classes.length === 0) {
      return;
    }

    setClassId((current) => {
      if (current && classes.some((item) => item.id === current)) {
        return current;
      }

      return classes[0].id;
    });
  }, [canViewClassReports, loadingClasses, classes]);

  useEffect(() => {
    if (!canViewClassReports || !classId) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    (async () => {
      const response = await fetch(
        `/api/classes/report?classId=${encodeURIComponent(classId)}`,
        { signal: controller.signal },
      );
      const body = await readApiResponse<StudentRow[]>(response);

      if (controller.signal.aborted) {
        return;
      }

      setStudents(body);
    })()
      .catch((error) => {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        if (controller.signal.aborted) {
          return;
        }

        setStudents([]);
        toast.error(t("loadError"));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [canViewClassReports, classId, t]);

  useEffect(() => {
    setQuickStudentForm({
      processNumber: "",
      name: "",
      sex: "M",
      birthDate: "",
    });
  }, [classId]);

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
        t("importSuccess", {
          classes: result.createdClasses,
          years: result.createdAcademicYears,
        }),
      );

      if (result.failed > 0) {
        toast.warning(t("importPartialWarning", { count: result.failed }));
      }

      await refetchClasses();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("importError"),
      );
    } finally {
      event.target.value = "";
      setIsImportingCsv(false);
    }
  };

  const selectedClass = classes.find((item) => item.id === classId) ?? null;

  const refreshSelectedClassStudents = async () => {
    if (!selectedClass) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/classes/report?classId=${encodeURIComponent(selectedClass.id)}`,
      );
      const body = await readApiResponse<StudentRow[]>(response);
      setStudents(body);
    } catch {
      setStudents([]);
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  const createStudentInSelectedClass = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedClass) {
      toast.error(t("selectClassBeforeCreate"));
      return;
    }

    setIsCreatingStudent(true);

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processNumber: quickStudentForm.processNumber.trim() || undefined,
          name: quickStudentForm.name.trim(),
          sex: quickStudentForm.sex,
          birthDate: quickStudentForm.birthDate || undefined,
          schoolYear: selectedClass.year,
          className: selectedClass.name,
        }),
      });

      await readApiResponse(response);

      toast.success(t("studentCreateSuccess"));
      setQuickStudentForm({
        processNumber: "",
        name: "",
        sex: "M",
        birthDate: "",
      });
      await refreshSelectedClassStudents();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("studentCreateError"),
      );
    } finally {
      setIsCreatingStudent(false);
    }
  };

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
  const hasAttentionStudents = attentionStudents.length > 0;

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
        key: "processNumber",
        header: t("colProcessNumber"),
        sortable: true,
        render: (student) =>
          student.processNumber ? (
            <span className="text-sm font-semibold text-foreground">
              {student.processNumber}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
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
              : "-"}
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
        }}
      >
        <EmptyState
          icon={AlertTriangle}
          title={t("accessDeniedTitle")}
          description={t("accessDeniedDescription")}
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
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="section-kicker">{t("workspaceEyebrow")}</p>
              <h2 className="section-title">{t("workspaceTitle")}</h2>
            </div>

            <div className="max-w-[420px] space-y-2">
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

            {classId ? (
              <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("classSummaryTitle")}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">
                    {selectedClass?.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedClass?.year}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info" size="md">
                    {stats.coveragePct}% {t("coverageShort")}
                  </Badge>
                  <Badge
                    variant={stats.attention > 0 ? "warning" : "success"}
                    size="md"
                  >
                    {stats.attention} {t("attentionQueueCompact")}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("classSummaryEmpty")}
              </p>
            )}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title={t("noClassesTitle")}
            description={t("noClassesDescription")}
          />
        )}
      </PageSection>

      {!classId ? null : loading ? (
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Skeleton className="h-[640px] rounded-2xl" />
            <Skeleton className="h-[320px] rounded-2xl" />
          </div>
        </div>
      ) : (
        <div
          className={
            hasAttentionStudents
              ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
              : "grid gap-5"
          }
        >
          <PageSection
            tone="secondary"
            layout="list"
            actions={
              hasAttentionStudents ? undefined : (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={<ChartIcon className="size-4" />}
                  onClick={() => router.push("/analise")}
                >
                  {t("openAnalysis")}
                </Button>
              )
            }
          >
            <ClassSnapshotBar
              total={stats.total}
              withData={stats.withData}
              healthy={stats.healthy}
              healthyPct={stats.healthyPct}
              improvement={stats.improvement}
              noData={stats.noData}
              attention={stats.attention}
              coveragePct={stats.coveragePct}
              totalLabel={t("totalStudentsTitle")}
              coverageLabel={t("biometricCoverageTitle")}
              healthyLabel={t("healthyZone")}
              attentionLabel={t("attentionQueueTitle")}
              improvementLabel={t("improvementZone")}
              noDataLabel={t("noDataLabel")}
              studentsUnit={t("studentsUnit")}
              withDataLabel={t("withDataLabel")}
              attentionEmptyLabel={t("attentionNoneTitle")}
            />
            <form
              onSubmit={createStudentInSelectedClass}
              className="space-y-4 rounded-2xl border border-border/70 bg-background/60 p-4"
            >
              <div className="min-w-0">
                <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("quickAddEyebrow")}
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                  {t("quickAddTitle")}
                </h3>
              </div>

              <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.45fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,0.8fr)] xl:items-end">
                <Input
                  label={t("colProcessNumber")}
                  value={quickStudentForm.processNumber}
                  onChange={(event) =>
                    setQuickStudentForm((current) => ({
                      ...current,
                      processNumber: event.target.value,
                    }))
                  }
                  placeholder={t("processNumberPlaceholder")}
                  disabled={isCreatingStudent}
                />
                <Input
                  label={t("colName")}
                  value={quickStudentForm.name}
                  onChange={(event) =>
                    setQuickStudentForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder={t("studentNamePlaceholder")}
                  disabled={isCreatingStudent}
                  required
                />
                <PillSelect
                  label={t("colSex")}
                  size="lg"
                  options={[
                    {
                      value: "M",
                      label: t("male"),
                      icon: <Mars className="size-3.5" />,
                    },
                    {
                      value: "F",
                      label: t("female"),
                      icon: <Venus className="size-3.5" />,
                    },
                  ]}
                  value={quickStudentForm.sex}
                  onChange={(value) =>
                    setQuickStudentForm((current) => ({
                      ...current,
                      sex: value,
                    }))
                  }
                />
                <DateField
                  label={t("birthDateLabel")}
                  value={quickStudentForm.birthDate}
                  onChange={(value) =>
                    setQuickStudentForm((current) => ({
                      ...current,
                      birthDate: value,
                    }))
                  }
                  disabled={isCreatingStudent}
                />
                <Button
                  type="submit"
                  size="xl"
                  className="h-14 w-full sm:col-span-2 lg:col-span-1"
                  icon={<UserPlus className="size-4" />}
                  loading={isCreatingStudent}
                  disabled={!selectedClass || !quickStudentForm.name.trim()}
                >
                  {t("quickAddButton")}
                </Button>
              </div>
            </form>
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

          {hasAttentionStudents ? (
            <PageSection
              tone="utility"
              layout="list"
              title={t("attentionQueueTitle")}
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
            </PageSection>
          ) : null}
        </div>
      )}
    </PageScaffold>
  );
}

function ClassSnapshotBar({
  total,
  withData,
  healthy,
  healthyPct,
  improvement,
  noData,
  attention,
  coveragePct,
  totalLabel,
  healthyLabel,
  attentionLabel,
  improvementLabel,
  noDataLabel,
  coverageLabel,
  studentsUnit,
  withDataLabel,
  attentionEmptyLabel,
}: {
  total: number;
  withData: number;
  healthy: number;
  healthyPct: number;
  improvement: number;
  noData: number;
  attention: number;
  coveragePct: number;
  totalLabel: string;
  healthyLabel: string;
  attentionLabel: string;
  improvementLabel: string;
  noDataLabel: string;
  coverageLabel: string;
  studentsUnit: string;
  withDataLabel: string;
  attentionEmptyLabel: string;
}) {
  const safeTotal = total || 1;
  const healthyWidth = (healthy / safeTotal) * 100;
  const improvementWidth = (improvement / safeTotal) * 100;
  const noDataWidth = (noData / safeTotal) * 100;

  return (
    <div className="space-y-4 rounded-3xl border border-border/70 bg-background/60 p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricChip
          icon={Users}
          label={totalLabel}
          value={String(total)}
          meta={studentsUnit}
        />
        <MetricChip
          icon={ChartIcon}
          label={coverageLabel}
          value={`${withData}/${total}`}
          meta={`${coveragePct}% ${withDataLabel}`}
        />
        <MetricChip
          icon={Target}
          label={healthyLabel}
          value={`${healthyPct}%`}
          meta={`${healthy} ${healthyLabel}`}
        />
        <MetricChip
          icon={AlertTriangle}
          label={attentionLabel}
          value={String(attention)}
          meta={
            attention > 0 ? `${attention} ${attentionLabel.toLowerCase()}` : attentionEmptyLabel
          }
        />
      </div>

      <div className="space-y-2">
        <div className="overflow-hidden rounded-full bg-muted/70">
          <div className="flex h-2.5 w-full">
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

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <LegendPill label={healthyLabel} value={healthy} tone="success" />
          <LegendPill
            label={improvementLabel}
            value={improvement}
            tone="danger"
          />
          <LegendPill label={noDataLabel} value={noData} tone="default" />
        </div>
      </div>
    </div>
  );
}

function MetricChip({
  icon: Icon,
  label,
  value,
  meta,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/58 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-foreground">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
        </div>
        <div className="rounded-full border border-border/70 bg-background/80 p-2 text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

function LegendPill({
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
    <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
      <span className={`size-2 rounded-full ${dotClassName}`} />
      <span>{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
