"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { 
  RefreshCw, 
  ShieldOff, 
  UserCheck, 
  UserPlus, 
  Trash2, 
  Phone, 
  Mail, 
  ChevronRight, 
  Users,
  CheckCircle2
} from "lucide-react";
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
import { MeshGlow } from "@/components/ui/mesh-glow";
import { cn } from "@/lib/utils";
import { FadeIn, StaggerList, StaggerItem, AnimatePresence } from "@/components/ui/motion";

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

  const [guardianEmail, setGuardianEmail] = useState("");
  const [relationship, setRelationship] = useState("EE");
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ guardianUserId: string; studentId: string } | null>(null);

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    setStudentsLoadError(null);

    try {
      const response = await fetch("/api/students?limit=500");
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
      setShowAddForm(false);
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
      <PageScaffold headerProps={{ title: t("title"), description: t("description"), eyebrow: "FAMÍLIA · ENCARREGADOS" }}>
        <EmptyState
          icon={ShieldOff}
          title="Sem acesso à página"
          description="Esta área está reservada a professores e administradores."
        />
      </PageScaffold>
    );
  }

  const selectedStudent = useMemo(() => students.find((s) => s.id === selectedStudentId), [students, selectedStudentId]);

  return (
    <PageScaffold 
      headerProps={{ 
        title: t("title"), 
        description: t("description"), 
        eyebrow: "FAMÍLIA · ENCARREGADOS" 
      }}
      headerActions={selectedStudentId ? (
        <Button
          variant="sanctuary"
          size="sm"
          icon={showAddForm ? undefined : <UserPlus className="size-4" />}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? t("cancelBtn") : t("addBtn")}
        </Button>
      ) : undefined}
    >
      <div className="relative">
        <MeshGlow className="top-0 right-0 opacity-20" />
        <MeshGlow className="bottom-0 left-0 opacity-10" />

        <PageSection layout="list" className="bg-transparent mb-8">
          <div className="w-full max-w-sm">
            <StudentPicker
              students={students}
              value={selectedStudentId}
              onChange={setSelectedStudentId}
              placeholder={t("selectStudent")}
              loading={loadingStudents}
            />
          </div>
        </PageSection>

        <AnimatePresence>
          {showAddForm && selectedStudentId && (
            <FadeIn key="add-guardian-form" className="mb-8">
              <PageSection className="glass-card max-w-2xl border-primary-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-8 rounded-full bg-primary-500/10 flex items-center justify-center">
                    <UserPlus className="size-4 text-primary-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">{t("addTitle")}</h3>
                </div>

                <form onSubmit={handleAdd} className="flex flex-col gap-6">
                  <Input
                    label={t("emailLabel")}
                    type="email"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    placeholder="encarregado@exemplo.pt"
                    required
                    className="glass-input"
                  />
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                      {t("relationship")}
                    </label>
                    <PillSelect
                      options={RELATIONSHIP_OPTIONS.map((r) => ({ 
                        value: r.value, 
                        label: t(r.labelKey as any) 
                      }))}
                      value={relationship}
                      onChange={setRelationship}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="sanctuary"
                      loading={submitting}
                      className="min-w-[160px]"
                    >
                      {t("addBtn")}
                    </Button>
                  </div>
                </form>
              </PageSection>
            </FadeIn>
          )}
        </AnimatePresence>

        <PageSection layout="list" className="bg-transparent">
          {studentsLoadError ? (
            <EmptyState
              icon={ShieldOff}
              title="Erro na Ligação"
              description="Não foi possível carregar a lista de alunos."
              action={
                <Button size="sm" variant="secondary" icon={<RefreshCw className="size-4" />} onClick={loadStudents}>
                  Tentar novamente
                </Button>
              }
            />
          ) : !loadingStudents && students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Sem alunos"
              description="Ainda não existem alunos registados na instituição."
            />
          ) : !selectedStudentId ? (
            <EmptyState
              icon={UserCheck}
              title="Seleção Necessária"
              description="Escolhe um aluno para visualizar e gerir os seus encarregados de educação."
            />
          ) : guardiansLoadError ? (
            <EmptyState
              icon={ShieldOff}
              title="Erro de Dados"
              description="Houve um problema ao carregar os encarregados."
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
          ) : loadingGuardians ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="glass-card p-6 h-40 opacity-50">
                  <Skeleton className="h-6 w-32 mb-4 bg-white/5" />
                  <Skeleton className="h-4 w-48 mb-2 bg-white/5" />
                  <Skeleton className="h-4 w-40 bg-white/5" />
                </div>
              ))}
            </div>
          ) : guardians.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title={t("noGuardiansTitle")}
              description={t("noGuardiansFor", { name: selectedStudent?.name ?? "" })}
              action={
                <Button
                  size="sm"
                  variant="sanctuary"
                  icon={<UserPlus className="size-4" />}
                  onClick={() => setShowAddForm(true)}
                >
                  {t("addBtn")}
                </Button>
              }
            />
          ) : (
            <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guardians.map((g) => {
                const relLabel = RELATIONSHIP_OPTIONS.find((r) => r.value === g.relationship)?.labelKey;
                return (
                  <StaggerItem key={g.id}>
                    <div className="glass-card group p-6 flex flex-col h-full transition-all duration-500 hover:scale-[1.02] hover:border-gold-500/20">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-full border border-gold-500/20 bg-gold-500/5 flex items-center justify-center text-gold-500 font-black text-lg shadow-[0_0_15px_rgba(216,173,52,0.1)] group-hover:scale-110 transition-transform duration-500">
                            {(g.guardian.name?.[0] || g.guardian.email[0]).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-base leading-tight group-hover:text-gold-400 transition-colors">
                              {g.guardian.name || "Pendente"}
                            </h4>
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-gold-500 opacity-80">
                              {relLabel ? t(relLabel as any) : g.relationship}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setDeleteTarget({ guardianUserId: g.id, studentId: selectedStudentId! })}
                          className="size-8 rounded-full flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                          title={t("removeBtn")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="mt-auto space-y-3">
                        <div className="flex items-center gap-3 text-[13px] text-slate-400">
                          <Mail className="size-3 text-primary-400" />
                          <span className="truncate">{g.guardian.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[13px] text-slate-400">
                          <CheckCircle2 className="size-3 text-green-500" />
                          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Acesso Ativo</span>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-white/5 flex justify-end">
                        <button className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors">
                          Detalhes <ChevronRight className="size-3" />
                        </button>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerList>
          )}
        </PageSection>
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
    </PageScaffold>
  );
}
