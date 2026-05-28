"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Mail,
  RefreshCw,
  ShieldOff,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PillSelect } from "@/components/ui/pill-select";
import { StudentPicker } from "@/components/ui/student-picker";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";
import { readApiResponse } from "@/lib/api-client";
import { useReducedEffects } from "@/hooks/use-reduced-effects";
import { cn } from "@/lib/utils";

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

function sectionAnimation(index: number, re: boolean) {
  if (re) return {};
  return { animationDelay: `${index * 70}ms` };
}

function BioPanel({ children, className, index, reducedEffects }: { children: React.ReactNode; className?: string; index: number; reducedEffects: boolean }) {
  return (
    <section style={sectionAnimation(index, reducedEffects)} className={cn("relative overflow-hidden rounded-[12px] border border-border bg-card/88 shadow-[0_4px_12px_rgba(9,21,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-navy-950/68 dark:shadow-[0_4px_18px_rgba(0,0,0,0.22)]", !reducedEffects && "animate-fade-in-up opacity-0", className)}>
      <div className="relative">{children}</div>
    </section>
  );
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

  const reducedEffects = useReducedEffects();

  const verifiedGuardians = guardians.filter((g) => g.guardian.name !== null).length;

  if (role !== "PROFESSOR" && role !== "ADMIN") {
    return (
      <PageScaffold headerProps={{ title: t("title"), description: t("description") }}>
        <EmptyState icon={ShieldOff} title={t("noPermission")} description={t("description")} />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      className="gap-5"
      headerProps={{ title: t("title"), description: t("description") }}
      headerActions={
        selectedStudentId ? (
          <Button variant="primary" size="sm" icon={showAddForm ? undefined : <UserPlus className="size-4" />} onClick={() => setShowAddForm((c) => !c)}>
            {showAddForm ? t("cancelBtn") : t("addBtn")}
          </Button>
        ) : undefined
      }
    >
      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <BioPanel index={0} reducedEffects={reducedEffects} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-muted-foreground">{t("kpiStudentsLabel")}</p>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-navy-100 text-navy-700 dark:bg-white/8 dark:text-navy-100"><Users className="size-[18px]" /></span>
          </div>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-foreground">{students.length}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{t("kpiStudentsLoaded")}</p>
        </BioPanel>
        <BioPanel index={1} reducedEffects={reducedEffects} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-muted-foreground">{t("kpiGuardiansLabel")}</p>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-gold-100 text-gold-700 dark:bg-gold-300/12 dark:text-gold-200"><UserCheck className="size-[18px]" /></span>
          </div>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-foreground">{selectedStudentId ? guardians.length : "—"}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground truncate">{selectedStudent ? selectedStudent.name : t("selectStudent")}</p>
        </BioPanel>
        <BioPanel index={2} reducedEffects={reducedEffects} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-muted-foreground">{t("kpiVerifiedLabel")}</p>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-emerald-100 text-emerald-700 dark:bg-emerald-300/12 dark:text-emerald-200"><Mail className="size-[18px]" /></span>
          </div>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-foreground">{selectedStudentId ? verifiedGuardians : "—"}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{t("kpiVerifiedSub")}</p>
        </BioPanel>
      </div>

      {/* Main Grid */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        {/* Left: student picker + guardians list */}
        <div className="grid gap-5">
          <BioPanel index={3} reducedEffects={reducedEffects} className="p-5">
            <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("selectStudent")}</p>
            <div className="mt-2">
              <StudentPicker students={students} value={selectedStudentId} onChange={setSelectedStudentId} placeholder={t("selectStudent")} loading={loadingStudents} />
            </div>
          </BioPanel>

          <BioPanel index={4} reducedEffects={reducedEffects} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("registosTitle")}</p>
                <h3 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">{t("listTitle")}</h3>
              </div>
              {selectedStudentId && (
                <Button size="sm" variant="ghost" icon={<RefreshCw className="size-4" />} onClick={() => void loadGuardians(selectedStudentId)}>{common("refresh")}</Button>
              )}
            </div>

            <div className="mt-4">
              {studentsLoadError ? (
                <EmptyState icon={ShieldOff} title={t("errConnectionTitle")} description={t("errConnectionDesc")} action={<Button size="sm" variant="secondary" icon={<RefreshCw className="size-4" />} onClick={() => void loadStudents()}>{t("retryBtn")}</Button>} />
              ) : !loadingStudents && students.length === 0 ? (
                <EmptyState icon={Users} title={t("studentsEmptyTitle")} description={t("studentsEmptyDesc")} />
              ) : !selectedStudentId ? (
                <div className="rounded-[12px] border border-dashed border-border/60 bg-background/40 px-4 py-8 text-center">
                  <UserCheck className="mx-auto size-6 text-muted-foreground/40" />
                  <p className="mt-2.5 text-sm text-muted-foreground">{t("selectStudentHint")}</p>
                </div>
              ) : guardiansLoadError ? (
                <EmptyState icon={ShieldOff} title={t("errDataTitle")} description={t("errDataDesc")} action={<Button size="sm" variant="secondary" icon={<RefreshCw className="size-4" />} onClick={() => void loadGuardians(selectedStudentId!)}>{t("retryBtn")}</Button>} />
              ) : loadingGuardians ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[1,2,3].map((i) => <div key={i} className="rounded-[12px] border border-border/70 bg-background/58 p-4"><Skeleton className="h-5 w-32" /><Skeleton className="mt-3 h-4 w-48" /></div>)}
                </div>
              ) : guardians.length === 0 ? (
                <EmptyState icon={UserPlus} title={t("noGuardiansTitle")} description={t("noGuardiansFor", { name: selectedStudent?.name ?? "" })} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {guardians.map((g) => {
                    const relLabelKey = RELATIONSHIP_OPTIONS.find((r) => r.value === g.relationship)?.labelKey;
                    return (
                      <div key={g.id} className="rounded-[12px] border border-border/70 bg-background/65 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] border border-gold-400/22 bg-gold-400/10 text-sm font-black text-gold-700 dark:border-gold-300/18 dark:bg-gold-300/10 dark:text-gold-300">
                              {(g.guardian.name?.[0] || g.guardian.email[0]).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">{g.guardian.name || "Pendente"}</p>
                              <Badge variant="gold" size="sm" className="mt-1 uppercase tracking-[0.14em] text-[10px]">{relLabelKey ? t(relLabelKey) : g.relationship}</Badge>
                            </div>
                          </div>
                          <Button type="button" size="icon" variant="ghost" onClick={() => setDeleteTarget({ guardianUserId: g.id, studentId: selectedStudentId! })} className="shrink-0 size-8 text-muted-foreground hover:border-danger-500/20 hover:bg-danger-500/10 hover:text-danger-600" title={t("removeBtn")}><Trash2 className="size-4" /></Button>
                        </div>
                        <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-border/50 bg-background/60 px-3 py-2">
                          <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate text-xs font-medium text-foreground">{g.guardian.email}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </BioPanel>
        </div>

        {/* Right: add form */}
        <aside className="xl:sticky xl:top-24">
          {showAddForm && selectedStudentId ? (
            <BioPanel index={5} reducedEffects={reducedEffects} className="p-5">
              <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("addBtn")}</p>
              <h3 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">{t("addTitle")}</h3>
              <form onSubmit={handleAdd} className="mt-4 grid gap-4">
                <Input label={t("emailLabel")} type="email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} placeholder="encarregado@exemplo.pt" required />
                <div>
                  <label className="mb-2 block text-tiny font-bold uppercase tracking-widest text-muted-foreground">{t("relationship")}</label>
                  <PillSelect options={RELATIONSHIP_OPTIONS.map((r) => ({ value: r.value, label: t(r.labelKey) }))} value={relationship} onChange={setRelationship} />
                </div>
                <div className="flex gap-3 justify-end pt-1">
                  <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>{t("cancelBtn")}</Button>
                  <Button type="submit" variant="primary" loading={submitting}>{t("addBtn")}</Button>
                </div>
              </form>
            </BioPanel>
          ) : selectedStudentId ? (
            <BioPanel index={5} reducedEffects={reducedEffects} className="p-5 text-center">
              <div className="flex flex-col items-center gap-4 py-4">
                <span className="flex size-12 items-center justify-center rounded-full border border-border/60 bg-background/65"><UserPlus className="size-5 text-muted-foreground" /></span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("addPromptTitle")}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("addPromptDesc")}</p>
                </div>
                <Button variant="primary" className="w-full" onClick={() => setShowAddForm(true)}>{t("addBtn")}</Button>
              </div>
            </BioPanel>
          ) : (
            <BioPanel index={5} reducedEffects={reducedEffects} className="p-5">
              <div className="rounded-[12px] border border-dashed border-border/60 bg-background/40 px-4 py-8 text-center">
                <Users className="mx-auto size-6 text-muted-foreground/40" />
                <p className="mt-2.5 text-sm text-muted-foreground">Seleciona um aluno para gerir encarregados.</p>
              </div>
            </BioPanel>
          )}
        </aside>
      </div>

      <ConfirmModal open={!!deleteTarget} title={t("removeTitle")} message={t("removeDesc")} confirmLabel={t("removeBtn")} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} variant="danger" />
    </PageScaffold>
  );
}
