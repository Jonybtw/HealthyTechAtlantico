"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileSearch, RefreshCw, ShieldOff } from "lucide-react";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";
import { readApiResponse } from "@/lib/api-client";

interface AuditEntry {
  id: string;
  action: string;
  targetId: string | null;
  ipAddress: string | null;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
}

const ACTION_KEYS = [
  "login",
  "logout",
  "register",
  "create_student",
  "update_student",
  "delete_student",
  "record_biometrics",
  "record_tests",
  "submit_questionnaire",
  "trigger_sos",
  "resolve_sos",
  "export_report",
  "create_dispensa",
  "delete_dispensa",
  "add_guardian",
  "remove_guardian",
  "change_password",
  "update_consent",
] as const;

export default function AuditoriaPage() {
  const t = useTranslations("auditoria");
  const locale = useLocale();
  const { role } = useUser();

  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(role === "ADMIN");
  const [loadError, setLoadError] = useState<string | null>(null);

  function labelAction(action: string) {
    if (ACTION_KEYS.includes(action as (typeof ACTION_KEYS)[number])) {
      return t(`actions.${action}` as Parameters<typeof t>[0]);
    }
    return action;
  }

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/audit");
      setLogs(await readApiResponse<AuditEntry[]>(response));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("loadError");
      setLogs([]);
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (role === "ADMIN") {
      void loadLogs();
    }
  }, [role, loadLogs]);

  if (role !== "ADMIN") {
    return (
      <PageScaffold headerProps={{ title: t("title"), description: t("description") }}>
        <EmptyState
          icon={ShieldOff}
          title="Sem acesso à auditoria"
          description="A auditoria está disponível apenas para administradores."
        />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      headerProps={{
        title: t("title"),
        description: t("description"),
        meta: t("colAction"),
      }}
      headerActions={
        <Button
          size="sm"
          variant="ghost"
          icon={<RefreshCw size={14} />}
          loading={loading}
          onClick={loadLogs}
          aria-label={t("refresh")}
        >
          {t("refresh")}
        </Button>
      }
    >

      <PageSection tone="secondary" className="animate-fade-in-up" contentClassName="gap-0" layout="list">
        {loading ? (
          <div className="flex flex-col gap-3 p-5 animate-fade-in">
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
              title="Não foi possível carregar a auditoria"
              description="Tenta novamente para voltar a carregar os registos."
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<RefreshCw size={14} />}
                  loading={loading}
                  onClick={loadLogs}
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
              title={t("emptyTitle")}
              description={t("noLogs")}
            />
          </div>
        ) : null}

        {!loading && logs.length > 0 ? (
          <div className="surface-utility overflow-x-auto rounded-[20px] p-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-navy-50/50 dark:bg-navy-900/30">
                  <th className="whitespace-nowrap px-5 py-3 text-left font-semibold text-muted-foreground">{t("colDatetime")}</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">{t("colAction")}</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">{t("colUser")}</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">{t("colTarget")}</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">{t("colIp")}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50 transition-colors hover:bg-muted/50">
                    <td className="whitespace-nowrap px-5 py-3 text-xs font-medium text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString(locale, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3 font-semibold text-foreground">{labelAction(entry.action)}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {entry.userName ?? entry.userEmail ?? <span className="italic opacity-50">-</span>}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {entry.targetId ? (
                        <span className="rounded-md border border-border/50 bg-muted/80 px-2 py-1 shadow-inner">
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
        ) : null}
      </PageSection>
    </PageScaffold>
  );
}
