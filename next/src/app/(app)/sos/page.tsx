"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface SosAlert {
  id: string;
  psych: string;
  teacher: string;
  psychEmail: string | null;
  teacherEmail: string | null;
  resolved: boolean;
  createdAt: string;
  student: { name: string };
}

export default function SosPage() {
  const t = useTranslations("sos");
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown>)?.role as string;

  /* ── Aluno: trigger SOS ── */
  const [psych, setPsych] = useState("");
  const [teacher, setTeacher] = useState("");
  const [sending, setSending] = useState(false);

  /* ── Staff: alert list ── */
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const loadAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch("/api/stats/sos-alerts");
      if (res.ok) {
        const body = await res.json();
        setAlerts(Array.isArray(body) ? body : (body.alerts ?? []));
      }
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  useEffect(() => {
    if (role !== "ALUNO") loadAlerts();
  }, [role, loadAlerts]);

  /* ── Aluno: send SOS ── */
  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      // get own student ID first
      const studentsRes = await fetch("/api/students?limit=1");
      const studentsBody = await studentsRes.json();
      const studentId = studentsBody.students?.[0]?.id;
      if (!studentId) {
        toast.error("Perfil de aluno não encontrado.");
        return;
      }

      const res = await fetch(`/api/students/${studentId}/sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ psych, teacher }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Erro ao enviar alerta.");
        return;
      }

      toast.success(t("success"));
      setPsych("");
      setTeacher("");
    } catch {
      toast.error("Erro de ligação.");
    } finally {
      setSending(false);
    }
  };

  /* ── Staff: resolve ── */
  const handleResolve = async (alertId: string) => {
    try {
      const res = await fetch(`/api/sos/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: true }),
      });
      if (res.ok) {
        toast.success(t("resolve"));
        loadAlerts();
      }
    } catch {
      toast.error(t("noAlerts"));
    }
  };

  /* ── ALUNO view ── */
  if (role === "ALUNO") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={t("title")}
          description={t("descriptionStudent")}
        />

        <form
          onSubmit={handleTrigger}
          className="animate-fade-in-up bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-6 flex flex-col gap-5 max-w-lg"
        >
          <div className="flex flex-col gap-1.5 focus-within:text-gold-600 transition-colors">
            <label className="text-sm font-medium">{t("psychLabel")}</label>
            <input
              value={psych}
              onChange={(e) => setPsych(e.target.value)}
              placeholder={t("psych")}
              required
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm bg-background/50 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:bg-background transition-all shadow-inner inset-shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5 focus-within:text-gold-600 transition-colors">
            <label className="text-sm font-medium">{t("teacherLabel")}</label>
            <input
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder={t("teacher")}
              required
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm bg-background/50 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:bg-background transition-all shadow-inner inset-shadow-sm"
            />
          </div>

          <Button
            type="submit"
            loading={sending}
            variant="danger"
            icon={<AlertTriangle className="size-4" />}
            className="self-start"
          >
            {t("trigger")}
          </Button>
        </form>
      </div>
    );
  }

  /* ── Staff view ── */
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("staffTitle")}
        description={t("staffDescription")}
      />

      {loadingAlerts ? (
        <p className="text-sm text-muted-foreground animate-pulse">{t("sending")}</p>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Sem Alertas Pendentes"
          description="A caixa de entrada de alertas de emergência (SOS) encontra-se totalmente limpa. Não existem casos ativos para verificação."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((a, i) => (
            <div
              key={a.id}
              className={`bg-card/85 glass rounded-2xl border p-5 flex items-start justify-between gap-4 transition-all duration-300 hover:shadow-float animate-fade-in-up
                ${a.resolved ? "border-border/40 opacity-50" : "border-danger-300 dark:border-danger-800/40 hover:-translate-y-1"}
              `}
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
            >
              <div className="flex flex-col gap-1">
                <span className="font-semibold">{a.student.name}</span>
                <p className="text-sm text-muted-foreground">
                  {t("psychLabel")}: {a.psych} · {t("teacherLabel")}: {a.teacher}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>{new Date(a.createdAt).toLocaleString("pt-PT")}</span>
                </div>
              </div>

              {!a.resolved && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<CheckCircle className="size-4" />}
                  onClick={() => handleResolve(a.id)}
                >
                  {t("resolve")}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
