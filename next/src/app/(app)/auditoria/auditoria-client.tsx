"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileSearch, Filter, RefreshCw, ShieldOff } from "lucide-react";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/components/user-context";
import { readApiResponse } from "@/lib/api-client";
import {
  AUDIT_ACTION_VALUES,
  type AuditAction,
  type AuditLogListItem,
  type AuditLogListResponse,
  isAuditAction,
} from "@/lib/audit-actions";

const PAGE_SIZE = 25;

function toIsoStart(date: string) {
  if (!date) {
    return null;
  }

  return new Date(`${date}T00:00:00`).toISOString();
}

function toIsoEnd(date: string) {
  if (!date) {
    return null;
  }

  return new Date(`${date}T23:59:59.999`).toISOString();
}

export default function AuditoriaPage() {
  const t = useTranslations("auditoria");
  const locale = useLocale();
  const { role } = useUser();
  const [logs, setLogs] = useState<AuditLogListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [action, setAction] = useState<AuditAction | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(role === "ADMIN");
  const [loadError, setLoadError] = useState<string | null>(null);

  const filterActive =
    action !== "all" || Boolean(startDate) || Boolean(endDate);

  const actionOptions = useMemo(
    () =>
      AUDIT_ACTION_VALUES.map((value) => ({
        value,
        label: t(`actions.${value}`),
      })),
    [t],
  );

  const labelAction = useCallback(
    (value: string) => {
      if (isAuditAction(value)) {
        return t(`actions.${value}`);
      }

      return value;
    },
    [t],
  );

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (action !== "all") {
        params.set("action", action);
      }

      const isoStartDate = toIsoStart(startDate);
      const isoEndDate = toIsoEnd(endDate);

      if (isoStartDate) {
        params.set("startDate", isoStartDate);
      }

      if (isoEndDate) {
        params.set("endDate", isoEndDate);
      }

      const response = await fetch(`/api/audit?${params.toString()}`);
      const payload = await readApiResponse<AuditLogListResponse>(response);
      setLogs(payload.logs);
      setTotal(payload.total);
      setPages(payload.pages);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("loadError");
      setLogs([]);
      setTotal(0);
      setPages(1);
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [action, endDate, page, startDate, t]);

  useEffect(() => {
    if (role === "ADMIN") {
      const timer = window.setTimeout(() => {
        void loadLogs();
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [role, loadLogs]);

  function resetFilters() {
    setAction("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  function applyActionFilter(value: string) {
    setAction(value === "all" ? "all" : (value as AuditAction));
    setPage(1);
  }

  function applyStartDate(value: string) {
    setStartDate(value);
    setPage(1);
  }

  function applyEndDate(value: string) {
    setEndDate(value);
    setPage(1);
  }

  if (role !== "ADMIN") {
    return (
      <PageScaffold
        headerProps={{
          title: t("title"),
          description: t("description"),
          eyebrow: "SISTEMA · AUDITORIA",
        }}
      >
        <EmptyState
          icon={ShieldOff}
          title={t("blockedTitle")}
          description={t("blockedDescription")}
        />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      headerProps={{
        title: t("title"),
        description: t("description"),
        eyebrow: "SISTEMA · AUDITORIA",
        meta: t("totalLogs", { count: total }),
      }}
      headerActions={
        <Button
          size="sm"
          variant="ghost"
          icon={<RefreshCw size={14} />}
          loading={loading}
          onClick={() => void loadLogs()}
          aria-label={t("refresh")}
        >
          {t("refresh")}
        </Button>
      }
    >
      <PageSection
        tone="secondary"
        className="animate-fade-in-up"
        contentClassName="gap-4"
        layout="list"
        title={t("filtersTitle")}
        description={t("filtersDescription")}
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-tight text-foreground">
              {t("filterAction")}
            </label>
            <Select value={action} onValueChange={applyActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t("allActions")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allActions")}</SelectItem>
                {actionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            type="date"
            label={t("filterStartDate")}
            value={startDate}
            onChange={(event) => applyStartDate(event.target.value)}
          />

          <Input
            type="date"
            label={t("filterEndDate")}
            value={endDate}
            onChange={(event) => applyEndDate(event.target.value)}
          />

          <div className="flex items-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Filter className="size-4" />}
              onClick={() => {
                setPage(1);
                void loadLogs();
              }}
            >
              {t("applyFilters")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              disabled={!filterActive}
            >
              {t("clearFilters")}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : null}

        {!loading && loadError ? (
          <div className="py-4">
            <EmptyState
              icon={FileSearch}
              title={t("loadFailedTitle")}
              description={t("loadFailedDescription")}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<RefreshCw size={14} />}
                  loading={loading}
                  onClick={() => void loadLogs()}
                >
                  {t("refresh")}
                </Button>
              }
            />
          </div>
        ) : !loading && logs.length === 0 ? (
          <div className="py-4">
            <EmptyState
              icon={FileSearch}
              title={filterActive ? t("emptyFilteredTitle") : t("emptyTitle")}
              description={
                filterActive ? t("emptyFilteredDescription") : t("noLogs")
              }
            />
          </div>
        ) : null}

        {!loading && logs.length > 0 ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <p>{t("pageSummary", { page, pages, total })}</p>
              <p>{t("showingCount", { count: logs.length })}</p>
            </div>

            <div className="surface-utility overflow-x-auto rounded-2xl p-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20 dark:border-white/10 bg-navy-50/50 dark:bg-navy-900/30">
                    <th className="whitespace-nowrap px-5 py-3 text-left font-semibold text-muted-foreground">
                      {t("colDatetime")}
                    </th>
                    <th className="px-5 py-3 text-left font-semibold text-muted-foreground">
                      {t("colAction")}
                    </th>
                    <th className="px-5 py-3 text-left font-semibold text-muted-foreground">
                      {t("colUser")}
                    </th>
                    <th className="px-5 py-3 text-left font-semibold text-muted-foreground">
                      {t("colTarget")}
                    </th>
                    <th className="px-5 py-3 text-left font-semibold text-muted-foreground">
                      {t("colIp")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-white/20 dark:border-white/10 transition-colors hover:bg-navy-50/50 dark:bg-navy-900/30 ring-1 ring-white/10"
                    >
                      <td className="whitespace-nowrap px-5 py-3 text-xs font-medium text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString(locale, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3 font-semibold text-foreground">
                        {labelAction(entry.action)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {entry.userName ?? entry.userEmail ?? (
                          <span className="italic opacity-50">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        {entry.targetId ? (
                          <span
                            className="rounded-md border border-white/20 dark:border-white/10 bg-muted/80 px-2 py-1 shadow-inner"
                            title={entry.targetId}
                          >
                            {entry.targetId.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="opacity-50">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs font-medium text-muted-foreground">
                        {entry.ipAddress ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
              >
                {t("previousPage")}
              </Button>
              <p className="text-sm text-muted-foreground">
                {t("pageSummary", { page, pages, total })}
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setPage((current) => Math.min(pages, current + 1))
                }
                disabled={page >= pages}
              >
                {t("nextPage")}
              </Button>
            </div>
          </>
        ) : null}
      </PageSection>
    </PageScaffold>
  );
}
