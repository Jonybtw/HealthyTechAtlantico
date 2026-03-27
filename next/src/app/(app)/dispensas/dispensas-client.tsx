"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Plus,
  RefreshCw,
  ShieldOff,
  Trash2,
  Calendar,
  FileText,
  Activity,
} from "lucide-react";
import {
  FadeIn,
  StaggerList,
  StaggerItem,
  AnimatePresence,
} from "@/components/ui/motion";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { StudentPicker } from "@/components/ui/student-picker";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
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
import { MeshGlow } from "@/components/ui/mesh-glow";
import { cn } from "@/lib/utils";

export default function DispensasPage() {
  const t = useTranslations("dispensas");
  const common = useTranslations("common");
  const { role } = useUser();
  const canManageDispensas = role === "ADMIN" || role === "PROFESSOR";

  const {
    data: studentsList = [],
    isLoading: loadingStudents,
    isError: studentsError,
    refetch: refetchStudents,
  } = useStudents();

  const students = useMemo(
    () =>
      studentsList.map((s) => ({
        id: s.id,
        name: s.name,
        className: s.className ?? null,
      })),
    [studentsList],
  );

  const [studentId, setStudentId] = useState<string | null>(null);

  const {
    data: dispensas = [],
    isLoading: loading,
    isError: dispensasError,
    refetch: refetchDispensas,
  } = useDispensas(studentId);

  const createMutation = useCreateDispensa(studentId);
  const deleteMutation = useDeleteDispensa(studentId);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    reason: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (studentsError) {
      toast.error(common("studentListLoadError"));
    }
  }, [studentsError, common]);

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
      toast.error(
        error instanceof Error ? error.message : t("connectionError"),
      );
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

  const isDispensaActive = (endDate?: string | Date | null) => {
    if (!endDate) return true;
    return new Date(endDate) >= new Date();
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
          title="Sem acesso às dispensas"
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
        eyebrow: "GESTÃO · DISPENSAS",
      }}
      headerActions={
        <Button
          variant="sanctuary"
          size="sm"
          icon={showForm ? undefined : <Plus className="size-4" />}
          onClick={() => setShowForm((v) => !v)}
          className="shadow-[0_0_15px_rgba(216,173,52,0.3)]"
        >
          {showForm ? t("cancelBtn") : t("newBtn")}
        </Button>
      }
    >
      <div className="relative">
        <MeshGlow className="top-0 right-0 opacity-20" />
        <MeshGlow className="bottom-0 left-0 opacity-10" />

        <PageSection layout="list" className="bg-transparent mb-8">
          <div className="w-full max-w-sm">
            <StudentPicker
              students={students}
              value={studentId}
              onChange={setStudentId}
              loading={loadingStudents}
            />
          </div>
        </PageSection>

        <AnimatePresence>
          {showForm && (
            <FadeIn key="dispensa-form" className="mb-8">
              <PageSection className="glass-card max-w-2xl border-primary-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-8 rounded-full bg-primary-500/10 flex items-center justify-center">
                    <Plus className="size-4 text-primary-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                    {t("createBtn")}
                  </h3>
                </div>

                <form
                  onSubmit={handleCreate}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="md:col-span-2">
                    <Input
                      label={t("reason")}
                      placeholder="Ex: Recuperação Pós-Cirúrgica"
                      value={form.reason}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, reason: e.target.value }))
                      }
                      required
                      className="glass-input"
                    />
                  </div>
                  <DateField
                    label={t("startDateShort")}
                    value={form.startDate}
                    onChange={(val) =>
                      setForm((f) => ({ ...f, startDate: val }))
                    }
                    required
                  />
                  <DateField
                    label={t("endDateShort")}
                    value={form.endDate}
                    onChange={(val) => setForm((f) => ({ ...f, endDate: val }))}
                  />

                  <div className="md:col-span-2 flex justify-end mt-2">
                    <Button
                      type="submit"
                      variant="sanctuary"
                      loading={createMutation.isPending}
                      className="min-w-[160px]"
                    >
                      {t("createBtn")}
                    </Button>
                  </div>
                </form>
              </PageSection>
            </FadeIn>
          )}
        </AnimatePresence>

        <PageSection layout="list" className="bg-transparent">
          {studentsError ? (
            <EmptyState
              icon={ShieldOff}
              title="Erro na Ligação"
              description="Não foi possível carregar os alunos. Verifica a tua ligação."
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<RefreshCw className="size-4" />}
                  onClick={() => void refetchStudents()}
                >
                  Tentar novamente
                </Button>
              }
            />
          ) : !loadingStudents && students.length === 0 ? (
            <EmptyState
              icon={ShieldOff}
              title="Sem alunos"
              description="Ainda não há alunos carregados no sistema."
            />
          ) : !studentId ? (
            <EmptyState
              icon={Activity}
              title="Seleção Necessária"
              description="Escolhe um aluno para gerir as suas dispensas médicas e protocolos."
            />
          ) : dispensasError ? (
            <EmptyState
              icon={ShieldOff}
              title="Erro de Carregamento"
              description="Houve um problema ao procurar as dispensas."
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<RefreshCw className="size-4" />}
                  onClick={() => void refetchDispensas()}
                >
                  Tentar novamente
                </Button>
              }
            />
          ) : loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="glass-card p-6 flex justify-between items-center opacity-50"
                >
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-4 w-48 bg-white/5" />
                    <Skeleton className="h-3 w-32 bg-white/5" />
                  </div>
                  <Skeleton className="size-10 rounded-full bg-white/5" />
                </div>
              ))}
            </div>
          ) : dispensas.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={t("noDispensasTitle")}
              description={t("noDispensas")}
              action={
                canManageDispensas ? (
                  <Button
                    size="sm"
                    variant="sanctuary"
                    icon={<Plus className="size-4" />}
                    onClick={() => setShowForm(true)}
                  >
                    {t("createBtn")}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <StaggerList className="grid gap-4">
              {dispensas.map((dispensa) => {
                const active = isDispensaActive(dispensa.endDate);
                return (
                  <StaggerItem key={dispensa.id}>
                    <div
                      className={cn(
                        "glass-card group p-6 flex items-center justify-between transition-all duration-500 hover:scale-[1.01]",
                        active
                          ? "border-gold-500/30"
                          : "opacity-60 border-white/5",
                      )}
                    >
                      <div className="flex items-center gap-5">
                        <div
                          className={cn(
                            "size-12 rounded-full flex items-center justify-center shrink-0 border transition-all duration-500 group-hover:scale-110",
                            active
                              ? "bg-gold-500/10 border-gold-500/20 shadow-[0_0_15px_rgba(216,173,52,0.15)]"
                              : "bg-white/5 border-white/10",
                          )}
                        >
                          <ShieldOff
                            className={cn(
                              "size-5 transition-transform group-hover:rotate-12",
                              active
                                ? "text-gold-500 shadow-glow"
                                : "text-slate-500",
                            )}
                          />
                        </div>

                        <div className="flex flex-col">
                          <h4 className="text-white font-bold text-base tracking-tight mb-1">
                            {dispensa.reason}
                          </h4>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                              <Calendar className="size-3" />
                              <span>
                                {new Date(
                                  dispensa.startDate,
                                ).toLocaleDateString("pt-PT")}
                                {dispensa.endDate &&
                                  ` — ${new Date(dispensa.endDate).toLocaleDateString("pt-PT")}`}
                              </span>
                            </div>
                            {active ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-500/20 border border-gold-500/20 text-[10px] font-black uppercase tracking-tighter text-gold-500">
                                <div className="size-1 rounded-full bg-gold-500 animate-pulse" />
                                Ativa
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-tighter text-slate-500">
                                Expirada
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setDeleteId(dispensa.id)}
                        className="size-10 rounded-full flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 border border-transparent hover:border-red-500/20"
                        title={t("deleteBtn")}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerList>
          )}
        </PageSection>
      </div>

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
