"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CalendarDays, Plus, ShieldOff, Trash2 } from "lucide-react";
import { FadeIn, StaggerList, StaggerItem, AnimatePresence } from "@/components/ui/motion";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { StudentPicker } from "@/components/ui/student-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";
import {
  useStudents,
  useDispensas,
  useCreateDispensa,
  useDeleteDispensa,
} from "@/hooks/use-queries";
import { usePageTitle } from "@/hooks/use-page-title";

export default function DispensasPage() {
  const t = useTranslations("dispensas");
  const common = useTranslations("common");
  usePageTitle(t("title"));
  const { role } = useUser();
  const canManageDispensas = role === "ADMIN" || role === "PROFESSOR";

  const { data: studentsList = [] } = useStudents();
  const students = studentsList.map((s) => ({ id: s.id, name: s.name, className: s.className ?? null }));
  const [studentId, setStudentId] = useState<string | null>(null);
  const { data: dispensas = [], isLoading: loading } = useDispensas(studentId);
  const createMutation = useCreateDispensa(studentId);
  const deleteMutation = useDeleteDispensa(studentId);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    reason: "",
    startDate: "",
    endDate: "",
  });

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!studentId) return;

    try {
      await createMutation.mutateAsync({
        reason: form.reason,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
      });
      toast.success(t("success"));
      setShowForm(false);
      setForm({ reason: "", startDate: "", endDate: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("connectionError"));
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !studentId) return;

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
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">{common("noPermission")}</p>
      </div>
    );
  }

  return (
    <PageScaffold
      headerProps={{ title: t("title"), description: t("description") }}
      headerActions={
        <Button
          size="sm"
          icon={<Plus className="size-4" />}
          onClick={() => setShowForm((value) => !value)}
        >
          {showForm ? t("cancelBtn") : t("newBtn")}
        </Button>
      }
    >
        <PageSection tone="secondary" layout="list">
          <div className="w-full max-w-sm">
            <StudentPicker students={students} value={studentId} onChange={setStudentId} />
          </div>          </PageSection>
      <AnimatePresence>
        {showForm ? (
          <FadeIn key="dispensa-form" className="max-w-lg">
            <PageSection tone="primary" layout="form">
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
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
                    leftIcon={<CalendarDays className="size-4" />}
                    hint="dd/mm/aaaa"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, startDate: event.target.value }))
                    }
                    required
                  />
                  <Input
                    label={t("endDateShort")}
                    type="date"
                    value={form.endDate}
                    leftIcon={<CalendarDays className="size-4" />}
                    hint="dd/mm/aaaa"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, endDate: event.target.value }))
                    }
                  />
                </div>
                <Button
                  type="submit"
                  loading={createMutation.isPending}
                  icon={<ShieldOff className="size-4" />}
                  className="self-start"
                >
                  {t("createBtn")}
                </Button>
              </form>
            </PageSection>
          </FadeIn>
        ) : null}
      </AnimatePresence>

      <PageSection tone="secondary" layout="list">
        {!studentId ? (
          <EmptyState
            icon={ShieldOff}
            title={t("noStudentSelected")}
            description={t("noStudentSelectedDesc")}
          />
        ) : loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="surface-utility rounded-[18px] p-4 flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3.5 w-44" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            ))}
          </div>
        ) : dispensas.length === 0 ? (
          <EmptyState
            icon={ShieldOff}
            title={t("noDispensasTitle")}
            description={t("noDispensas")}
            action={
              canManageDispensas ? (
                <Button
                  size="sm"
                  icon={<Plus className="size-4" />}
                  onClick={() => setShowForm(true)}
                >
                  {t("createBtn")}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <StaggerList className="flex flex-col gap-3">
            {dispensas.map((dispensa) => (
              <StaggerItem
                key={dispensa.id}
                className="surface-utility rounded-[18px] p-4 flex items-center justify-between transition-all duration-300 hover:-translate-y-0.5"
              >
                <div>
                  <p className="text-sm font-semibold">{dispensa.reason}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 font-medium bg-muted/50 inline-block px-2 py-0.5 rounded-md border border-border/50">
                    {new Date(dispensa.startDate).toLocaleDateString("pt-PT")}
                    {` - ${new Date(dispensa.endDate).toLocaleDateString("pt-PT")}`}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteId(dispensa.id)}
                  aria-label={t("deleteBtn")}
                  className="p-2 rounded-lg text-muted-foreground hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all border border-transparent hover:border-danger-200 dark:hover:border-danger-800/30 shadow-sm"
                >
                  <Trash2 className="size-4" />
                </button>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </PageSection>

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
