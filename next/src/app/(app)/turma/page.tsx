"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Download, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PillSelect } from "@/components/ui/pill-select";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";

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
    const headers = ["Nome", "Sexo", "IMC", "Zona"];
    const rows = students.map((s) => [
      s.name,
      s.sex,
      s.latestBiometric ? Number(s.latestBiometric.imc) : "",
      s.latestBiometric?.imcZone ?? "",
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "turma_report.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  const columns: Column<StudentRow>[] = [
    { key: "name", header: "Nome", sortable: true },
    { key: "sex", header: "Sexo", sortable: true, className: "w-16 text-center" },
    {
      key: "imc",
      header: "IMC",
      sortable: true,
      className: "w-20 text-right",
      render: (r) => (r.latestBiometric ? Number(r.latestBiometric.imc).toFixed(1) : "—"),
    },
    {
      key: "imcZone",
      header: "Zona",
      sortable: true,
      render: (r) => {
        const zone = r.latestBiometric?.imcZone;
        return (
          <span
            className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
              zone === "ZSAF"
                ? "bg-green-100 text-green-800"
                : zone
                ? "bg-orange-100 text-orange-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {zone ?? "—"}
          </span>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Turma"
        description="Vista geral da turma com dados agregados"
      >
          <Button
            size="sm"
            variant="secondary"
            icon={<Download className="size-4" />}
            onClick={exportCsv}
            disabled={!students.length}
          >
            Exportar CSV
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
        <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">
          Selecione uma turma.
        </div>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      ) : (
        <DataTable
          columns={columns}
          data={students}
          rowKey={(r) => r.id}
          emptyMessage="Sem alunos nesta turma."
        />
      )}
    </div>
  );
}
