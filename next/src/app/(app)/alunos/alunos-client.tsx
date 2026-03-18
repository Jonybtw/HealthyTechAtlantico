"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, FileUp, Mars, UserPlus, Venus } from "lucide-react";
import { FadeIn, AnimatePresence } from "@/components/ui/motion";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillSelect } from "@/components/ui/pill-select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { readApiResponse } from "@/lib/api-client";
import { getInitials, getStudentSwatch } from "@/components/ui/student-picker";
import { createStudentAction } from "./actions";

interface StudentRow {
  id: string;
  name: string;
  sex: string;
  birthDate: Date | null;
  className: string | null;
  schoolYear: string | null;
}

interface AlunosClientProps {
  initialStudents: StudentRow[];
}

export function AlunosClient({ initialStudents }: AlunosClientProps) {
  const t = useTranslations("alunos");
  const locale = useLocale();
  const router = useRouter();

  const [showCreate, setShowCreate] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    name: "",
    sex: "M",
    birthDate: "",
  });
  const [state, formAction, isPending] = useActionState(createStudentAction, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
      return;
    }

    if (state?.success) {
      toast.success(t("createSuccess"));
      const frame = requestAnimationFrame(() => {
        setShowCreate(false);
        setForm({ name: "", sex: "M", birthDate: "" });
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
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback 
              className="text-[10px] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
              style={getStudentSwatch(row)}
            >
              {getInitials(row.name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    { key: "sex", header: t("colSex"), sortable: true, className: "w-16 text-center" },
    {
      key: "birthDate",
      header: t("colBirth"),
      sortable: true,
      render: (row) =>
        row.birthDate ? new Date(row.birthDate).toLocaleDateString(locale) : "-",
    },
    {
      key: "className",
      header: t("colClass"),
      render: (row) => row.className ?? "-",
    },
  ];

  const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsImportingCsv(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });
      const result = await readApiResponse<{
        created: number;
        failed: number;
      }>(response);

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
      toast.error(error instanceof Error ? error.message : "Erro na importacao CSV");
    } finally {
      event.target.value = "";
      setIsImportingCsv(false);
    }
  };

  return (
    <PageScaffold
      headerProps={{ title: t("title"), description: t("description"), eyebrow: "Students" }}
      headerActions={
        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvImport}
          />
          <Button
            size="sm"
            variant="ghost"
            icon={<FileUp className="size-4" />}
            loading={isImportingCsv}
            onClick={() => importInputRef.current?.click()}
          >
            CSV
          </Button>
          <Button
            size="sm"
            icon={<UserPlus className="size-4" />}
            onClick={() => setShowCreate((value) => !value)}
          >
            {showCreate ? t("cancel") : t("new")}
          </Button>
        </div>
      }
    >

      <AnimatePresence>
        {showCreate ? (
          <FadeIn key="create-form" className="max-w-xl">
        <PageSection
          title={t("create")}
          description={t("description")}
          tone="primary"
          layout="form"
        >
              <form action={formAction} className="flex flex-col gap-4">
                <Input
                  name="name"
                  label={t("colName")}
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                  autoFocus
                />
                <PillSelect
                  label={t("colSex")}
                  options={[
                    { value: "M", label: t("male"), icon: <Mars className="size-3.5" /> },
                    { value: "F", label: t("female"), icon: <Venus className="size-3.5" /> },
                  ]}
                  value={form.sex}
                  onChange={(value) => setForm((current) => ({ ...current, sex: value }))}
                />
                <input type="hidden" name="sex" value={form.sex} />
                <Input
                  name="birthDate"
                  label={t("birthDateLabel")}
                  type="date"
                  value={form.birthDate}
                  leftIcon={<CalendarDays className="size-4" />}
                  hint="dd/mm/aaaa"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, birthDate: event.target.value }))
                  }
                  required
                />
                <Button
                  type="submit"
                  loading={isPending}
                  icon={<UserPlus className="size-4" />}
                  className="self-start"
                >
                  {t("create")}
                </Button>
              </form>
            </PageSection>
          </FadeIn>
        ) : null}
      </AnimatePresence>

      <DataTable
        columns={columns}
        data={initialStudents}
        rowKey={(row) => row.id}
        onRowClick={(row) => router.push(`/alunos/${row.id}`)}
        emptyMessage={t("emptyMessage")}
        toolbarTitle={t("title")}
        toolbarSummary={
          locale === "en"
            ? `${initialStudents.length} result${initialStudents.length === 1 ? "" : "s"}`
            : `${initialStudents.length} resultado${initialStudents.length === 1 ? "" : "s"}`
        }
      />
    </PageScaffold>
  );
}
