"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

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

      toast.success("Alerta SOS enviado. A equipa foi notificada.");
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
        toast.success("Alerta resolvido.");
        loadAlerts();
      }
    } catch {
      toast.error("Erro ao resolver alerta.");
    }
  };

  /* ── ALUNO view ── */
  if (role === "ALUNO") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="SOS"
          description="Envia um alerta confidencial à equipa de apoio"
        />

        <form
          onSubmit={handleTrigger}
          className="bg-card rounded-xl border border-border p-6 flex flex-col gap-5 max-w-lg"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Psicólogo</label>
            <input
              value={psych}
              onChange={(e) => setPsych(e.target.value)}
              placeholder="Nome do psicólogo…"
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-gold-500/40"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Professor</label>
            <input
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="Nome do professor…"
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-gold-500/40"
            />
          </div>

          <Button
            type="submit"
            loading={sending}
            variant="danger"
            icon={<AlertTriangle className="size-4" />}
            className="self-start"
          >
            Enviar alerta SOS
          </Button>
        </form>
      </div>
    );
  }

  /* ── Staff view ── */
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Alertas SOS"
        description="Alertas de bem-estar dos alunos"
      />

      {loadingAlerts ? (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      ) : alerts.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground">
          Sem alertas pendentes.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`bg-card rounded-xl border p-4 flex items-start justify-between gap-4 ${
                a.resolved ? "border-border opacity-60" : "border-danger-300"
              }`}
            >
              <div className="flex flex-col gap-1">
                <span className="font-semibold">{a.student.name}</span>
                <p className="text-sm text-muted-foreground">
                  Psicólogo: {a.psych} · Professor: {a.teacher}
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
                  Resolver
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
