"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { RefreshCw, ShieldOff, UserCheck, UserPlus, Trash2 } from "lucide-react";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillSelect } from "@/components/ui/pill-select";
import { StudentPicker } from "@/components/ui/student-picker";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";
import { readApiResponse } from "@/lib/api-client";

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
  const common = useTranslations("common");
  const { role } = useUser();

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsLoadError, setStudentsLoadError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loadingGuardians, setLoadingGuardians] = useState(false);
  const [guardiansLoadError, setGuardiansLoadError] = useState<string | null>(null);

  // Add form
  const [guardianEmail, setGuardianEmail] = useState("");
  const [relationship, setRelationship] = useState("EE");
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ guardianUserId: string; studentId: string } | null>(null);

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    setStudentsLoadError(null);

    try {
      const response = await fetch("/api/students");
      const data = await readApiResponse<{ students: Student[] }>(response);
      setStudents(data.students);
    } catch (error) {
      setStudents([]);
      const message = error instanceof Error ? error.message : common("studentListLoadError");
      setStudentsLoadError(message);
      toast.error(common("studentListLoadError"));
    } finally {
      setLoadingStudents(false);
    }
  }, [common]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const loadGuardians = useCallback(async (studentId: string) => {
    setLoadingGuardians(true);
    setGuardiansLoadError(null);
    try {
      const r = await fetch(`/api/students/${studentId}/guardians`);
      setGuardians(await readApiResponse<Guardian[]>(r));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("loadError");
      setGuardians([]);
      setGuardiansLoadError(message);
      toast.error(message);
    } finally {
      setLoadingGuardians(false);
    }
  }, [t]);

  useEffect(() => {
    if (selectedStudentId) {
      void loadGuardians(selectedStudentId);
    } else {
      setGuardians([]);
      setGuardiansLoadError(null);
    }
  }, [selectedStudentId, loadGuardians]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.error(t("addError"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/students/${selectedStudentId}/guardians`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianEmail, relationship }),
      });
      await readApiResponse(res);
      toast.success(t("addSuccess"));
      setGuardianEmail("");
      loadGuardians(selectedStudentId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("unknownError"));
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
      await readApiResponse(res);
      toast.success(t("removeSuccess"));
      setDeleteTarget(null);
      loadGuardians(deleteTarget.studentId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("loadError"));
    }
  }

  if (role !== "PROFESSOR" && role !== "ADMIN") {
    return (
      <PageScaffold headerProps={{ title: t("title"), description: t("description") }}>
        <EmptyState
          icon={ShieldOff}
          title="Sem acesso a esta página"
          description="Esta área está reservada a professores e administradores."
        />
      </PageScaffold>
    );
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <PageScaffold headerProps={{ title: t("title"), description: t("description") }}>

      <PageSection
        tone="secondary"
        layout="list"
        className="animate-fade-in-up relative z-20 max-w-2xl overflow-visible"
        title={
          <span className="flex items-center gap-2">
            <UserCheck size={16} className="text-navy-600" />
            {t("viewTitle")}
          </span>
        }
      >
        {studentsLoadError ? (
          <EmptyState
            icon={UserCheck}
            title="Não foi possível carregar os alunos"
            description="Tenta novamente para escolher um aluno e gerir os respetivos encarregados de educação."
            action={
              <Button size="sm" variant="secondary" icon={<RefreshCw className="size-4" />} onClick={loadStudents}>
                Tentar novamente
              </Button>
            }
          />
        ) : (
          <StudentPicker
            students={students}
            value={selectedStudentId}
            onChange={setSelectedStudentId}
            placeholder={t("selectStudent")}
            loading={loadingStudents}
          />
        )}

        {!loadingStudents && !studentsLoadError && students.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="Sem alunos disponíveis"
            description="Ainda não há alunos para selecionar nesta área."
          />
        ) : null}

        {selectedStudentId && guardiansLoadError ? (
          <EmptyState
            icon={UserCheck}
            title="Não foi possível carregar os encarregados"
            description="A relação deste aluno não pôde ser atualizada. Podes tentar novamente."
            action={
              <Button
                size="sm"
                variant="secondary"
                icon={<RefreshCw className="size-4" />}
                onClick={() => loadGuardians(selectedStudentId)}
              >
                Tentar novamente
              </Button>
            }
          />
        ) : null}

        {loadingGuardians && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        )}

        {!loadingStudents && !loadingGuardians && !guardiansLoadError && !selectedStudentId && (
          <EmptyState
            icon={UserPlus}
            title="Seleciona um aluno"
            description="Escolhe um aluno acima para ver ou editar os seus encarregados de educação."
          />
        )}

        {!loadingGuardians && !guardiansLoadError && selectedStudentId && guardians.length === 0 && (
          <EmptyState
            icon={UserCheck}
            title={t("noGuardiansTitle")}
            description={t("noGuardiansFor", { name: selectedStudent?.name ?? "" })}
          />
        )}

        {!loadingGuardians && !guardiansLoadError && guardians.length > 0 && (
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
                      <span className="inline-block rounded-md px-2.5 py-1 text-[11px] font-semibold bg-navy-100 dark:bg-navy-900/50 text-navy-700 dark:text-navy-300 border border-navy-200 dark:border-navy-800/50 tracking-wide uppercase">
                        {RELATIONSHIP_OPTIONS.find((r) => r.value === g.relationship)?.labelKey ? t(RELATIONSHIP_OPTIONS.find((r) => r.value === g.relationship)!.labelKey as Parameters<typeof t>[0]) : g.relationship}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDeleteTarget({ guardianUserId: g.id, studentId: selectedStudentId! })}
                        className="p-2 rounded-lg text-muted-foreground hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all border border-transparent hover:border-danger-200 dark:hover:border-danger-800/30 shadow-sm"
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
      </PageSection>

      {selectedStudentId && (
        <PageSection
          tone="primary"
          layout="form"
          className="animate-fade-in-up delay-100 relative z-10 max-w-2xl overflow-visible"
          title={
            <span className="flex items-center gap-2">
              <UserPlus size={16} className="text-navy-600" />
              {t("addTitle")}
            </span>
          }
        >
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <Input
              label={t("emailLabel")}
              type="email"
              value={guardianEmail}
              onChange={(e) => setGuardianEmail(e.target.value)}
              placeholder="encarregado@exemplo.pt"
              required
            />
            <div>
              <label className="block text-xs font-medium mb-1">{t("relationship")}</label>
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
        </PageSection>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title={t("removeTitle")}
        message={t("removeDesc")}
        confirmLabel={t("removeBtn")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </PageScaffold>
  );
}
