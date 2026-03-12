"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { FileSearch, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";
import { usePageTitle } from "@/hooks/use-page-title";
import { PageTransition } from "@/components/ui/motion";

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
  "login", "logout", "register",
  "create_student", "update_student", "delete_student",
  "record_biometrics", "record_tests", "submit_questionnaire",
  "trigger_sos", "resolve_sos", "export_report",
  "create_dispensa", "delete_dispensa",
  "add_guardian", "remove_guardian",
  "change_password", "update_consent",
] as const;

export default function AuditoriaPage() {
  const t = useTranslations("auditoria");
  usePageTitle(t("title"));
  const locale = useLocale();
  const { role } = useUser();

  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  function labelAction(action: string) {
    if (ACTION_KEYS.includes(action as (typeof ACTION_KEYS)[number])) {
      return t(`actions.${action}` as Parameters<typeof t>[0]);
    }
    return action;
  }

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/audit");
      if (!r.ok) throw new Error();
      setLogs(await r.json());
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (role === "ADMIN") loadLogs();
  }, [role, loadLogs]);

  if (role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">{t("noPermission")}</p>
      </div>
    );
  }

  return (
    <PageTransition className="flex flex-col gap-5">
      <PageHeader
        title={t("title")}
        description={t("description")}
      >
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
      </PageHeader>

      <div className="animate-fade-in-up bg-card/85 glass border border-border/50 shadow-float rounded-2xl overflow-hidden">
        {loading && (
          <div className="p-5 flex flex-col gap-3 animate-fade-in">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="py-10">
            <EmptyState
              icon={FileSearch}
              title={t("emptyTitle")}
              description={t("noLogs")}
            />
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-navy-50/50 dark:bg-navy-900/30">
                  <th className="text-left py-3 px-5 font-semibold text-muted-foreground whitespace-nowrap">{t("colDatetime")}</th>
                  <th className="text-left py-3 px-5 font-semibold text-muted-foreground">{t("colAction")}</th>
                  <th className="text-left py-3 px-5 font-semibold text-muted-foreground">{t("colUser")}</th>
                  <th className="text-left py-3 px-5 font-semibold text-muted-foreground">{t("colTarget")}</th>
                  <th className="text-left py-3 px-5 font-semibold text-muted-foreground">{t("colIp")}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-5 whitespace-nowrap text-muted-foreground text-xs font-medium">
                      {new Date(entry.createdAt).toLocaleString(locale, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-5 font-semibold text-foreground">{labelAction(entry.action)}</td>
                    <td className="py-3 px-5 text-muted-foreground">
                      {entry.userName ?? entry.userEmail ?? <span className="italic opacity-50">—</span>}
                    </td>
                    <td className="py-3 px-5 text-muted-foreground font-mono text-xs">
                      {entry.targetId ? (
                        <span className="bg-muted/80 rounded-md px-2 py-1 border border-border/50 shadow-inner">{entry.targetId.slice(0, 8)}…</span>
                      ) : (
                        <span className="opacity-50">—</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-muted-foreground text-xs font-mono font-medium">
                      {entry.ipAddress ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
