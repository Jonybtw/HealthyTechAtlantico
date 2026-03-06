"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ShieldOff, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StudentPicker } from "@/components/ui/student-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";

interface Dispensa {
  id: string;
  reason: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export default function DispensasPage() {
  const t = useTranslations("dispensas");
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
      toast.success(t("success"));
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
        toast.success(t("deleteSuccess"));
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
        title={t("title")}
        description={t("description")}
      >
        {role !== "ALUNO" && (
          <Button
            size="sm"
            icon={<Plus className="size-4" />}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? t("deleteBtn") : t("newBtn")}
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
          className="animate-fade-in-up bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-6 flex flex-col gap-5 max-w-lg mb-2"
        >
          <Input
            label={t("reason")}
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("startDateShort")}
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              required
            />
            <Input
              label={t("endDateShort")}
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <Button type="submit" loading={saving} className="self-start">
            {t("createBtn")}
          </Button>
        </form>
      )}

      {/* List */}
      {!studentId ? (
        <EmptyState
          icon={ShieldOff}
          title="Nenhum Aluno Selecionado"
          description="Selecione um aluno para visualizar ou gerir as dispensas associadas."
        />
      ) : loading ? (
        <p className="text-sm text-muted-foreground animate-pulse py-10 text-center">A carregar…</p>
      ) : dispensas.length === 0 ? (
        <EmptyState
          icon={ShieldOff}
          title="Sem Dispensas"
          description={t("noDispensas")}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {dispensas.map((d, i) => (
            <div
              key={d.id}
              className="animate-fade-in-up bg-card/85 glass rounded-2xl border border-border/50 p-5 flex items-center justify-between transition-all duration-300 hover:shadow-float hover:-translate-y-1"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
            >
              <div>
                <p className="font-semibold">{d.reason}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium bg-muted/50 inline-block px-2 py-0.5 rounded-md border border-border/50">
                  {new Date(d.startDate).toLocaleDateString("pt-PT")}
                  {` — ${new Date(d.endDate).toLocaleDateString("pt-PT")}`}
                </p>
              </div>
              {role !== "ALUNO" && (
                <button
                  onClick={() => setDeleteId(d.id)}
                  className="p-2.5 rounded-xl text-muted-foreground hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all border border-transparent hover:border-danger-200 dark:hover:border-danger-800/30 shadow-sm"
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
        title={t("deleteTitle")}
        message={t("deleteDesc")}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
