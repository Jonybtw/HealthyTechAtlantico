"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { UserCheck, UserPlus, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillSelect } from "@/components/ui/pill-select";
import { StudentPicker } from "@/components/ui/student-picker";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useUser } from "@/components/user-context";

interface Student {
  id: string;
  name: string;
  className?: string | null;
}

interface Guardian {
  id: string;
  relationship: string;
  guardian: { name: string | null; email: string };
}

const RELATIONSHIP_OPTIONS = [
  { value: "PAI", labelKey: "rel_PAI" },
  { value: "MAE", labelKey: "rel_MAE" },
  { value: "EE", labelKey: "rel_EE" },
  { value: "OUTRO", labelKey: "rel_OUTRO" },
];

export default function GuardioesPage() {
  const t = useTranslations("guardioes");
  const { role } = useUser();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loadingGuardians, setLoadingGuardians] = useState(false);

  // Add form
  const [addStudentId, setAddStudentId] = useState<string | null>(null);
  const [guardianEmail, setGuardianEmail] = useState("");
  const [relationship, setRelationship] = useState("EE");
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ guardianUserId: string; studentId: string } | null>(null);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => setStudents(Array.isArray(data) ? data : data.students ?? []));
  }, []);

  const loadGuardians = useCallback(async (studentId: string) => {
    setLoadingGuardians(true);
    try {
      const r = await fetch(`/api/students/${studentId}/guardians`);
      const data = await r.json();
      setGuardians(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoadingGuardians(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStudentId) loadGuardians(selectedStudentId);
    else setGuardians([]);
  }, [selectedStudentId, loadGuardians]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addStudentId) {
      toast.error(t("addError"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/students/${addStudentId}/guardians`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianEmail, relationship }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: t("unknownError") }));
        toast.error(error);
        return;
      }
      toast.success(t("addSuccess"));
      setGuardianEmail("");
      // Refresh list if viewing same student
      if (selectedStudentId === addStudentId) {
        loadGuardians(addStudentId);
      } else {
        setSelectedStudentId(addStudentId);
      }
    } catch {
      toast.error(t("loadError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/students/${deleteTarget.studentId}/guardians`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianUserId: deleteTarget.guardianUserId }),
      });
      if (!res.ok) {
        toast.error(t("loadError"));
        return;
      }
      toast.success(t("removeSuccess"));
      setDeleteTarget(null);
      loadGuardians(deleteTarget.studentId);
    } catch {
      toast.error("Erro de ligação.");
    }
  }

  if (role !== "PROFESSOR" && role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">{t("noPermission")}</p>
      </div>
    );
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <div className="animate-fade-in-up relative z-20 flex max-w-2xl flex-col gap-5 overflow-visible rounded-2xl border border-border/50 bg-card/85 p-5 shadow-float glass">
        <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <UserCheck size={18} className="text-navy-600" />
          {t("viewTitle")}
        </h2>
        <StudentPicker
          students={students}
          value={selectedStudentId}
          onChange={setSelectedStudentId}
          placeholder={t("selectStudent")}
        />

        {loadingGuardians && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" /> {t("loadingGuardians")}
          </div>
        )}

        {!loadingGuardians && selectedStudentId && guardians.length === 0 && (
          <EmptyState
            icon={UserCheck}
            title={t("noGuardiansTitle")}
            description={t("noGuardiansFor", { name: selectedStudent?.name ?? "" })}
          />
        )}

        {!loadingGuardians && guardians.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border/50 bg-background/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t("colName")}</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t("colEmail")}</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t("colRelation")}</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {guardians.map((g) => (
                  <tr key={g.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{g.guardian.name ?? "-"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{g.guardian.email}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block rounded-md px-2.5 py-1 text-xs font-semibold bg-navy-100 dark:bg-navy-900/50 text-navy-700 dark:text-navy-300 border border-navy-200 dark:border-navy-800/50 tracking-wide uppercase">
                        {RELATIONSHIP_OPTIONS.find((r) => r.value === g.relationship)?.labelKey ? t(RELATIONSHIP_OPTIONS.find((r) => r.value === g.relationship)!.labelKey as Parameters<typeof t>[0]) : g.relationship}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDeleteTarget({ guardianUserId: g.id, studentId: selectedStudentId! })}
                        className="p-2 rounded-xl text-muted-foreground hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all border border-transparent hover:border-danger-200 dark:hover:border-danger-800/30 shadow-sm"
                        aria-label={t("removeBtn")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="animate-fade-in-up delay-100 relative z-10 flex max-w-lg flex-col gap-5 overflow-visible rounded-2xl border border-border/50 bg-card/85 p-5 shadow-float glass">
        <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <UserPlus size={18} className="text-navy-600" />
          {t("addTitle")}
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("student")}</label>
            <StudentPicker
              students={students}
              value={addStudentId}
              onChange={setAddStudentId}
              placeholder={t("selectStudent")}
            />
          </div>
          <Input
            label={t("emailLabel")}
            type="email"
            value={guardianEmail}
            onChange={(e) => setGuardianEmail(e.target.value)}
            placeholder="encarregado@exemplo.pt"
            required
          />
          <div>
            <label className="block text-sm font-medium mb-1">{t("relationship")}</label>
            <PillSelect
              options={RELATIONSHIP_OPTIONS.map((r) => ({ value: r.value, label: t(r.labelKey as Parameters<typeof t>[0]) }))}
              value={relationship}
              onChange={setRelationship}
            />
          </div>
          <Button
            type="submit"
            loading={submitting}
            icon={<UserPlus size={16} />}
            className="self-start"
          >
            {t("addBtn")}
          </Button>
        </form>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title={t("removeTitle")}
        message={t("removeDesc")}
        confirmLabel={t("removeBtn")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </div>
  );
}
