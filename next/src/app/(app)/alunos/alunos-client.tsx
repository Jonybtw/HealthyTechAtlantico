"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  FileUp,
  Mars,
  RotateCcw,
  UserPlus,
  Users,
  Venus,
} from "lucide-react";
import { toast } from "sonner";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PillSelect } from "@/components/ui/pill-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { readApiResponse } from "@/lib/api-client";
import { StudentIdentity } from "@/components/ui/student-identity";
import { useStudents, useStudentsList } from "@/hooks/use-queries";
import { createStudentAction } from "./actions";

const ALL_FILTER_VALUE = "__all__";

interface StudentRow {
  id: string;
  name: string;
  sex: string;
  birthDate: string | null;
  className: string | null;
  schoolYear: string | null;
}

interface AlunosClientProps {
  currentPage: number;
  searchQuery: string;
  classNameQuery: string;
  schoolYearQuery: string;
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function buildRelativeUrl(url: URL) {
  return url.search ? `${url.pathname}${url.search}` : url.pathname;
}

export function AlunosClient({
  currentPage,
  searchQuery,
  classNameQuery,
  schoolYearQuery,
}: AlunosClientProps) {
  const t = useTranslations("alunos");
  const common = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();

  const studentsQuery = useStudentsList({
    page: currentPage,
    limit: 15,
    search: searchQuery,
    className: classNameQuery,
    schoolYear: schoolYearQuery,
  });
  const allStudentsQuery = useStudents(2000);

  const students = studentsQuery.data?.students ?? [];
  const totalStudents = studentsQuery.data?.total ?? 0;

  const [showCreate, setShowCreate] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    name: "",
    sex: "M",
    birthDate: "",
    className: "",
    schoolYear: "",
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

    if (state.error) {
      toast.error(state.error);
      return;
    }

    if (state.success) {
      toast.success(t("createSuccess"));
      const frame = requestAnimationFrame(() => {
        setShowCreate(false);
        setForm({
          name: "",
          sex: "M",
          birthDate: "",
          className: "",
          schoolYear: "",
        });
        void queryClient.invalidateQueries({ queryKey: ["students-list"] });
        void queryClient.invalidateQueries({ queryKey: ["students"] });
        router.refresh();
      });

      return () => cancelAnimationFrame(frame);
    }
  }, [queryClient, router, state, t]);

  const filterSource = allStudentsQuery.data ?? students;
  const classOptions = useMemo(() => {
    return [...new Set(filterSource.map((student) => student.className).filter(isNonEmptyString))].sort(
      (left, right) => left.localeCompare(right, locale, { numeric: true }),
    );
  }, [filterSource, locale]);
  const schoolYearOptions = useMemo(() => {
    return [...new Set(filterSource.map((student) => student.schoolYear).filter(isNonEmptyString))].sort(
      (left, right) => right.localeCompare(left, locale, { numeric: true }),
    );
  }, [filterSource, locale]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() || classNameQuery || schoolYearQuery,
  );
  const hasDirectoryStudents =
    (allStudentsQuery.data?.length ?? studentsQuery.data?.total ?? 0) > 0;

  const columns: Column<StudentRow>[] = [
    {
      key: "name",
      header: t("colName"),
      sortable: true,
      className: "min-w-[260px]",
      render: (row) => (
        <StudentIdentity
          student={row}
          subtitle={
            row.schoolYear ? (
              <span className="text-xs text-muted-foreground">
                {row.schoolYear}
              </span>
            ) : undefined
          }
        />
      ),
    },
    {
      key: "sex",
      header: t("colSex"),
      sortable: true,
      className: "w-28",
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
      className: "w-32",
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

  const navigateWithParams = (
    mutate: (params: URLSearchParams) => void,
    mode: "push" | "replace" = "replace",
  ) => {
    const url = new URL(window.location.href);
    mutate(url.searchParams);
    const nextHref = buildRelativeUrl(url);

    if (mode === "push") {
      router.push(nextHref);
      return;
    }

    router.replace(nextHref);
  };

  const updateFilter = (key: "class_name" | "school_year", value: string) => {
    navigateWithParams((params) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set("page", "1");
    });
  };

  const clearFilters = () => {
    navigateWithParams((params) => {
      params.delete("search");
      params.delete("class_name");
      params.delete("school_year");
      params.set("page", "1");
    });
  };

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

      toast.success(t("importSuccess", { count: result.created }));

      if (result.failed > 0) {
        toast.warning(t("importPartialWarning", { count: result.failed }));
      }

      await queryClient.invalidateQueries({ queryKey: ["students-list"] });
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("importError"),
      );
    } finally {
      event.target.value = "";
      setIsImportingCsv(false);
    }
  };

  const toolbarActions = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={classNameQuery || ALL_FILTER_VALUE}
          onValueChange={(value) =>
            updateFilter(
              "class_name",
              value === ALL_FILTER_VALUE ? "" : value,
            )
          }
          disabled={allStudentsQuery.isLoading && classOptions.length === 0}
        >
          <SelectTrigger
            aria-label={t("filterClassLabel")}
            className="w-full sm:w-[148px]"
          >
            <SelectValue placeholder={t("filterClassLabel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>{t("filterClassAll")}</SelectItem>
            {classOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={schoolYearQuery || ALL_FILTER_VALUE}
          onValueChange={(value) =>
            updateFilter(
              "school_year",
              value === ALL_FILTER_VALUE ? "" : value,
            )
          }
          disabled={allStudentsQuery.isLoading && schoolYearOptions.length === 0}
        >
          <SelectTrigger
            aria-label={t("filterSchoolYearLabel")}
            className="w-full sm:w-[172px]"
          >
            <SelectValue placeholder={t("filterSchoolYearLabel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>
              {t("filterSchoolYearAll")}
            </SelectItem>
            {schoolYearOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="size-4" />}
            onClick={clearFilters}
          >
            {t("clearFilters")}
          </Button>
        ) : null}
      </div>

      <div className="hidden h-6 w-px bg-border/60 xl:block" />

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={importInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleCsvImport}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={isImportingCsv}
          icon={<FileUp className="size-4" />}
          onClick={() => importInputRef.current?.click()}
        >
          {common("importCsv")}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          icon={<UserPlus className="size-4" />}
          onClick={() => setShowCreate(true)}
        >
          {t("new")}
        </Button>
      </div>
    </>
  );

  const emptyMessage = hasActiveFilters
    ? t("emptyFilteredMessage")
    : hasDirectoryStudents
      ? t("emptyMessage")
      : t("studentsEmptyDescription");

  return (
    <>
      <PageScaffold
        contentClassName="gap-5"
        headerProps={{
          title: t("title"),
          description: t("description"),
          eyebrow: t("eyebrow"),
        }}
      >
        {studentsQuery.isError && !studentsQuery.data ? (
          <EmptyState
            icon={AlertTriangle}
            title={t("loadErrorTitle")}
            description={
              studentsQuery.error instanceof Error
                ? studentsQuery.error.message
                : t("loadErrorDescription")
            }
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => void studentsQuery.refetch()}
              >
                {common("refresh")}
              </Button>
            }
          />
        ) : studentsQuery.isLoading && !studentsQuery.data ? (
          <div className="rounded-2xl border border-white/20 bg-white/72 p-5 shadow-card">
            <div className="flex flex-col gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Skeleton className="h-10 w-full rounded-xl sm:w-[148px]" />
                <Skeleton className="h-10 w-full rounded-xl sm:w-[172px]" />
                <Skeleton className="h-10 w-full rounded-xl sm:w-28" />
                <Skeleton className="h-10 w-full rounded-full sm:w-56" />
              </div>
            </div>
            <div className="space-y-4 pt-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="grid grid-cols-[minmax(0,1.7fr)_110px_150px_110px] items-center gap-4"
                >
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-8 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <DataTable
            key={searchQuery}
            columns={columns}
            data={students}
            serverTotalItems={totalStudents}
            serverPage={currentPage}
            onServerPageChange={(pageNum) => {
              navigateWithParams(
                (params) => {
                  params.set("page", pageNum.toString());
                },
                "push",
              );
            }}
            onServerSearch={(query) => {
              navigateWithParams((params) => {
                if (query) {
                  params.set("search", query);
                } else {
                  params.delete("search");
                }
                params.set("page", "1");
              });
            }}
            rowKey={(row) => row.id}
            onRowClick={(row) => router.push(`/alunos/${row.id}`)}
            emptyMessage={emptyMessage}
            toolbarTitle={t("directoryToolbarTitle")}
            toolbarSummary={
              hasActiveFilters
                ? t("directoryFilteredSummary", { count: totalStudents })
                : t("directorySummary", { count: totalStudents })
            }
            toolbarActions={toolbarActions}
            searchPlaceholder={t("search")}
            searchValue={searchQuery}
            emptyStateIcon={Users}
          />
        )}
      </PageScaffold>

      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent
          side="right"
          className="flex h-full w-full max-w-[460px] flex-col gap-0 p-0"
        >
          <SheetHeader className="border-b border-border/60 px-6 py-6">
            <SheetTitle>{t("sheetTitle")}</SheetTitle>
            <SheetDescription>{t("sheetDescription")}</SheetDescription>
          </SheetHeader>

          <form action={formAction} className="flex h-full flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <Input
                name="name"
                label={t("colName")}
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
                autoFocus
                placeholder={t("namePlaceholder")}
              />

              <div className="space-y-2">
                <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t("colSex")}
                </p>
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
                  onChange={(value) =>
                    setForm((current) => ({ ...current, sex: value }))
                  }
                />
                <input type="hidden" name="sex" value={form.sex} />
              </div>

              <DateField
                name="birthDate"
                label={t("birthDateLabel")}
                value={form.birthDate}
                onChange={(value) =>
                  setForm((current) => ({ ...current, birthDate: value }))
                }
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  name="className"
                  label={t("classNameLabel")}
                  value={form.className}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      className: event.target.value,
                    }))
                  }
                  placeholder={t("classNamePlaceholder")}
                />
                <Input
                  name="schoolYear"
                  label={t("schoolYearLabel")}
                  value={form.schoolYear}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      schoolYear: event.target.value,
                    }))
                  }
                  placeholder={t("schoolYearPlaceholder")}
                />
              </div>
            </div>

            <SheetFooter className="border-t border-border/60 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreate(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                loading={isPending}
                icon={<UserPlus className="size-4" />}
              >
                {t("create")}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
