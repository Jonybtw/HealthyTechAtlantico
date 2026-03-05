"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ShieldOff, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StudentPicker } from "@/components/ui/student-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface Dispensa {
  id: string;
  reason: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export default function DispensasPage() {
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown>)?.role as string;

  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [dispensas, setDispensas] = useState<Dispensa[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    reason: "",
    startDate: "",
    endDate: "",
  });

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

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  /* Load dispensas for selected student */
  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    fetch(`/api/students/${studentId}/dispensas`)
      .then(async (res) => {
        if (res.ok) {
          const body = await res.json();
          setDispensas(Array.isArray(body) ? body : (body.dispensas ?? []));
        }
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/dispensas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: form.reason,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Erro ao criar dispensa.");
        return;
      }
      toast.success("Dispensa criada.");
      setShowForm(false);
      setForm({ reason: "", startDate: "", endDate: "" });
      // reload
      const body = await fetch(`/api/students/${studentId}/dispensas`).then((r) => r.json());
      setDispensas(Array.isArray(body) ? body : (body.dispensas ?? []));
    } catch {
      toast.error("Erro de ligação.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !studentId) return;
    try {
      const res = await fetch(`/api/students/${studentId}/dispensas`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dispensaId: deleteId }),
      });
      if (res.ok) {
        toast.success("Dispensa removida.");
        setDispensas((d) => d.filter((x) => x.id !== deleteId));
      }
    } catch {
      toast.error("Erro ao remover.");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dispensas"
        description="Dispensas médicas e atestados"
      >
        {role !== "ALUNO" && (
            <Button
              size="sm"
              icon={<Plus className="size-4" />}
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? "Cancelar" : "Nova dispensa"}
            </Button>
        )}
      </PageHeader>

      {role !== "ALUNO" && (
        <StudentPicker students={students} value={studentId} onChange={setStudentId} />
      )}

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4 max-w-lg"
        >
          <Input
            label="Motivo"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data início"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              required
            />
            <Input
              label="Data fim"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <Button type="submit" loading={saving} className="self-start">
            Criar dispensa
          </Button>
        </form>
      )}

      {/* List */}
      {!studentId ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">
          Selecione um aluno.
        </div>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      ) : dispensas.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">
          <ShieldOff className="size-8 mx-auto mb-2 opacity-40" />
          Sem dispensas registadas.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {dispensas.map((d) => (
            <div
              key={d.id}
              className="bg-card rounded-xl border border-border p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{d.reason}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(d.startDate).toLocaleDateString("pt-PT")}
                  {` — ${new Date(d.endDate).toLocaleDateString("pt-PT")}`}
                </p>
              </div>
              {role !== "ALUNO" && (
                <button
                  onClick={() => setDeleteId(d.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Remover dispensa"
        message="Tem a certeza que pretende eliminar esta dispensa?"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
