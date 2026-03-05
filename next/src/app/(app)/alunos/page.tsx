"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillSelect } from "@/components/ui/pill-select";

interface StudentRow {
  id: string;
  name: string;
  sex: string;
  birthDate: string;
  className: string | null;
  schoolYear: string | null;
  [key: string]: unknown;
}

export default function AlunosPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sex: "M",
    birthDate: "",
    className: "",
  });

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/students?limit=500");
      if (res.ok) {
        const body = await res.json();
        setStudents(body.students ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Erro ao criar aluno.");
        return;
      }

      toast.success("Aluno criado com sucesso!");
      setShowCreate(false);
      setForm({ name: "", sex: "M", birthDate: "", className: "" });
      loadStudents();
    } catch {
      toast.error("Erro de ligação.");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<StudentRow>[] = [
    { key: "name", header: "Nome", sortable: true },
    { key: "sex", header: "Sexo", sortable: true, className: "w-16 text-center" },
    {
      key: "birthDate",
      header: "Nascimento",
      sortable: true,
      render: (r) => new Date(r.birthDate).toLocaleDateString("pt-PT"),
    },
    {
      key: "className",
      header: "Turma",
      render: (r) => r.className ?? "—",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Alunos"
        description="Lista de alunos registados"
      >
          <Button
            size="sm"
            icon={<UserPlus className="size-4" />}
            onClick={() => setShowCreate((v) => !v)}
          >
            {showCreate ? "Cancelar" : "Novo aluno"}
          </Button>
      </PageHeader>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4 max-w-lg"
        >
          <Input
            label="Nome completo"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            autoFocus
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Sexo</label>
            <PillSelect
              options={[
                { value: "M", label: "Masculino" },
                { value: "F", label: "Feminino" },
              ]}
              value={form.sex}
              onChange={(v) => setForm((f) => ({ ...f, sex: v }))}
            />
          </div>
          <Input
            label="Data de nascimento"
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
            required
          />
          <Button type="submit" loading={saving} className="self-start">
            Criar aluno
          </Button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      ) : (
        <DataTable
          columns={columns}
          data={students}
          rowKey={(r) => r.id}
          onRowClick={(r) => router.push(`/alunos/${r.id}`)}
          emptyMessage="Sem alunos registados."
        />
      )}
    </div>
  );
}
