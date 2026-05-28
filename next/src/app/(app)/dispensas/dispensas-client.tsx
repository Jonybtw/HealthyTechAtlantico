"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  FileText,
  Plus,
  RefreshCw,
  ShieldOff,
  Timer,
  Trash2,
  Users,
} from "lucide-react";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { StudentPicker } from "@/components/ui/student-picker";
import { StudentIdentity } from "@/components/ui/student-identity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";
import {
  useCreateDispensa,
  useDeleteDispensa,
  useDispensas,
  useStudents,
} from "@/hooks/use-queries";
import { useReducedEffects } from "@/hooks/use-reduced-effects";
import { cn } from "@/lib/utils";

type StudentOption = {
  id: string;
  name: string;
  className: string | null;
};

type ExemptionItem = {
  id: string;
  reason: string;
  startDate: string;
  endDate: string;
  createdAt: string;
};

const INITIAL_FORM = {
  reason: "",
  startDate: "",
  endDate: "",
};

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

function KpiCard({ index, re, icon, iconClass, label, value, sub }: { index: number; re: boolean; icon: React.ReactNode; iconClass: string; label: string; value: string | number; sub: string }) {
  return (
    <BioPanel index={index} reducedEffects={re} className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-[12px]", iconClass)}>{icon}</span>
      </div>
      <p className="mt-2 text-4xl font-extrabold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">{sub}</p>
    </BioPanel>
  );
}

function isExemptionActive(endDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(endDate) >= today;
}

