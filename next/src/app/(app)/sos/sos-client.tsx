"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  HeartHandshake,
  ListFilter,
  RefreshCw,
  Send,
  ShieldAlert,
  UserRound,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { FieldShell } from "@/components/ui/field-shell";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentIdentity } from "@/components/ui/student-identity";
import { PageHeader } from "@/components/ui/page-header";
import { useUser } from "@/components/user-context";
import { readApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type SosAlert = {
  id: string;
  resolved: boolean;
  createdAt: string;
  resolvedAt: string | null;
  student: {
    id: string;
    name: string;
    className: string | null;
    schoolYear: string | null;
  };
  psych: string;
  teacher: string;
  psychEmail: string | null;
  teacherEmail: string | null;
  resolvedBy: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStudentHref(role: string, studentId: string) {
  return role === "PSICOLOGO" ? `/acompanhamento/${studentId}` : `/alunos/${studentId}`;
}

function getStudentMeta(student: SosAlert["student"]) {
  return [student.className, student.schoolYear].filter(Boolean).join(" · ");
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SosClient() {
  const t = useTranslations("sos");
  const locale = useLocale();
  const { role } = useUser();
  const isStudent = role === "ALUNO";
  const isStaff = !isStudent;

  // Staff state
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "resolved">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());

  // Student state
  const [studentAlerts, setStudentAlerts] = useState<SosAlert[]>([]);
  const [studentLoading, setStudentLoading] = useState(true);
  const [studentLoadError, setStudentLoadError] = useState<string | null>(null);
  const [triggeringSos, setTriggeringSos] = useState(false);
  const [psych, setPsych] = useState("");
  const [teacher, setTeacher] = useState("");
  const [psychEmail, setPsychEmail] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");

  const formatDate = useCallback(
    (value: string | null) => {
      if (!value) return "—";
      return new Intl.DateTimeFormat(locale, {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }).format(new Date(value));
    },
    [locale],
  );

  // ── Data loading ───────────────────────────────────────────────────────────

  const fetchAlerts = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (!isStaff) return;
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setLoadError(null);
    try {
      const data = await readApiResponse<SosAlert[]>(await fetch("/api/stats/sos-alerts"));
      setAlerts(data);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("loadError");
      setLoadError(msg);
      toast.error(msg);
    } finally {
      if (mode === "initial") {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, [isStaff, t]);

  const fetchStudentAlerts = useCallback(async () => {
    setStudentLoading(true);
    setStudentLoadError(null);
    try {
      const data = await readApiResponse<SosAlert[]>(await fetch("/api/me/sos"));
      setStudentAlerts(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("loadError");
      setStudentAlerts([]);
      setStudentLoadError(msg);
      toast.error(msg);
    } finally {
      setStudentLoading(false);
    }
  }, [t]);

  useEffect(() => { void fetchAlerts("initial"); }, [fetchAlerts]);
  useEffect(() => { if (isStudent) void fetchStudentAlerts(); }, [fetchStudentAlerts, isStudent]);

  // ── Resolve ────────────────────────────────────────────────────────────────

  const resolveAlert = useCallback(async (alertId: string) => {
    setResolvingIds((cur) => new Set(cur).add(alertId));
    try {
      await readApiResponse<SosAlert>(await fetch(`/api/sos/${alertId}`, { method: "PATCH" }));
      toast.success(t("resolvedSuccess"));
      await fetchAlerts("refresh");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("resolveError"));
    } finally {
      setResolvingIds((cur) => { const n = new Set(cur); n.delete(alertId); return n; });
    }
  }, [fetchAlerts, t]);

  // ── Derived data ───────────────────────────────────────────────────────────

  const pendingAlerts = useMemo(
    () => alerts.filter((a) => !a.resolved).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [alerts],
  );
  const resolvedAlerts = useMemo(() => alerts.filter((a) => a.resolved), [alerts]);
  const visibleAlerts = useMemo(() => {
    if (statusFilter === "pending") return pendingAlerts;
    if (statusFilter === "resolved") return resolvedAlerts;
    return alerts;
  }, [alerts, pendingAlerts, resolvedAlerts, statusFilter]);

  const oldestPending = pendingAlerts[0] ?? null;
  const priorityAlerts = pendingAlerts.slice(1, 4);

  const hasOpenStudentAlert = studentAlerts.some((a) => !a.resolved);
  const activeStudentAlert = studentAlerts.find((a) => !a.resolved);

  // ── Student trigger ────────────────────────────────────────────────────────

  const triggerSos = useCallback(async () => {
    if (hasOpenStudentAlert) { toast.error(t("alreadyOpen")); return; }
    setTriggeringSos(true);
    try {
      const result = await fetch("/api/me/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          psych: psych.trim(), teacher: teacher.trim(),
          psychEmail: psychEmail.trim() || undefined,
          teacherEmail: teacherEmail.trim() || undefined,
        }),
      }).then((r) => readApiResponse<SosAlert>(r));
      toast.success(t("success"));
      setStudentAlerts((cur) => [result, ...cur]);
      setPsych(""); setTeacher(""); setPsychEmail(""); setTeacherEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("sendError"));
    } finally {
      setTriggeringSos(false);
    }
  }, [hasOpenStudentAlert, psych, psychEmail, t, teacher, teacherEmail]);

  // ── Table columns ──────────────────────────────────────────────────────────

  const columns = useMemo<Column<SosAlert>[]>(() => [
    {
      key: "student", header: t("studentLabel"),
      render: (a) => <StudentIdentity student={a.student} subtitle={getStudentMeta(a.student)} />,
      className: "min-w-[200px]",
    },
    {
      key: "psych", header: t("psychLabel"),
      render: (a) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{a.psych}</span>
          {a.psychEmail && <span className="text-xs text-muted-foreground">{a.psychEmail}</span>}
        </div>
      ),
    },
    {
      key: "teacher", header: t("teacherLabel"),
      render: (a) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{a.teacher}</span>
          {a.teacherEmail && <span className="text-xs text-muted-foreground">{a.teacherEmail}</span>}
        </div>
      ),
    },
    { key: "createdAt", header: t("createdAt"), render: (a) => <span className="text-sm">{formatDate(a.createdAt)}</span> },
    {
      key: "resolved", header: "Estado",
      render: (a) => <Badge variant={a.resolved ? "success" : "warning"}>{a.resolved ? t("resolved") : t("pending")}</Badge>,
    },
    {
      key: "resolvedBy", header: t("resolvedBy"),
      render: (a) => <span className="text-sm text-muted-foreground">{a.resolvedBy ? (a.resolvedBy.name ?? a.resolvedBy.email) : "—"}</span>,
    },
    {
      key: "actions", header: "",
      render: (a) => {
        const href = getStudentHref(role, a.student.id);
        return (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href={href} className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <ExternalLink className="size-4" />
              {t("openStudentProfile")}
            </Link>
            {!a.resolved ? (
              <Button variant="primary" size="sm" onClick={() => void resolveAlert(a.id)} loading={resolvingIds.has(a.id)} icon={<CheckCircle2 className="size-4" />}>
                {t("resolve")}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">{formatDate(a.resolvedAt)}</span>
            )}
          </div>
        );
      },
    },
  ], [formatDate, resolveAlert, resolvingIds, role, t]);

  // ─────────────────────────────────────────────────────────────────────────
  // STUDENT VIEW
  // ─────────────────────────────────────────────────────────────────────────

  if (isStudent) {
    return (
      <div className="flex flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <PageHeader
            eyebrow="S.O.S."
            title={t("title")}
            description={t("descriptionStudent")}
          />
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          {/* Panic button area */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}>
            <div className="relative overflow-hidden rounded-[24px] border border-danger-300/40 bg-danger-50/60 p-6 backdrop-blur-md shadow-[0_8px_32px_rgba(220,38,38,0.12)] dark:border-danger-500/25 dark:bg-danger-950/40">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-danger-400/60 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(220,38,38,0.06),transparent_50%)]" />

              <div className="relative mb-6 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-danger-100 dark:bg-danger-900/60">
                  <ShieldAlert className="size-5 text-danger-700 dark:text-danger-300" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-danger-600 dark:text-danger-400">
                    Pedido de apoio
                  </p>
                  <p className="font-display font-semibold text-foreground dark:text-white">
                    {t("contactTitle")}
                  </p>
                </div>
              </div>

              {activeStudentAlert && (
                <div className="mb-5 flex items-start gap-3 rounded-[24px] border border-warning-300/40 bg-warning-50/80 p-4 dark:border-warning-500/25 dark:bg-warning-950/40">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-600 dark:text-warning-300" />
                  <div>
                    <p className="text-sm font-semibold text-warning-900 dark:text-warning-100">{t("alreadyOpen")}</p>
                    <p className="mt-0.5 text-xs text-warning-700 dark:text-warning-300">{t("alreadyOpenHint")}</p>
                  </div>
                </div>
              )}

              <div className="relative grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldShell label={t("psych")}>
                    <Input value={psych} onChange={(e) => setPsych(e.target.value)} placeholder={t("psych")} disabled={studentLoading || triggeringSos || hasOpenStudentAlert} />
                  </FieldShell>
                  <FieldShell label={t("teacher")}>
                    <Input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder={t("teacher")} disabled={studentLoading || triggeringSos || hasOpenStudentAlert} />
                  </FieldShell>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldShell label={t("psychEmailLabel")} hint={t("emailOptional")}>
                    <Input type="email" value={psychEmail} onChange={(e) => setPsychEmail(e.target.value)} placeholder="nome@escola.pt" disabled={studentLoading || triggeringSos || hasOpenStudentAlert} />
                  </FieldShell>
                  <FieldShell label={t("teacherEmailLabel")} hint={t("emailOptional")}>
                    <Input type="email" value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} placeholder="nome@escola.pt" disabled={studentLoading || triggeringSos || hasOpenStudentAlert} />
                  </FieldShell>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <Button
                    onClick={() => void triggerSos()}
                    loading={triggeringSos}
                    disabled={studentLoading || hasOpenStudentAlert}
                    icon={<Send className="size-4" />}
                    className="h-12 w-full justify-center bg-danger-600 px-8 text-base text-white hover:bg-danger-700 sm:w-auto dark:bg-danger-700 dark:hover:bg-danger-600"
                  >
                    {hasOpenStudentAlert ? t("alreadyOpenButton") : t("trigger")}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* History sidebar */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.12 }}>
            <div className="relative overflow-hidden rounded-[24px] border border-white/20 bg-white/55 p-5 backdrop-blur-md shadow-[0_8px_32px_rgba(9,21,35,0.07)] dark:border-white/10 dark:bg-navy-950/60">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
              <div className="relative">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-600 dark:text-gold-300">{t("historyTitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground dark:text-white/60">{t("historyDescription")}</p>

                <div className="mt-4">
                  {studentLoading ? (
                    <div className="flex flex-col gap-3">
                      <Skeleton className="h-24 rounded-[24px]" />
                      <Skeleton className="h-24 rounded-[24px]" />
                    </div>
                  ) : studentLoadError ? (
                    <EmptyState icon={XCircle} title={t("loadError")} description={studentLoadError} />
                  ) : studentAlerts.length === 0 ? (
                    <EmptyState icon={HeartHandshake} title={t("noActiveTitle")} description={t("noHistoryDescription")} />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {studentAlerts.map((alert) => (
                        <StudentAlertCard key={alert.id} alert={alert} formatDate={formatDate} t={t} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STAFF VIEW — Loading
  // ─────────────────────────────────────────────────────────────────────────

  if (loading && alerts.length === 0 && !loadError) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-[100px] rounded-[24px]" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[100px] rounded-[24px]" />)}
        </div>
        <Skeleton className="h-[160px] rounded-[24px]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[160px] rounded-[24px]" />)}
        </div>
        <Skeleton className="h-[380px] rounded-[24px]" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STAFF VIEW — Load error
  // ─────────────────────────────────────────────────────────────────────────

  if (loadError && alerts.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="S.O.S." title={t("staffTitle")} description={t("staffDescription")} />
        <div className="rounded-[24px] border border-danger-300/40 bg-danger-50/60 p-6 dark:border-danger-500/20 dark:bg-danger-950/30">
          <EmptyState
            icon={XCircle}
            title={t("loadError")}
            description={loadError}
            action={
              <Button variant="outline" onClick={() => void fetchAlerts("refresh")} icon={<RefreshCw className="size-4" />}>
                {t("refresh")}
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STAFF VIEW — Main
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <PageHeader eyebrow="S.O.S." title={t("staffTitle")} description={t("staffDescription")}>
          <div className="flex items-center gap-3">
            {lastUpdatedAt && !refreshing && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {t("lastUpdated", { time: formatDate(lastUpdatedAt) })}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchAlerts("refresh")}
              loading={refreshing}
              disabled={refreshing}
              icon={<RefreshCw className="size-4" />}
            >
              {t("refresh")}
            </Button>
          </div>
        </PageHeader>
      </motion.div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="grid gap-4 sm:grid-cols-3"
      >
        <StaffStatCard
          label={t("totalAlerts")}
          value={String(alerts.length)}
          description={t("totalAlertsDescription")}
          accent="neutral"
        />
        <StaffStatCard
          label={t("pendingAlerts")}
          value={String(pendingAlerts.length)}
          description={t("pendingAlertsDescription")}
          accent={pendingAlerts.length > 0 ? "danger" : "neutral"}
        />
        <StaffStatCard
          label={t("resolvedAlerts")}
          value={String(resolvedAlerts.length)}
          description={t("resolvedAlertsDescription")}
          accent="success"
        />
      </motion.div>

      {/* Oldest pending — high-urgency focus card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        {oldestPending ? (
          <PriorityFocusCard
            alert={oldestPending}
            role={role}
            resolving={resolvingIds.has(oldestPending.id)}
            onResolve={() => void resolveAlert(oldestPending.id)}
            formatDate={formatDate}
            t={t}
          />
        ) : (
          <div className="flex items-center gap-4 rounded-[24px] border border-success-300/40 bg-success-50/60 p-5 shadow-sm dark:border-success-500/25 dark:bg-success-950/40">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/60">
              <CheckCircle2 className="size-5 text-success-700 dark:text-success-300" />
            </span>
            <div>
              <p className="font-semibold text-success-900 dark:text-success-100">{t("priorityEmptyTitle")}</p>
              <p className="mt-0.5 text-sm text-success-700 dark:text-success-300">{t("priorityEmptyDescription")}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Priority queue (2nd, 3rd, 4th oldest pending) */}
      {priorityAlerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.14 }}>
          <div className="relative overflow-hidden rounded-[24px] border border-white/20 bg-white/55 p-5 backdrop-blur-md shadow-[0_8px_32px_rgba(9,21,35,0.07)] dark:border-white/10 dark:bg-navy-950/60">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-warning-400/50 to-transparent" />
            <div className="relative">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-warning-600 dark:text-warning-300">
                {t("priorityEyebrow")}
              </p>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display font-semibold text-foreground dark:text-white">{t("priorityTitle")}</h2>
                <span className="rounded-full border border-warning-300/40 bg-warning-100/60 px-2.5 py-1 text-xs font-semibold text-warning-700 dark:border-warning-500/25 dark:bg-warning-950/40 dark:text-warning-300">
                  {priorityAlerts.length}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {priorityAlerts.map((alert) => (
                  <QueueAlertCard
                    key={alert.id}
                    alert={alert}
                    role={role}
                    onResolve={() => void resolveAlert(alert.id)}
                    resolving={resolvingIds.has(alert.id)}
                    formatDate={formatDate}
                    t={t}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Full alert log with filter + table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.18 }}>
        <div className="relative overflow-hidden rounded-[24px] border border-white/20 bg-white/55 p-5 backdrop-blur-md shadow-[0_8px_32px_rgba(9,21,35,0.07)] dark:border-white/10 dark:bg-navy-950/60">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
          <div className="relative">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-600 dark:text-gold-300">
                  {t("queueEyebrow")}
                </p>
                <h2 className="mt-1 font-display font-semibold text-foreground dark:text-white">{t("queueTitle")}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(["all", "pending", "resolved"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      statusFilter === f
                        ? "border-navy-700 bg-navy-700 text-white dark:border-navy-400 dark:bg-navy-800 dark:text-white"
                        : "border-border/60 bg-background/60 text-muted-foreground hover:border-border dark:border-white/10 dark:bg-white/6 dark:hover:border-white/20",
                    )}
                  >
                    {f === "all" && <ListFilter className="size-3" />}
                    {f === "pending" && <Clock3 className="size-3" />}
                    {f === "resolved" && <CheckCircle2 className="size-3" />}
                    {f === "all" ? t("filterAll") : f === "pending" ? t("pending") : t("resolved")}
                    {f === "pending" && pendingAlerts.length > 0 && (
                      <span className="ml-0.5 rounded-full bg-danger-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                        {pendingAlerts.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <DataTable
                columns={columns}
                data={visibleAlerts}
                pageSize={10}
                searchable
                toolbarTitle={t("filterLabel")}
                toolbarSummary={
                  <span>{t("visibleAlertsCount", { count: visibleAlerts.length })}</span>
                }
                emptyMessage={statusFilter === "all" ? t("emptyInboxDescription") : t("noFilteredDescription")}
                emptyStateIcon={ShieldAlert}
                rowKey={(a) => a.id}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StaffStatCard({
  label, value, description, accent,
}: {
  label: string; value: string; description: string; accent: "neutral" | "danger" | "success";
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-[24px] border p-5 shadow-sm",
      accent === "danger"
        ? "border-danger-300/40 bg-danger-50/60 dark:border-danger-500/25 dark:bg-danger-950/40"
        : accent === "success"
        ? "border-success-300/30 bg-success-50/40 dark:border-success-500/20 dark:bg-success-950/30"
        : "border-white/20 bg-white/55 backdrop-blur-md dark:border-white/10 dark:bg-navy-950/60",
    )}>
      {accent === "danger" && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-danger-400/50 to-transparent" />}
      {accent === "success" && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-success-400/40 to-transparent" />}
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
        <p className={cn(
          "mt-2 font-display text-4xl font-black leading-none tracking-[-0.05em] tabular-nums",
          accent === "danger" ? "text-danger-700 dark:text-danger-300"
            : accent === "success" ? "text-success-700 dark:text-success-300"
            : "text-foreground dark:text-white",
        )}>
          {value}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function PriorityFocusCard({
  alert, role, resolving, onResolve, formatDate, t,
}: {
  alert: SosAlert; role: string; resolving: boolean; onResolve: () => void;
  formatDate: (v: string | null) => string; t: ReturnType<typeof useTranslations>;
}) {
  const studentHref = getStudentHref(role, alert.student.id);

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-danger-300/50 bg-danger-50/60 p-5 shadow-[0_8px_32px_rgba(220,38,38,0.12)] backdrop-blur-md dark:border-danger-500/30 dark:bg-danger-950/50 sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-danger-400/70 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_5%_0%,rgba(220,38,38,0.08),transparent_45%)]" />

      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        {/* Left — student identity + timing */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-danger-300/50 bg-danger-100/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-danger-700 dark:border-danger-500/30 dark:bg-danger-950/60 dark:text-danger-300">
              <ShieldAlert className="size-3" />
              {t("oldestPendingLabel")}
            </span>
            <Badge variant="warning">{t("pending")}</Badge>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[24px] border border-danger-200/50 bg-danger-100/70 dark:border-danger-500/20 dark:bg-danger-900/50">
              <UserRound className="size-5 text-danger-700 dark:text-danger-300" />
            </span>
            <div>
              <p className="font-display text-lg font-bold leading-tight text-foreground dark:text-white">
                {alert.student.name}
              </p>
              <p className="text-sm text-muted-foreground dark:text-white/60">
                {getStudentMeta(alert.student)}
              </p>
            </div>
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger-700/80 dark:text-danger-300/80">
            <Clock3 className="size-3.5" />
            Alerta aberto em {formatDate(alert.createdAt)}
          </p>
        </div>

        {/* Centre — contacts */}
        <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[320px]">
          <div className="rounded-xl border border-danger-200/40 bg-white/60 px-5 py-3 dark:border-danger-500/15 dark:bg-navy-950/40">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("psychLabel")}</p>
            <p className="mt-1 text-sm font-semibold text-foreground dark:text-white truncate">{alert.psych}</p>
            {alert.psychEmail && <p className="mt-0.5 text-xs text-muted-foreground truncate">{alert.psychEmail}</p>}
          </div>
          <div className="rounded-xl border border-danger-200/40 bg-white/60 px-5 py-3 dark:border-danger-500/15 dark:bg-navy-950/40">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("teacherLabel")}</p>
            <p className="mt-1 text-sm font-semibold text-foreground dark:text-white truncate">{alert.teacher}</p>
            {alert.teacherEmail && <p className="mt-0.5 text-xs text-muted-foreground truncate">{alert.teacherEmail}</p>}
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex flex-wrap items-center gap-2 xl:justify-end xl:shrink-0">
          <Link
            href={studentHref}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "border-danger-200/60 dark:border-danger-500/20")}
          >
            <ExternalLink className="size-4" />
            {t("openStudentProfile")}
          </Link>
          <Button
            variant="primary"
            onClick={onResolve}
            loading={resolving}
            icon={<CheckCircle2 className="size-4" />}
            className="bg-danger-600 hover:bg-danger-700 dark:bg-danger-700 dark:hover:bg-danger-600"
          >
            {t("resolve")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function QueueAlertCard({
  alert, role, onResolve, resolving, formatDate, t,
}: {
  alert: SosAlert; role: string; onResolve: () => void; resolving: boolean;
  formatDate: (v: string | null) => string; t: ReturnType<typeof useTranslations>;
}) {
  const studentHref = getStudentHref(role, alert.student.id);

  return (
    <div className="rounded-[24px] border border-warning-300/40 bg-warning-50/50 p-4 shadow-sm dark:border-warning-500/20 dark:bg-warning-950/30">
      <div className="flex items-start justify-between gap-2">
        <StudentIdentity student={alert.student} subtitle={getStudentMeta(alert.student)} size="sm" />
        <Badge variant="warning" className="shrink-0">{t("pending")}</Badge>
      </div>

      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <Clock3 className="size-3 text-warning-600 dark:text-warning-400" />
        {formatDate(alert.createdAt)}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link href={studentHref} className={buttonVariants({ variant: "secondary", size: "sm" })}>
          <ExternalLink className="size-3.5" />
          {t("openStudentProfile")}
        </Link>
        <Button variant="primary" size="sm" onClick={onResolve} loading={resolving} icon={<CheckCircle2 className="size-4" />}>
          {t("resolve")}
        </Button>
      </div>
    </div>
  );
}

function StudentAlertCard({
  alert, formatDate, t,
}: {
  alert: SosAlert; formatDate: (v: string | null) => string;
  t: ReturnType<typeof useTranslations>;
}) {
  const resolved = alert.resolved;

  return (
    <div className={cn(
      "rounded-[24px] border p-4 shadow-sm",
      resolved
        ? "border-success-300/30 bg-success-50/40 dark:border-success-500/20 dark:bg-success-950/25"
        : "border-warning-300/40 bg-warning-50/50 dark:border-warning-500/20 dark:bg-warning-950/30",
    )}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{formatDate(alert.createdAt)}</p>
        <Badge variant={resolved ? "success" : "warning"}>
          {resolved ? t("resolved") : t("pending")}
        </Badge>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-white/70 px-5 py-3 dark:bg-navy-950/40">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("psychLabel")}</p>
          <p className="mt-1 text-sm font-medium text-foreground dark:text-white truncate">{alert.psych}</p>
          {alert.psychEmail && <p className="mt-0.5 text-xs text-muted-foreground truncate">{alert.psychEmail}</p>}
        </div>
        <div className="rounded-xl bg-white/70 px-5 py-3 dark:bg-navy-950/40">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("teacherLabel")}</p>
          <p className="mt-1 text-sm font-medium text-foreground dark:text-white truncate">{alert.teacher}</p>
          {alert.teacherEmail && <p className="mt-0.5 text-xs text-muted-foreground truncate">{alert.teacherEmail}</p>}
        </div>
      </div>

      {resolved && alert.resolvedAt && (
        <p className="mt-3 text-xs text-success-700 dark:text-success-300">
          {t("resolvedAt")}: {formatDate(alert.resolvedAt)}
        </p>
      )}
    </div>
  );
}
