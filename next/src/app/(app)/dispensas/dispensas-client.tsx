"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Calendar,
  FileText,
  Plus,
  RefreshCw,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
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

  if (!canManageDispensas) {
    return (
      <PageScaffold
        headerProps={{
          title: t("title"),
          description: t("description"),
          eyebrow: "GESTÃO · DISPENSAS",
        }}
      >
        <EmptyState
          icon={ShieldOff}
          title={t("accessTitle")}
          description={t("accessDescription")}
        />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      header={
        <div className="relative overflow-hidden rounded-2xl border border-white/18 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 px-5 py-5 text-white shadow-float sm:px-7 sm:py-6">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/80 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_32%),radial-gradient(circle_at_86%_18%,rgba(216,173,52,0.16),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(157,180,200,0.12),transparent_28%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-tiny font-semibold uppercase tracking-[0.22em] text-gold-200">
                <span className="rounded-full border border-border bg-surface-utility px-3 py-1 shadow-sm backdrop-blur-md">
                  GESTÃO · DISPENSAS
                </span>
                {selectedStudent?.className ? (
                  <span className="rounded-full border border-border bg-surface-utility px-3 py-1 shadow-sm text-white/80 backdrop-blur-md">
                    {selectedStudent.className}
                  </span>
                ) : null}
              </div>

              <div className="space-y-2">
                <h1 className="font-display text-[1.9rem] font-extrabold tracking-[-0.05em] text-white sm:text-[2.35rem]">
                  {t("title")}
                </h1>
                <p className="max-w-2xl text-sm font-medium leading-relaxed text-white/76 sm:text-base">
                  {selectedStudent ? selectedSummary : t("description")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {selectedStudent ? (
                <>
                  <Badge variant="success" size="md">
                    {stats.active} {t("activeCountLabel")}
                  </Badge>
                  <Badge variant="default" size="md">
                    {stats.expired} {t("expiredCountLabel")}
                  </Badge>
                </>
              ) : null}

              <Button
                variant="primary"
                size="sm"
                icon={showForm ? undefined : <Plus className="size-4" />}
                disabled={!studentId && !showForm}
                onClick={() => {
                  if (!studentId && !showForm) {
                    return;
                  }
                  setShowForm((current) => !current);
                }}
              >
                {showForm ? t("cancelBtn") : t("newBtn")}
              </Button>
            </div>
          </div>
        </div>
      }
      contentClassName="gap-4"
    >
      <PageSection tone="utility" layout="default" className="overflow-visible">
        <div className="max-w-[420px] space-y-2">
          <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t("studentPickerLabel")}
          </p>
          <StudentPicker
            students={students}
            value={studentId}
            onChange={handleStudentChange}
            loading={loadingStudents}
          />
        </div>
      </PageSection>

      {studentsError ? (
        <PageSection tone="secondary">
          <EmptyState
            icon={ShieldOff}
            title={t("studentsLoadErrorTitle")}
            description={t("studentsLoadErrorDescription")}
            action={
              <Button
                size="sm"
                variant="secondary"
                icon={<RefreshCw className="size-4" />}
                onClick={() => void refetchStudents()}
              >
                {common("refresh")}
              </Button>
            }
          />
        </PageSection>
      ) : !loadingStudents && students.length === 0 ? (
        <PageSection tone="secondary">
          <EmptyState
            icon={ShieldOff}
            title={t("studentsEmptyTitle")}
            description={t("studentsEmptyDescription")}
          />
        </PageSection>
      ) : studentId && selectedStudent ? (
        <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-start">
          <PageSection tone="primary" layout="form">
            <div className="rounded-3xl border border-border/70 bg-background/72 p-5">
              <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t("studentContextTitle")}
              </p>
              <StudentIdentity
                student={selectedStudent}
                subtitle={selectedStudent.className ?? t("studentPickerLabel")}
                className="mt-3"
                nameClassName="text-lg"
              />
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {selectedSummary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="success" size="md">
                  {stats.active} {t("activeCountLabel")}
                </Badge>
                <Badge variant="default" size="md">
                  {stats.expired} {t("expiredCountLabel")}
                </Badge>
              </div>
            </div>

            {showForm ? (
              <div className="rounded-3xl border border-border/70 bg-background/72 p-5 sm:p-6">
                <div className="mb-5 space-y-1">
                  <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("formTitle")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("formDescription")}
                  </p>
                </div>

                <form onSubmit={handleCreate} className="grid gap-5">
                  <Input
                    label={t("reason")}
                    placeholder={t("reasonPlaceholder")}
                    value={form.reason}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        reason: event.target.value,
                      }))
                    }
                    required
                  />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <DateField
                      label={t("startDateShort")}
                      value={form.startDate}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, startDate: value }))
                      }
                      required
                    />

                    <DateField
                      label={t("endDateShort")}
                      value={form.endDate}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, endDate: value }))
                      }
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={createMutation.isPending}
                    >
                      {t("createBtn")}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border/70 bg-background/52 p-5">
                <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t("formTitle")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("formDescription")}
                </p>
                <Button
                  className="mt-4"
                  type="button"
                  variant="primary"
                  icon={<Plus className="size-4" />}
                  onClick={() => setShowForm(true)}
                >
                  {t("createBtn")}
                </Button>
              </div>
            )}
          </PageSection>

          <PageSection
            tone="secondary"
            layout="list"
            title={t("historyTitle")}
            description={selectedStudent.name}
            actions={
              <Button
                size="sm"
                variant="secondary"
                icon={<RefreshCw className="size-4" />}
                onClick={() => void refetchDispensas()}
              >
                {common("refresh")}
              </Button>
            }
          >
            {dispensasError ? (
              <EmptyState
                icon={ShieldOff}
                title={t("historyLoadErrorTitle")}
                description={t("historyLoadErrorDescription")}
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<RefreshCw className="size-4" />}
                    onClick={() => void refetchDispensas()}
                  >
                    {common("refresh")}
                  </Button>
                }
              />
            ) : loadingDispensas ? (
              <div className="grid gap-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-border/70 bg-background/58 p-5"
                  >
                    <Skeleton className="h-5 w-52" />
                    <Skeleton className="mt-4 h-4 w-64" />
                  </div>
                ))}
              </div>
            ) : sortedDispensas.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={t("noExemptionsTitle")}
                description={t("noExemptions")}
                action={
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Plus className="size-4" />}
                    onClick={() => setShowForm(true)}
                  >
                    {t("createBtn")}
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {sortedDispensas.map((exemption) => {
                  const active = isExemptionActive(exemption.endDate);

                  return (
                    <div
                      key={exemption.id}
                      className="rounded-[22px] border border-border/70 bg-background/58 p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                              {exemption.reason}
                            </h3>
                            <Badge
                              variant={active ? "success" : "default"}
                              size="sm"
                            >
                              {active ? t("activeBadge") : t("expiredBadge")}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5">
                              <Calendar className="size-4" />
                              <span>
                                {formatDate(exemption.startDate)} -{" "}
                                {formatDate(exemption.endDate)}
                              </span>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5">
                              <FileText className="size-4" />
                              <span>
                                {t("createdAtLabel")} {formatDate(exemption.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteId(exemption.id)}
                          title={t("deleteBtn")}
                          className="text-muted-foreground hover:border-danger-500/20 hover:bg-danger-500/10 hover:text-danger-500"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </PageSection>
        </div>
      ) : (
        <PageSection tone="secondary" layout="default">
          <div className="rounded-3xl border border-dashed border-border/70 bg-background/52 p-5 sm:p-6">
            <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("workspaceTitle")}
            </p>
            <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-foreground">
              {t("studentContextEmpty")}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("formDescription")}
            </p>
          </div>
        </PageSection>
      )}

      <ConfirmModal
        open={!!deleteId}
        title={t("deleteTitle")}
        message={t("deleteDesc")}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </PageScaffold>
  );
}
