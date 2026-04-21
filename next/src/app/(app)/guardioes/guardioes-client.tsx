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
  Mail,
  Users,
} from "lucide-react";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PillSelect } from "@/components/ui/pill-select";
import { StudentPicker } from "@/components/ui/student-picker";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";
import { readApiResponse } from "@/lib/api-client";
import { AnimatePresence } from "motion/react";
import { FadeIn, StaggerList, StaggerItem } from "@/components/ui/motion";

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

export default function GuardioesPage() {
  const t = useTranslations("guardioes");
  const common = useTranslations("common");
  const { role } = useUser();

  const RELATIONSHIP_OPTIONS: { value: string; labelKey: Parameters<typeof t>[0] }[] = [
    { value: "PAI", labelKey: "rel_PAI" },
    { value: "MAE", labelKey: "rel_MAE" },
    { value: "EE", labelKey: "rel_EE" },
    { value: "OUTRO", labelKey: "rel_OUTRO" },
  ];

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsLoadError, setStudentsLoadError] = useState<string | null>(
    null,
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loadingGuardians, setLoadingGuardians] = useState(false);
  const [guardiansLoadError, setGuardiansLoadError] = useState<string | null>(
    null,
  );

  const [guardianEmail, setGuardianEmail] = useState("");
  const [relationship, setRelationship] = useState("EE");
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    guardianUserId: string;
    studentId: string;
  } | null>(null);

  const loadStudents = useCallback(async (signal?: AbortSignal) => {
    setLoadingStudents(true);
    setStudentsLoadError(null);

    try {
      const response = await fetch("/api/students?limit=500", { signal });
      const data = await readApiResponse<{ students: Student[] }>(response);
      setStudents(data.students);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setStudents([]);
      const message =
        error instanceof Error ? error.message : common("studentListLoadError");
      setStudentsLoadError(message);
      toast.error(common("studentListLoadError"));
    } finally {
      if (!signal?.aborted) {
        setLoadingStudents(false);
      }
    }
  }, [common]);

  useEffect(() => {
    const controller = new AbortController();
    void loadStudents(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadStudents]);

  useEffect(() => {
    if (loadingStudents || students.length === 0) {
      return;
    }

    setSelectedStudentId((current) => {
      if (current && students.some((student) => student.id === current)) {
        return current;
      }

      return students[0].id;
    });
  }, [loadingStudents, students]);

  const loadGuardians = useCallback(
    async (studentId: string, signal?: AbortSignal) => {
      setLoadingGuardians(true);
      setGuardiansLoadError(null);
      try {
        const r = await fetch(`/api/students/${studentId}/guardians`, {
          signal,
        });
        const items = await readApiResponse<Guardian[]>(r);

        if (signal?.aborted) {
          return;
        }

        setGuardians(items);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        const message = error instanceof Error ? error.message : t("loadError");
        setGuardians([]);
        setGuardiansLoadError(message);
        toast.error(message);
      } finally {
        if (!signal?.aborted) {
          setLoadingGuardians(false);
        }
      }
    },
    [t],
  );

  useEffect(() => {
    if (selectedStudentId) {
      const controller = new AbortController();
      void loadGuardians(selectedStudentId, controller.signal);

      return () => {
        controller.abort();
      };
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
      void loadGuardians(selectedStudentId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("unknownError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(
        `/api/students/${deleteTarget.studentId}/guardians`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guardianUserId: deleteTarget.guardianUserId }),
        },
      );
      await readApiResponse(res);
      toast.success(t("removeSuccess"));
      setDeleteTarget(null);
      void loadGuardians(deleteTarget.studentId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("loadError"));
    }
  }

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId],
  );

  if (role !== "PROFESSOR" && role !== "ADMIN") {
    return (
      <PageScaffold
        headerProps={{
          title: t("title"),
          description: t("description"),
          eyebrow: "FAMÍLIA · ENCARREGADOS",
        }}
      >
        <EmptyState
          icon={ShieldOff}
          title="Sem acesso à página"
          description="Esta área está reservada a professores e administradores."
        />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      headerProps={{
        title: t("title"),
        description: t("description"),
        eyebrow: "FAMÍLIA · ENCARREGADOS",
      }}
    >
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.08fr)_360px]">
        <div className="space-y-6">
          <PageSection
            eyebrow="SELEÇÃO"
            title={t("title")}
            description="Escolha um aluno para visualizar e gerir os seus encarregados de educação."
            tone="primary"
            layout="form"
            className="overflow-visible z-10"
          >
            <div className="rounded-2xl border border-border bg-surface-secondary p-4 shadow-sm sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-end">
                <div className="min-w-0">
                  <p className="section-kicker whitespace-normal break-words sm:whitespace-nowrap sm:truncate">{t("selectStudent")}</p>
                  <div className="mt-4">
                    <StudentPicker
                      students={students}
                      value={selectedStudentId}
                      onChange={setSelectedStudentId}
                      placeholder={t("selectStudent")}
                      loading={loadingStudents}
                    />
                  </div>
                </div>
                
                <div className="rounded-[1.3rem] border border-border/60 bg-background/70 px-4 py-4 shadow-sm h-full flex flex-col justify-center">
                   <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="section-kicker">Registos</p>
                        <p className="mt-1 text-2xl font-black tracking-[-0.05em] text-foreground">
                          {selectedStudentId ? guardians.length : "-"}
                        </p>
                      </div>
                      <span className="inline-flex rounded-full border border-gold-400/25 bg-gold-400/10 px-2.5 py-1 text-tiny font-semibold text-gold-700 dark:text-gold-200">
                        Total
                      </span>
                   </div>
                </div>
              </div>
            </div>
          </PageSection>

          <PageSection
            eyebrow="REGISTOS"
            title="Lista de Encarregados"
            description="Família e responsáveis com acesso à área escolar deste aluno."
            tone="secondary"
            layout="list"
          >
            {studentsLoadError ? (
              <EmptyState
                icon={ShieldOff}
                title="Erro na Ligação"
                description="Não foi possível carregar a lista de alunos."
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<RefreshCw className="size-4" />}
                    onClick={() => {
                      void loadStudents();
                    }}
                  >
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
                    onClick={() => {
                      void loadGuardians(selectedStudentId);
                    }}
                  >
                    Tentar novamente
                  </Button>
                }
              />
            ) : loadingGuardians ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-40 p-6 opacity-50">
                    <Skeleton className="h-6 w-32 mb-4 bg-white/5" />
                    <Skeleton className="h-4 w-48 mb-2 bg-white/5" />
                    <Skeleton className="h-4 w-40 bg-white/5" />
                  </Card>
                ))}
              </div>
            ) : guardians.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                title={t("noGuardiansTitle")}
                description={t("noGuardiansFor", {
                  name: selectedStudent?.name ?? "",
                })}
              />
            ) : (
              <StaggerList className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {guardians.map((g) => {
                  const relLabel = RELATIONSHIP_OPTIONS.find(
                    (r) => r.value === g.relationship,
                  )?.labelKey;
                  return (
                    <StaggerItem key={g.id}>
                      <div className="surface-secondary group flex h-full flex-col rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex items-center gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-gold-400/22 bg-gold-400/10 font-black text-base text-gold-700 shadow-sm transition-transform duration-300 group-hover:scale-105 dark:border-gold-300/18 dark:bg-gold-300/10 dark:text-gold-300">
                              {(
                                g.guardian.name?.[0] || g.guardian.email[0]
                              ).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold leading-tight text-foreground">
                                {g.guardian.name || "Pendente"}
                              </h4>
                              <Badge
                                variant="gold"
                                size="sm"
                                className="mt-1.5 uppercase tracking-[0.16em] text-[10px]"
                              >
                                {relLabel ? t(relLabel) : g.relationship}
                              </Badge>
                            </div>
                          </div>

                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              setDeleteTarget({
                                guardianUserId: g.id,
                                studentId: selectedStudentId!,
                              })
                            }
                            className="size-8 shrink-0 text-muted-foreground hover:border-danger-500/20 hover:bg-danger-500/10 hover:text-danger-600"
                            title={t("removeBtn")}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>

                        <div className="mt-auto space-y-2.5">
                          <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-background/60 px-3 py-2">
                            <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate text-xs font-medium text-foreground">{g.guardian.email}</span>
                          </div>
                          <div className="flex items-center gap-2.5 px-1">
                            <div className="relative flex size-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                              <span className="relative inline-flex size-2 rounded-full bg-success-500"></span>
                            </div>
                            <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-success-600 dark:text-success-400">
                              Acesso Ativo
                            </span>
                          </div>
                        </div>
                      </div>
                    </StaggerItem>
                  );
                })}
              </StaggerList>
            )}
          </PageSection>
        </div>

        <aside className="xl:sticky xl:top-24 space-y-6">
          <AnimatePresence mode="popLayout">
            {showAddForm && selectedStudentId ? (
              <FadeIn key="add-guardian-form" className="w-full">
                <PageSection 
                  eyebrow="ADICIONAR"
                  title={t("addTitle")}
                  description="Convidar novo encarregado de educação."
                  tone="primary"
                >
                  <form onSubmit={handleAdd} className="flex flex-col gap-5 mt-2">
                    <Input
                      label={t("emailLabel")}
                      type="email"
                      value={guardianEmail}
                      onChange={(e) => setGuardianEmail(e.target.value)}
                      placeholder="encarregado@exemplo.pt"
                      required
                    />
                    <div>
                      <label className="mb-2 block text-tiny font-bold uppercase tracking-widest text-muted-foreground">
                        {t("relationship")}
                      </label>
                      <PillSelect
                        options={RELATIONSHIP_OPTIONS.map((r) => ({
                          value: r.value,
                          label: t(r.labelKey),
                        }))}
                        value={relationship}
                        onChange={setRelationship}
                      />
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowAddForm(false)}
                      >
                        {t("cancelBtn")}
                      </Button>
                      <Button
                        type="submit"
                        variant="sanctuary"
                        loading={submitting}
                      >
                        {t("addBtn")}
                      </Button>
                    </div>
                  </form>
                </PageSection>
              </FadeIn>
            ) : selectedStudentId ? (
              <FadeIn key="add-action" className="w-full">
                <div className="surface-secondary rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-5 border border-white/10 shadow-sm relative overflow-hidden">
                  <div className="size-14 rounded-full bg-primary-500/10 flex items-center justify-center relative z-10 border border-primary-500/20">
                    <UserPlus className="size-6 text-primary-400" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-base font-semibold text-foreground">
                      {t("addPromptTitle")}
                    </h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                      {t("addPromptDesc")}
                    </p>
                  </div>
                  <Button 
                    variant="sanctuary" 
                    className="w-full relative z-10 mt-2" 
                    onClick={() => setShowAddForm(true)}
                  >
                    {t("addBtn")}
                  </Button>
                </div>
              </FadeIn>
            ) : null}
          </AnimatePresence>
        </aside>
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
