"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download, Users } from "lucide-react";
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
import { PageHeader } from "@/components/ui/page-header";
import { PillSelect } from "@/components/ui/pill-select";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface ClassOption {
  id: string;
  name: string;
  year: string;
}

interface StudentRow {
  id: string;
  name: string;
  sex: string;
  className: string | null;
  latestBiometric: { imc: number | string; imcZone: string } | null;
  testCount: number;
  [key: string]: unknown;
}

export default function TurmaPage() {
  const t = useTranslations("turma");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classId, setClassId] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* Load classes */
  const loadClasses = useCallback(async () => {
    const res = await fetch("/api/classes");
    if (res.ok) {
      const body = await res.json();
      // API returns academic years with nested classes
      const allClasses: ClassOption[] = [];
      for (const ay of body as { label: string; classes: { id: string; name: string }[] }[]) {
        for (const c of ay.classes) {
          allClasses.push({ id: c.id, name: c.name, year: ay.label });
        }
      }
      setClasses(allClasses);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  /* Load class report */
  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    const cls = classes.find((c) => c.id === classId);
    const year = cls?.year ?? "";
    fetch(`/api/classes/report?year=${encodeURIComponent(year)}`)
      .then(async (res) => {
        if (res.ok) {
          const body = await res.json();
          setStudents(Array.isArray(body) ? body : []);
        }
      })
      .finally(() => setLoading(false));
  }, [classId, classes]);

  /* CSV export */
  const exportCsv = () => {
    if (!students.length) return;
    const headers = ["Nome", "Sexo", "IMC", "Zona", "Testes"];
    const rows = students.map((s) =>
      [
        s.name,
        s.sex,
        s.latestBiometric ? Number(s.latestBiometric.imc).toFixed(1) : "",
        s.latestBiometric?.imcZone ?? "",
        s.testCount,
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

  /* Zone distribution for bar chart */
  const zoneChartData = (() => {
    if (!students.length) return [];
    let zsaf = 0, zmf = 0, noData = 0;
    for (const s of students) {
      const zone = s.latestBiometric?.imcZone ?? "";
      if (zone.toLowerCase().includes("saud") || zone === "ZSAF") zsaf++;
      else if (zone) zmf++;
      else noData++;
    }
    return [{ name: "Turma", "Zona Saudável": zsaf, "Zona de Melhoria": zmf, "Sem dados": noData }];
  })();

  const columns: Column<StudentRow>[] = [
    { key: "name", header: t("colName"), sortable: true },
    { key: "sex", header: t("colSex"), sortable: true, className: "w-16 text-center" },
    {
      key: "imc",
      header: t("colBmi"),
      sortable: true,
      className: "w-20 text-right",
      render: (r) => (r.latestBiometric ? Number(r.latestBiometric.imc).toFixed(1) : "—"),
    },
    {
      key: "imcZone",
      header: t("colZone"),
      sortable: true,
      render: (r) => <ZoneBadge zone={r.latestBiometric?.imcZone ?? ""} />,
    },
    {
      key: "testCount",
      header: t("colTests"),
      sortable: true,
      className: "w-16 text-center",
      render: (r) => r.testCount,
    },
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
      >
        <Button
          size="sm"
          variant="secondary"
          icon={<Download className="size-4" />}
          onClick={exportCsv}
          disabled={!students.length}
        >
          {t("exportCsv")}
        </Button>
      </PageHeader>

      {/* class selector */}
      {classes.length > 0 && (
        <div className="flex items-center gap-3">
          <Users className="size-4 text-muted-foreground" />
          <PillSelect
            options={classes.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.year})`,
            }))}
            value={classId ?? ""}
            onChange={(v) => setClassId(v)}
          />
        </div>
      )}

      {!classId ? (
        <EmptyState
          icon={Users}
          title="Nenhuma Turma Selecionada"
          description={t("selectYear")}
        />
      ) : loading ? (
        <div className="flex flex-col gap-6 animate-fade-in">
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {/* ZAF distribution bar chart */}
          {zoneChartData.length > 0 && (
            <div className="bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-6 animate-fade-in-up">
              <h3 className="text-base font-bold tracking-tight mb-4">Distribuição ZAF</h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zoneChartData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "var(--color-foreground)", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }} />
                    <Legend wrapperStyle={{ paddingTop: "10px" }} />
                    <Bar dataKey="Zona Saudável" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} animationDuration={1000} />
                    <Bar dataKey="Zona de Melhoria" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} animationDuration={1000} />
                    <Bar dataKey="Sem dados" fill="var(--color-muted)" stackId="a" radius={[0, 4, 4, 0]} animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          <div className="animate-fade-in-up delay-100">
            <DataTable
              columns={columns}
              data={students}
              rowKey={(r) => r.id}
              emptyMessage={t("noStudents")}
            />
          </div>
        </>
      )}
    </div>
  );
}
