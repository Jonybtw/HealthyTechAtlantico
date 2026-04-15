"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileUp, Mars, UserPlus, Venus, X } from "lucide-react";
import { FadeIn, AnimatePresence } from "@/components/ui/motion";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { PillSelect } from "@/components/ui/pill-select";
import { readApiResponse } from "@/lib/api-client";
import { StudentIdentity } from "@/components/ui/student-identity";
import { createStudentAction } from "./actions";

interface StudentRow {
  id: string;
  name: string;
  sex: string;
  birthDate: Date | null;
  className: string | null;
  schoolYear: string | null;
  processNumber: string | null;
}

interface AlunosClientProps {
  initialStudents: StudentRow[];
  totalStudents: number;
  currentPage: number;
}

export function AlunosClient({ initialStudents, totalStudents, currentPage }: AlunosClientProps) {
  const t = useTranslations("alunos");
  const common = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [showCreate, setShowCreate] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    name: "",
    sex: "M",
    birthDate: "",
    processNumber: "",
  });
  const [state, formAction, isPending] = useActionState(
    createStudentAction,
    null,
  );
  const lastHandledStateRef = useRef<typeof state>(null);

  useEffect(() => {
    if (!state || lastHandledStateRef.current === state) {
      return;
    }
    lastHandledStateRef.current = state;
    if (state?.error) {
      toast.error(state.error);
      return;
    }
    if (state?.success) {
      toast.success(t("createSuccess"));
      const frame = requestAnimationFrame(() => {
        setShowCreate(false);
        setForm({ name: "", sex: "M", birthDate: "", processNumber: "" });
        router.refresh();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [router, state, t]);

  const columns: Column<StudentRow>[] = [
    {
      key: "name",
      header: t("colName"),
      sortable: true,
      render: (row) => <StudentIdentity student={row} />,
    },
    {
      key: "processNumber",
      header: t("colProcessNumber"),
      sortable: true,
      render: (row) =>
        row.processNumber ? (
          <span className="text-sm font-semibold text-navy-900">{row.processNumber}</span>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      key: "sex",
      header: t("colSex"),
      sortable: true,
      className: "w-24",
      render: (row) =>
        row.sex === "M" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-micro font-bold uppercase tracking-wide text-blue-700">
            <Mars className="size-3" />
            Masc
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-micro font-bold uppercase tracking-wide text-rose-700">
            <Venus className="size-3" />
            Fem
          </span>
        ),
    },
    {
      key: "birthDate",
      header: t("colBirth"),
      sortable: true,
      render: (row) =>
        row.birthDate
          ? new Date(row.birthDate).toLocaleDateString(locale)
          : "-",
    },
    {
      key: "className",
      header: t("colClass"),
      render: (row) =>
        row.className ? (
          <span className="text-sm font-semibold text-navy-900">
            {row.className}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
  ];

  const handleCsvImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImportingCsv(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });
      const result = await readApiResponse<{ created: number; failed: number }>(
        response,
      );
      toast.success(
        locale === "en"
          ? `Imported ${result.created} students`
          : `Importados ${result.created} alunos`,
      );
      if (result.failed > 0) {
        toast.warning(
          locale === "en"
            ? `${result.failed} rows failed validation`
            : `${result.failed} linhas falharam validacao`,
        );
      }
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro na importacao CSV",
      );
    } finally {
      event.target.value = "";
      setIsImportingCsv(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-amber-400 opacity-[0.07] blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[50%] w-[50%] rounded-full bg-navy-800 opacity-[0.08] blur-[120px]" />
      </div>

      <div className="relative z-10">
        <PageScaffold
          headerProps={{
            title: t("title"),
            description: t("description"),
            eyebrow: "ADMINISTRAÇÃO · DIRETÓRIO",
          }}
          headerActions={
            <div className="flex items-center gap-3">
              <input
                ref={importInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleCsvImport}
              />
              {/* Ghost import button */}
              <Button
                type="button"
                variant="primary"
                size="lg"
                loading={isImportingCsv}
                icon={<FileUp className="size-4" />}
                onClick={() => importInputRef.current?.click()}
              >
                {common("importCsv")}
              </Button>

              {/* Primary gradient button */}
              <Button
                type="button"
                variant={showCreate ? "outline" : "primary"}
                size="lg"
                onClick={() => setShowCreate((v) => !v)}
                icon={
                  showCreate ? (
                    <X className="size-4" />
                  ) : (
                    <UserPlus className="size-4" />
                  )
                }
              >
                {showCreate ? t("cancel") : t("new")}
              </Button>
            </div>
          }
        >
          {/* Inline create form */}
          <AnimatePresence>
            {showCreate ? (
              <FadeIn key="create-form">
                <div className="relative mb-8 overflow-hidden rounded-2xl border border-blue-50 bg-white p-6 shadow-sm">
                  {/* Decorative orb */}
                  <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-amber-400 opacity-[0.06] blur-2xl" />
                  <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-navy-800">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                    Cadastro Rápido
                  </h3>
                  <form action={formAction}>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:grid-cols-5">
                      <div className="space-y-1.5">
                        <label className="ml-1 text-micro font-bold uppercase tracking-widest text-slate-400">
                          {t("colProcessNumber")}
                        </label>
                        <Input
                          name="processNumber"
                          value={form.processNumber}
                          onChange={(e) =>
                            setForm((c) => ({ ...c, processNumber: e.target.value }))
                          }
                          placeholder="Ex: P2026001"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="ml-1 text-micro font-bold uppercase tracking-widest text-slate-400">
                          {t("colName")}
                        </label>
                        <Input
                          name="name"
                          value={form.name}
                          onChange={(e) =>
                            setForm((c) => ({ ...c, name: e.target.value }))
                          }
                          required
                          autoFocus
                          placeholder="Ex: Ana Beatriz Rocha"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="ml-1 text-micro font-bold uppercase tracking-widest text-slate-400">
                          {t("colSex")}
                        </label>
                        <PillSelect
                          options={[
                            {
                              value: "M",
                              label: t("male"),
                              icon: <Mars className="size-3.5" />,
                            },
                            {
                              value: "F",
                              label: t("female"),
                              icon: <Venus className="size-3.5" />,
                            },
                          ]}
                          value={form.sex}
                          onChange={(v) => setForm((c) => ({ ...c, sex: v }))}
                        />
                        <input type="hidden" name="sex" value={form.sex} />
                      </div>

                      <div className="space-y-1.5">
                        <label className="ml-1 text-micro font-bold uppercase tracking-widest text-slate-400">
                          {t("birthDateLabel")}
                        </label>
                        <DateField
                          name="birthDate"
                          value={form.birthDate}
                          onChange={(v) =>
                            setForm((c) => ({ ...c, birthDate: v }))
                          }
                          required
                        />
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="submit"
                          loading={isPending}
                          icon={<UserPlus className="size-4" />}
                          className="w-full"
                        >
                          {t("create")}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </FadeIn>
            ) : null}
          </AnimatePresence>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={initialStudents}
            serverTotalItems={totalStudents}
            serverPage={currentPage}
            onServerPageChange={(pageNum) => {
              const url = new URL(window.location.href);
              url.searchParams.set("page", pageNum.toString());
              router.push(url.toString());
            }}
            onServerSearch={(query) => {
              const url = new URL(window.location.href);
              if (query) {
                url.searchParams.set("search", query);
              } else {
                url.searchParams.delete("search");
              }
              url.searchParams.set("page", "1");
              router.push(url.toString());
            }}
            rowKey={(row) => row.id}
            onRowClick={(row) => router.push(`/alunos/${row.id}`)}
            emptyMessage={t("emptyMessage")}
            toolbarTitle={t("title")}
            toolbarSummary={
              <>
                <span className="text-navy-800">{totalStudents}</span>{" "}
                {locale === "en"
                  ? `result${totalStudents === 1 ? "" : "s"}`
                  : `resultado${totalStudents === 1 ? "" : "s"}`}
              </>
            }
          />
        </PageScaffold>
      </div>
    </div>
  );
}
