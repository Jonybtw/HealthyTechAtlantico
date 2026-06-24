"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Funnel,
  Search,
  Upload,
  UserPlus,
} from "lucide-react";
import { BulkImportModal } from "@/components/ui/bulk-import-modal";
import { toast } from "sonner";
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
import { useStudents, useStudentsList } from "@/hooks/use-queries";
import { cn } from "@/lib/utils";
import { createStudentAction } from "./actions";

const ALL_FILTER_VALUE = "__all__";

type Status = "healthy" | "attention" | "critical";

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

function getStatusFromZone(zone: string | null | undefined): Status | null {
  if (!zone) return null;
  const n = zone.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (n.includes("saudavel") || n.includes("healthy") || n.includes("zsaf")) return "healthy";
  if (n.includes("risco") || n.includes("critical") || n.includes("znrf")) return "critical";
  return "attention";
}

function StatusBadge({ status, t }: { status: Status | null; t: (key: string) => string }) {
  if (!status) return <span className="text-sm text-muted-foreground">-</span>;
  const styles: Record<Status, string> = {
    healthy: "bg-success-100 text-success-700",
    attention: "bg-warning-100 text-warning-700",
    critical: "bg-danger-100 text-danger-700",
  };
  const labelKeys: Record<Status, string> = {
    healthy: "statusHealthy",
    attention: "statusAttention",
    critical: "statusCritical",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", styles[status])}>
      {t(labelKeys[status])}
    </span>
  );
}

function StudentAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-gold-400/60 bg-navy-800 shadow-sm dark:bg-navy-700">
      <span className="text-xs font-semibold text-white">
        {initials}
      </span>
    </div>
  );
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

  const students = useMemo(() => studentsQuery.data?.students ?? [], [studentsQuery.data?.students]);
  const totalStudents = studentsQuery.data?.total ?? 0;
  const totalPages = studentsQuery.data?.pages ?? 1;

  const [showCreate, setShowCreate] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER_VALUE);
  const [form, setForm] = useState({
    name: "",
    sex: "M",
    birthDate: "",
    className: "",
    schoolYear: "",
    processNumber: "",
  });
  const [state, formAction, isPending] = useActionState(
    createStudentAction,
    null,
  );
  const lastHandledStateRef = useRef<typeof state>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleImportSuccess = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["students-list"] });
    await queryClient.invalidateQueries({ queryKey: ["students"] });
    router.refresh();
  }, [queryClient, router]);

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
          processNumber: "",
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
    searchQuery.trim() || classNameQuery || schoolYearQuery || statusFilter !== ALL_FILTER_VALUE,
  );
  const hasDirectoryStudents =
    (allStudentsQuery.data?.length ?? studentsQuery.data?.total ?? 0) > 0;

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
    setStatusFilter(ALL_FILTER_VALUE);
  };

  const handleSearch = (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      navigateWithParams((params) => {
        if (query) {
          params.set("search", query);
        } else {
          params.delete("search");
        }
        params.set("page", "1");
      });
    }, 300);
  };

  const displayedStudents = useMemo(() => {
    if (statusFilter === ALL_FILTER_VALUE) return students;
    return students.filter((s) => {
      const zone = s.biometrics?.[0]?.imcZone;
      const status = getStatusFromZone(zone);
      return status === statusFilter;
    });
  }, [students, statusFilter]);

  const emptyMessage = hasActiveFilters
    ? t("emptyFilteredMessage")
    : hasDirectoryStudents
      ? t("emptyMessage")
      : t("studentsEmptyDescription");

  const TABLE_HEADERS = [
    t("colName"),
    t("colProcessNumber"),
    t("colClass"),
    t("colBirth"),
    t("colBmi"),
    t("colStatus"),
    t("colLastTest"),
  ];

  return (
    <>
      <div className="page-stack gap-5">
        {/* Header */}
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-navy-950 dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-navy-700 dark:text-navy-200">
            {t("description")}
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-700/50 dark:text-navy-200/50" />
              <input
                type="text"
                placeholder={t("search")}
                defaultValue={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-10 w-full rounded-[8px] border border-navy-950/10 bg-white py-2.5 pl-10 pr-4 text-sm text-navy-950 placeholder:text-navy-700/40 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 dark:border-white/10 dark:bg-navy-950 dark:text-white dark:placeholder:text-navy-200/40"
              />
            </div>

            <div className="flex flex-wrap gap-2">
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
                <SelectTrigger className="flex h-10 w-full items-center gap-2 rounded-[8px] border border-navy-950/10 bg-white px-3 py-2.5 text-sm text-navy-950 hover:bg-muted/60 dark:border-white/10 dark:bg-navy-950 dark:text-white md:w-[160px]">
                  <Funnel className="size-4 text-navy-700 dark:text-navy-200" />
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
                <SelectTrigger className="flex h-10 w-full items-center gap-2 rounded-[8px] border border-navy-950/10 bg-white px-3 py-2.5 text-sm text-navy-950 hover:bg-muted/60 dark:border-white/10 dark:bg-navy-950 dark:text-white md:w-[180px]">
                  <Funnel className="size-4 text-navy-700 dark:text-navy-200" />
                  <SelectValue placeholder={t("filterSchoolYearLabel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>{t("filterSchoolYearAll")}</SelectItem>
                  {schoolYearOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex h-10 w-full items-center gap-2 rounded-[8px] border border-navy-950/10 bg-white px-3 py-2.5 text-sm text-navy-950 hover:bg-muted/60 dark:border-white/10 dark:bg-navy-950 dark:text-white md:w-[160px]">
                  <Activity className="size-4 text-navy-700 dark:text-navy-200" />
                  <SelectValue placeholder={t("filterStatusAll")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>{t("filterStatusAll")}</SelectItem>
                  <SelectItem value="healthy">{t("statusHealthy")}</SelectItem>
                  <SelectItem value="attention">{t("statusAttention")}</SelectItem>
                  <SelectItem value="critical">{t("statusCritical")}</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  {t("clearFilters")}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="gold"
              size="sm"
              icon={<Upload className="size-4" />}
              onClick={() => setShowBulkImport(true)}
            >
              {t("bulkImportBtn")}
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
        </div>

        {/* Table */}
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
              <Button type="button" variant="secondary" onClick={() => void studentsQuery.refetch()}>
                {common("refresh")}
              </Button>
            }
          />
        ) : studentsQuery.isLoading && !studentsQuery.data ? (
          <div className="overflow-hidden rounded-[12px] border border-border bg-card/88 shadow-[0_4px_12px_rgba(9,21,35,0.08)] dark:border-white/10 dark:bg-navy-950/68 dark:shadow-[0_4px_18px_rgba(0,0,0,0.22)]">
            <div className="space-y-4 p-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-full rounded-[8px]" />
                  <Skeleton className="h-8 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[12px] border border-border bg-card/88 shadow-[0_4px_12px_rgba(9,21,35,0.08)] dark:border-white/10 dark:bg-navy-950/68 dark:shadow-[0_4px_18px_rgba(0,0,0,0.22)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-navy-950/5 dark:border-white/5">
                    {TABLE_HEADERS.map((header) => (
                      <th
                        key={header}
                        className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-navy-700 dark:text-navy-200"
                      >
                        {header}
                      </th>
                    ))}
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {displayedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-sm text-navy-700 dark:text-navy-200">
                        {emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    displayedStudents.map((student) => {
                      const latestBio = student.biometrics?.[0];
                      const latestTest = student.tests?.[0];
                      const status = getStatusFromZone(latestBio?.imcZone);
                      return (
                        <tr
                          key={student.id}
                          onClick={() => router.push(`/alunos/${student.id}`)}
                          className="group cursor-pointer border-b border-navy-950/5 transition-colors hover:bg-muted dark:border-white/5"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <StudentAvatar name={student.name} />
                              <span className="text-sm font-medium text-navy-950 dark:text-white">
                                {student.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm font-mono text-navy-700 dark:text-navy-200">
                            #{student.processNumber ?? student.id.slice(-4)}
                          </td>
                          <td className="px-5 py-4 text-sm text-navy-950 dark:text-white">
                            {student.className ?? "-"}
                          </td>
                          <td className="px-5 py-4 text-sm text-navy-700 dark:text-navy-200">
                            {student.birthDate
                              ? new Date(student.birthDate).toLocaleDateString(locale)
                              : student.age ?? "-"}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold tabular-nums text-navy-950 dark:text-white">
                            {latestBio ? Number(latestBio.imc).toFixed(1) : "-"}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={status} t={t} />
                          </td>
                          <td className="px-5 py-4 text-sm text-navy-700 dark:text-navy-200">
                            {latestTest
                              ? new Date(latestTest.recordedAt).toLocaleDateString(locale, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "-"}
                          </td>
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-[6px] p-1.5 opacity-0 transition-all hover:bg-muted group-hover:opacity-100"
                            >
                              <Ellipsis className="size-4 text-navy-700 dark:text-navy-200" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-navy-950/5 px-5 py-3 dark:border-white/5">
                <span className="text-xs text-navy-700 dark:text-navy-200">
                  {t("directoryFilteredSummary", { count: totalStudents })}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() =>
                      navigateWithParams(
                        (params) => {
                          params.set("page", String(currentPage - 1));
                        },
                        "push",
                      )
                    }
                    className="rounded-[6px] p-1.5 text-navy-700 transition-colors hover:bg-muted disabled:opacity-40 dark:text-navy-200"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-xs font-medium text-navy-950 dark:text-white">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      navigateWithParams(
                        (params) => {
                          params.set("page", String(currentPage + 1));
                        },
                        "push",
                      )
                    }
                    className="rounded-[6px] p-1.5 text-navy-700 transition-colors hover:bg-muted disabled:opacity-40 dark:text-navy-200"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BulkImportModal
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onSuccess={() => void handleImportSuccess()}
      />

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
                <p className="label-micro text-muted-foreground">
                  {t("colSex")}
                </p>
                <PillSelect
                  options={[
                    {
                      value: "M",
                      label: t("male"),
                      icon: <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="5"/><path d="M12 13v9m0 0-3-3m3 3 3-3"/></svg>,
                    },
                    {
                      value: "F",
                      label: t("female"),
                      icon: <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="5"/><path d="M12 13v9m-3-3h6"/></svg>,
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

              <Input
                name="processNumber"
                label={t("colProcessNumber")}
                value={form.processNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    processNumber: event.target.value,
                  }))
                }
                placeholder={t("processNumberPlaceholder")}
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
