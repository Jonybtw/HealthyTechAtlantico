"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, ShieldOff, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StudentPicker } from "@/components/ui/student-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useUser } from "@/components/user-context";

interface Dispensa {
  id: string;
  reason: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export default function DispensasPage() {
  const t = useTranslations("dispensas");
  const common = useTranslations("common");
  const { role } = useUser();
  const canManageDispensas = role === "ADMIN" || role === "PROFESSOR";

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
    if (!canManageDispensas) {
      setStudents([]);
      setStudentId(null);
      return;
    }

    const res = await fetch("/api/students?limit=500");
    if (!res.ok) return;

    const body = await res.json();
    setStudents(
      body.students.map((student: { id: string; name: string }) => ({
        id: student.id,
        name: student.name,
      }))
    );
  }, [canManageDispensas]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (!canManageDispensas || !studentId) {
      setDispensas([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetch(`/api/students/${studentId}/dispensas`)
      .then(async (res) => {
        if (!res.ok || !active) return;
        const body = await res.json();
        setDispensas(Array.isArray(body) ? body : (body.dispensas ?? []));
      })
      .catch(() => {
        if (active) toast.error("Failed to load dispensas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canManageDispensas, studentId]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
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
        toast.error(body.error ?? "Failed to create dispensa.");
        return;
      }

      toast.success(t("success"));
      setShowForm(false);
      setForm({ reason: "", startDate: "", endDate: "" });

      const body = await fetch(`/api/students/${studentId}/dispensas`).then((response) =>
        response.json()
      );
      setDispensas(Array.isArray(body) ? body : (body.dispensas ?? []));
    } catch {
      toast.error("Connection error.");
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
        setDispensas((current) => current.filter((dispensa) => dispensa.id !== deleteId));
      }
    } catch {
      toast.error("Failed to remove dispensa.");
    } finally {
      setDeleteId(null);
    }
  };

  if (!canManageDispensas) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">{common("noPermission")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")}>
        <Button
          size="sm"
          icon={<Plus className="size-4" />}
          onClick={() => setShowForm((value) => !value)}
        >
          {showForm ? t("deleteBtn") : t("newBtn")}
        </Button>
      </PageHeader>

      <StudentPicker students={students} value={studentId} onChange={setStudentId} />

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="animate-fade-in-up bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-6 flex flex-col gap-5 max-w-lg mb-2"
        >
          <Input
            label={t("reason")}
            value={form.reason}
            onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("startDateShort")}
              type="date"
              value={form.startDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, startDate: event.target.value }))
              }
              required
            />
            <Input
              label={t("endDateShort")}
              type="date"
              value={form.endDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, endDate: event.target.value }))
              }
            />
          </div>
          <Button type="submit" loading={saving} className="self-start">
            {t("createBtn")}
          </Button>
        </form>
      )}

      {!studentId ? (
        <EmptyState
          icon={ShieldOff}
          title="No Student Selected"
          description="Select a student to view or manage dispensas."
        />
      ) : loading ? (
        <p className="text-sm text-muted-foreground animate-pulse py-10 text-center">
          Loading...
        </p>
      ) : dispensas.length === 0 ? (
        <EmptyState
          icon={ShieldOff}
          title="No Dispensas"
          description={t("noDispensas")}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {dispensas.map((dispensa, index) => (
            <div
              key={dispensa.id}
              className="animate-fade-in-up bg-card/85 glass rounded-2xl border border-border/50 p-5 flex items-center justify-between transition-all duration-300 hover:shadow-float hover:-translate-y-1"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
            >
              <div>
                <p className="font-semibold">{dispensa.reason}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium bg-muted/50 inline-block px-2 py-0.5 rounded-md border border-border/50">
                  {new Date(dispensa.startDate).toLocaleDateString("pt-PT")}
                  {` - ${new Date(dispensa.endDate).toLocaleDateString("pt-PT")}`}
                </p>
              </div>
              <button
                onClick={() => setDeleteId(dispensa.id)}
                className="p-2.5 rounded-xl text-muted-foreground hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all border border-transparent hover:border-danger-200 dark:hover:border-danger-800/30 shadow-sm"
              >
                <Trash2 className="size-4" />
              </button>
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