export default function DispensasClient() {
  const t = useTranslations("exemptions");
  const common = useTranslations("common");
  const locale = useLocale();
  const { role } = useUser();
  const canManageDispensas = role === "ADMIN" || role === "PROFESSOR";

  const {
    data: studentsList = [],
    isLoading: loadingStudents,
    isError: studentsError,
    refetch: refetchStudents,
  } = useStudents();

  const students = useMemo<StudentOption[]>(
    () =>
      studentsList.map((student) => ({
        id: student.id,
        name: student.name,
        className: student.className ?? null,
      })),
    [studentsList],
  );

  const [studentId, setStudentId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const {
    data: dispensas = [],
    isLoading: loadingDispensas,
    isError: dispensasError,
    refetch: refetchDispensas,
  } = useDispensas(studentId);

  const createMutation = useCreateDispensa(studentId);
  const deleteMutation = useDeleteDispensa(studentId);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === studentId) ?? null,
    [studentId, students],
  );

  const sortedDispensas = useMemo(
    () =>
      [...(dispensas as ExemptionItem[])].sort(
        (left, right) =>
          new Date(right.startDate).getTime() - new Date(left.startDate).getTime(),
      ),
    [dispensas],
  );

  const stats = useMemo(() => {
    let active = 0;
    let expired = 0;

    for (const exemption of sortedDispensas) {
      if (isExemptionActive(exemption.endDate)) {
        active += 1;
      } else {
        expired += 1;
      }
    }

    return {
      total: sortedDispensas.length,
      active,
      expired,
    };
  }, [sortedDispensas]);

  useEffect(() => {
    if (studentsError) {
      toast.error(common("studentListLoadError"));
    }
  }, [studentsError, common]);

  useEffect(() => {
    if (loadingStudents || students.length === 0) {
      return;
    }

    setStudentId((current) => {
      if (current && students.some((student) => student.id === current)) {
        return current;
      }

      return students[0].id;
    });
  }, [loadingStudents, students]);

  const formatDate = useCallback(
    (value: string) =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(value)),
    [locale],
  );

  const selectedSummary = useMemo(() => {
    if (!selectedStudent) {
      return t("studentContextEmpty");
    }

    if (stats.total === 0) {
      return t("noExemptions");
    }

    return t("studentContextSummary", {
      active: stats.active,
      expired: stats.expired,
    });
  }, [selectedStudent, stats.active, stats.expired, stats.total, t]);

  const handleStudentChange = (id: string | null) => {
    setStudentId(id);
    setShowForm(false);
    setDeleteId(null);
    setForm(INITIAL_FORM);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!studentId) {
      return;
    }

    if (!form.reason.trim() || !form.startDate || !form.endDate) {
      toast.error(t("formIncomplete"));
      return;
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error(t("invalidDateRange"));
      return;
    }

    try {
      await createMutation.mutateAsync({
        reason: form.reason.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
      });
      toast.success(t("success"));
      setShowForm(false);
      setForm(INITIAL_FORM);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("connectionError"),
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !studentId) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success(t("deleteSuccess"));
    } catch {
      toast.error(t("removeError"));
    } finally {
      setDeleteId(null);
    }
  };

  const reducedEffects = useReducedEffects();

  if (!canManageDispensas) {
    return (
      <PageScaffold headerProps={{ title: t("title"), description: t("description") }}>
        <EmptyState icon={ShieldOff} title={t("accessTitle")} description={t("accessDescription")} />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      className="gap-5"
      headerProps={{ title: t("title"), description: t("description") }}
      headerActions={
        <Button variant="primary" size="sm" icon={showForm ? undefined : <Plus className="size-4" />} disabled={!studentId && !showForm} onClick={() => { if (!studentId && !showForm) return; setShowForm((c) => !c); }}>
          {showForm ? t("cancelBtn") : t("newBtn")}
        </Button>
      }
    >
      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard index={0} re={reducedEffects} icon={<FileText className="size-[18px]" />} iconClass="bg-navy-100 text-navy-700 dark:bg-white/8 dark:text-navy-100" label={t("kpiTotalLabel")} value={stats.total} sub={t("kpiTotalSub")} />
        <KpiCard index={1} re={reducedEffects} icon={<CheckCircle2 className="size-[18px]" />} iconClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-300/12 dark:text-emerald-200" label={t("activeCountLabel")} value={stats.active} sub={t("kpiActiveSub")} />
        <KpiCard index={2} re={reducedEffects} icon={<Timer className="size-[18px]" />} iconClass="bg-muted text-muted-foreground" label={t("expiredCountLabel")} value={stats.expired} sub={t("kpiExpiredSub")} />
      </div>

      {/* Main Grid */}
      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-start">
        {/* Left: picker + form */}
        <BioPanel index={3} reducedEffects={reducedEffects} className="p-5">
          <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("studentPickerLabel")}</p>
          <div className="mt-2">
            <StudentPicker students={students} value={studentId} onChange={handleStudentChange} loading={loadingStudents} />
          </div>

          {studentsError && (
            <div className="mt-4 rounded-[12px] border border-border/70 bg-background/65 p-4">
              <EmptyState icon={ShieldOff} title={t("studentsLoadErrorTitle")} description={t("studentsLoadErrorDescription")} action={<Button size="sm" variant="secondary" icon={<RefreshCw className="size-4" />} onClick={() => void refetchStudents()}>{common("refresh")}</Button>} />
            </div>
          )}

          {selectedStudent && (
            <>
              <div className="mt-4 rounded-[12px] border border-border/70 bg-background/65 p-4">
                <StudentIdentity student={selectedStudent} subtitle={selectedStudent.className ?? t("studentPickerLabel")} nameClassName="text-base" />
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{selectedSummary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="success" size="sm">{stats.active} {t("activeCountLabel")}</Badge>
                  <Badge variant="default" size="sm">{stats.expired} {t("expiredCountLabel")}</Badge>
                </div>
              </div>

              {showForm ? (
                <div className="mt-4 rounded-[12px] border border-border/70 bg-background/65 p-4">
                  <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("formTitle")}</p>
                  <form onSubmit={handleCreate} className="mt-3 grid gap-4">
                    <Input label={t("reason")} placeholder={t("reasonPlaceholder")} value={form.reason} onChange={(e) => setForm((c) => ({ ...c, reason: e.target.value }))} required />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DateField label={t("startDateShort")} value={form.startDate} onChange={(v) => setForm((c) => ({ ...c, startDate: v }))} required />
                      <DateField label={t("endDateShort")} value={form.endDate} onChange={(v) => setForm((c) => ({ ...c, endDate: v }))} required />
                    </div>
                    <Button type="submit" variant="primary" loading={createMutation.isPending}>{t("createBtn")}</Button>
                  </form>
                </div>
              ) : (
                <div className="mt-4 rounded-[12px] border border-dashed border-border/60 bg-background/40 px-4 py-6 text-center">
                  <FileText className="mx-auto size-6 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">{t("formDescription")}</p>
                  <Button className="mt-3" size="sm" variant="primary" icon={<Plus className="size-4" />} onClick={() => setShowForm(true)}>{t("createBtn")}</Button>
                </div>
              )}
            </>
          )}

          {!loadingStudents && !studentsError && students.length === 0 && (
            <div className="mt-4">
              <EmptyState icon={Users} title={t("studentsEmptyTitle")} description={t("studentsEmptyDescription")} />
            </div>
          )}
        </BioPanel>

        {/* Right: history */}
        <BioPanel index={4} reducedEffects={reducedEffects} className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("historyPanelTitle")}</p>
              <h3 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">{t("historyTitle")}</h3>
            </div>
            <Button size="sm" variant="ghost" icon={<RefreshCw className="size-4" />} onClick={() => void refetchDispensas()}>{common("refresh")}</Button>
          </div>

          <div className="mt-4">
            {!selectedStudent ? (
              <div className="rounded-[12px] border border-dashed border-border/60 bg-background/40 px-4 py-8 text-center">
                <Users className="mx-auto size-6 text-muted-foreground/40" />
                <p className="mt-2.5 text-sm text-muted-foreground">{t("studentContextEmpty")}</p>
              </div>
            ) : dispensasError ? (
              <EmptyState icon={ShieldOff} title={t("historyLoadErrorTitle")} description={t("historyLoadErrorDescription")} action={<Button size="sm" variant="secondary" icon={<RefreshCw className="size-4" />} onClick={() => void refetchDispensas()}>{common("refresh")}</Button>} />
            ) : loadingDispensas ? (
              <div className="grid gap-3">
                {[1,2,3].map((i) => <div key={i} className="rounded-[12px] border border-border/70 bg-background/58 p-4"><Skeleton className="h-5 w-48" /><Skeleton className="mt-3 h-4 w-60" /></div>)}
              </div>
            ) : sortedDispensas.length === 0 ? (
              <EmptyState icon={FileText} title={t("noExemptionsTitle")} description={t("noExemptions")} action={<Button size="sm" variant="primary" icon={<Plus className="size-4" />} onClick={() => setShowForm(true)}>{t("createBtn")}</Button>} />
            ) : (
              <div className="grid gap-3">
                {sortedDispensas.map((exemption) => {
                  const active = isExemptionActive(exemption.endDate);
                  return (
                    <div key={exemption.id} className="rounded-[12px] border border-border/70 bg-background/65 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{exemption.reason}</p>
                            <Badge variant={active ? "success" : "default"} size="sm">{active ? t("activeBadge") : t("expiredBadge")}</Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="size-3.5" />{formatDate(exemption.startDate)} – {formatDate(exemption.endDate)}</span>
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><FileText className="size-3.5" />{t("createdAtLabel")} {formatDate(exemption.createdAt)}</span>
                          </div>
                        </div>
                        <Button type="button" size="icon" variant="ghost" onClick={() => setDeleteId(exemption.id)} title={t("deleteBtn")} className="shrink-0 text-muted-foreground hover:border-danger-500/20 hover:bg-danger-500/10 hover:text-danger-500"><Trash2 className="size-4" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </BioPanel>
      </div>

      <ConfirmModal open={!!deleteId} title={t("deleteTitle")} message={t("deleteDesc")} variant="danger" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </PageScaffold>
  );
}
