"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download, FileUp, Users } from "lucide-react";
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
import { PillSelect } from "@/components/ui/pill-select";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { useClasses } from "@/hooks/use-queries";
import { usePageTitle } from "@/hooks/use-page-title";
import { readApiResponse } from "@/lib/api-client";

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
  usePageTitle(t("title"));
  const { role } = useUser();
  const canViewClassReports = role === "ADMIN" || role === "PROFESSOR";
  const {
    data: classes = [],
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
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportCsv"));
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

  const columns: Column<StudentRow>[] = [
    {
      key: "name",
      header: t("colName"),
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="text-[10px] bg-navy-100 text-navy-700 dark:bg-navy-900 dark:text-navy-300">
              {row.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0]?.toUpperCase())
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      key: "sex",
      header: t("colSex"),
      sortable: true,
      className: "w-16 text-center",
    },
    {
      key: "imc",
      header: t("colBmi"),
      sortable: true,
      className: "w-20 text-right",
      render: (row) =>
        row.latestBiometric ? Number(row.latestBiometric.imc).toFixed(1) : "—",
    },
    {
      key: "imcZone",
      header: t("colZone"),
      sortable: true,
      render: (row) => <ZoneBadge zone={row.latestBiometric?.imcZone ?? ""} />,
    },
    {
      key: "testCount",
      header: t("colTests"),
      sortable: true,
      className: "w-16 text-center",
      render: (row) => row.testCount,
    },
  ];

  if (!canViewClassReports) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">{common("noPermission")}</p>
      </div>
    );
  }

  return (
    <PageScaffold
      headerProps={{ title: t("title"), description: t("description") }}
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
            variant="secondary"
            icon={<FileUp className="size-4" />}
            loading={isImportingCsv}
            onClick={() => importInputRef.current?.click()}
          >
            CSV
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Download className="size-4" />}
            onClick={exportCsv}
            disabled={!students.length}
          >
            {t("exportCsv")}
          </Button>
        </div>
      }
    >

      {classes.length > 0 && (
        <PageSection tone="utility" layout="list">
          <div className="flex items-center gap-3">
            <Users className="size-4 text-muted-foreground" />
            <PillSelect
              options={classes.map((schoolClass) => ({
                value: schoolClass.id,
                label: `${schoolClass.name} (${schoolClass.year})`,
              }))}
              value={classId}
              onChange={(value) => {
                setLoading(true);
                setClassId(value);
                setStudents([]);
              }}
            />
          </div>
        </PageSection>
      )}

      {!classId ? (
        <EmptyState
          icon={Users}
          title={t("noClassSelected")}
          description={t("noClassSelectedDesc")}
        />
      ) : loading ? (
        <div className="flex flex-col gap-5 animate-fade-in">
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {zoneChartData.length > 0 && (
            <PageSection
              tone="secondary"
              layout="analytics"
              title={t("zafDistribution")}
              className="animate-fade-in-up"
            >
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={zoneChartData}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                    barSize={40}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{
                        fill: "var(--color-foreground)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "10px" }} />
                    <Bar
                      dataKey={t("healthyZone")}
                      fill="var(--color-success-500)"
                      stackId="a"
                      radius={[0, 0, 0, 0]}
                      animationDuration={1000}
                    />
                    <Bar
                      dataKey={t("improvementZone")}
                      fill="var(--color-warning-500)"
                      stackId="a"
                      radius={[0, 0, 0, 0]}
                      animationDuration={1000}
                    />
                    <Bar
                      dataKey={t("noDataLabel")}
                      fill="var(--color-muted-foreground)"
                      stackId="a"
                      radius={[0, 4, 4, 0]}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PageSection>
          )}
          <div className="animate-fade-in-up delay-100">
            <DataTable
              columns={columns}
              data={students}
              rowKey={(row) => row.id}
              emptyMessage={t("noStudents")}
              toolbarTitle={t("className")}
              toolbarSummary={
                <span>
                  {students.length} {t("studentsUnit")}
                </span>
              }
            />
          </div>
        </>
      )}
    </PageScaffold>
  );
}
