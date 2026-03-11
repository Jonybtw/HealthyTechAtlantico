"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileSearch, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";

interface AuditEntry {
  id: string;
  action: string;
  targetId: string | null;
  ipAddress: string | null;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  login: "Início de sessão",
  logout: "Fim de sessão",
  register: "Registo",
  create_student: "Criar aluno",
  update_student: "Editar aluno",
  delete_student: "Remover aluno",
  record_biometrics: "Registar biometria",
  record_tests: "Registar testes",
  submit_questionnaire: "Submeter questionário",
  trigger_sos: "Alerta SOS",
  resolve_sos: "Resolver SOS",
  export_report: "Exportar relatório",
  create_dispensa: "Criar dispensa",
  delete_dispensa: "Remover dispensa",
  add_guardian: "Adicionar encarregado",
  remove_guardian: "Remover encarregado",
  change_password: "Alterar palavra-passe",
  update_consent: "Atualizar consentimento",
};

function labelAction(action: string) {
  return ACTION_LABELS[action] ?? action;
}

export default function AuditoriaPage() {
  const t = useTranslations("auditoria");
  const { role } = useUser();

  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

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
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t("title")}
        description={t("description")}
      >
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted"
          title={t("refresh")}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {t("refresh")}
        </button>
      </PageHeader>

      <div className="animate-fade-in-up bg-card/85 glass border border-border/50 shadow-float rounded-2xl overflow-hidden p-1">
        {loading && (
          <div className="p-4 flex flex-col gap-3 animate-fade-in">
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
              title="Grelha Vazia"
              description={t("noLogs")}
            />
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border/50 m-2">
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
                      {new Date(entry.createdAt).toLocaleString("pt-PT", {
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
    </div>
  );
}
