"use client";

// Componente cliente de /sos: permite criar alertas, consultar listas e marcar
// pedidos como resolvidos conforme o perfil autenticado.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";
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
import { PageScaffold } from "@/components/ui/page-scaffold";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentIdentity } from "@/components/ui/student-identity";
import { useUser } from "@/components/user-context";
import { readApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useReducedEffects } from "@/hooks/use-reduced-effects";

// ─── Types ────────────────────────────────────────────────────────────────────

type SosAlert = {
  id: string;
  resolved: boolean;
  createdAt: string;
  resolvedAt: string | null;
  student: { id: string; name: string; className: string | null; schoolYear: string | null };
  psych: string;
  teacher: string;
  psychEmail: string | null;
  teacherEmail: string | null;
  resolvedBy: { id: string; name: string | null; email: string; role: string } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStudentHref(role: string, studentId: string) {
  return role === "PSICOLOGO" ? `/acompanhamento/${studentId}` : `/alunos/${studentId}`;
}

function getStudentMeta(s: SosAlert["student"]) {
  return [s.className, s.schoolYear].filter(Boolean).join(" · ");
}

function sectionAnimation(index: number, reducedEffects: boolean) {
  if (reducedEffects) return {};
  return { animationDelay: `${index * 70}ms` };
}

function useAnimatedNumber(target: number, disabled: boolean) {
  const [display, setDisplay] = useState(target);
  const previous = useRef(target);
  useEffect(() => {
    if (disabled) { previous.current = target; return; }
    if (previous.current === target) return;
    let frame = 0;
    const start = performance.now();
    const from = previous.current;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 620, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    previous.current = target;
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [disabled, target]);
  return disabled ? target : display;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SosClient() {
  const t = useTranslations("sos");
  const locale = useLocale();
  const { role } = useUser();
  const reducedEffects = useReducedEffects();
  const isStudent = role === "ALUNO";
  const isStaff = !isStudent;

  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "resolved">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());

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
      return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
    },
    [locale],
  );

  const fetchAlerts = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (!isStaff) return;
    if (mode === "initial") setLoading(true); else setRefreshing(true);
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
      if (mode === "initial") setLoading(false); else setRefreshing(false);
    }
  }, [isStaff, t]);

  const fetchStudentAlerts = useCallback(async () => {
    setStudentLoading(true);
    setStudentLoadError(null);
    try {
      setStudentAlerts(await readApiResponse<SosAlert[]>(await fetch("/api/me/sos")));
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

  const animatedTotal = useAnimatedNumber(alerts.length, reducedEffects);
  const animatedPending = useAnimatedNumber(pendingAlerts.length, reducedEffects);
  const animatedResolved = useAnimatedNumber(resolvedAlerts.length, reducedEffects);

  const triggerSos = useCallback(async () => {
    if (hasOpenStudentAlert) { toast.error(t("alreadyOpen")); return; }
    setTriggeringSos(true);
    try {
      const result = await fetch("/api/me/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ psych: psych.trim(), teacher: teacher.trim(), psychEmail: psychEmail.trim() || undefined, teacherEmail: teacherEmail.trim() || undefined }),
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

  const columns = useMemo<Column<SosAlert>[]>(() => [
    { key: "student", header: t("studentLabel"), render: (a) => <StudentIdentity student={a.student} subtitle={getStudentMeta(a.student)} />, className: "min-w-[170px]" },
    { key: "psych", header: t("psychLabel"), render: (a) => <div className="min-w-0 max-w-[180px]"><p className="truncate text-sm font-semibold">{a.psych}</p>{a.psychEmail && <p className="truncate text-xs text-muted-foreground">{a.psychEmail}</p>}</div>, className: "min-w-[180px]" },
    { key: "teacher", header: t("teacherLabel"), render: (a) => <div className="min-w-0 max-w-[180px]"><p className="truncate text-sm font-semibold">{a.teacher}</p>{a.teacherEmail && <p className="truncate text-xs text-muted-foreground">{a.teacherEmail}</p>}</div>, className: "min-w-[180px]" },
    { key: "createdAt", header: t("createdAt"), render: (a) => <span className="block max-w-[140px] text-sm leading-snug">{formatDate(a.createdAt)}</span>, className: "min-w-[140px]" },
    { key: "resolved", header: t("statusHeader"), render: (a) => <Badge variant={a.resolved ? "success" : "warning"}>{a.resolved ? t("resolved") : t("pending")}</Badge>, className: "min-w-[92px]" },
    { key: "resolvedBy", header: t("resolvedBy"), render: (a) => <span className="text-sm text-muted-foreground">{a.resolvedBy ? (a.resolvedBy.name ?? a.resolvedBy.email) : "—"}</span> },
    {
      key: "actions", header: "",
      render: (a) => (
        <div className="flex min-w-[220px] flex-wrap items-center justify-end gap-2">
          <Link href={getStudentHref(role, a.student.id)} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <ExternalLink className="size-3.5" />{t("openStudentProfile")}
          </Link>
          {!a.resolved
            ? <Button variant="primary" size="sm" onClick={() => void resolveAlert(a.id)} loading={resolvingIds.has(a.id)} icon={<CheckCircle2 className="size-3.5" />}>{t("resolve")}</Button>
            : <span className="text-xs text-muted-foreground">{formatDate(a.resolvedAt)}</span>
          }
        </div>
      ),
      className: "min-w-[220px]",
    },
  ], [formatDate, resolveAlert, resolvingIds, role, t]);

  // ── STUDENT VIEW ────────────────────────────────────────────────────────────

  if (isStudent) {
    return (
      <PageScaffold className="gap-5" headerProps={{ title: t("title"), description: t("descriptionStudent") }}>
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
          <SosPanel index={0} reducedEffects={reducedEffects} className="p-5 sm:p-6">
            <div className="mb-4 flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-[12px] border border-border/60 bg-danger-500/10 text-danger-600 dark:text-danger-400 shadow-sm">
                <Send className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pedido de apoio</p>
                <p className="text-sm font-semibold leading-snug text-foreground">{t("contactTitle")}</p>
              </div>
            </div>

            {activeStudentAlert && (
              <div className="mb-4 flex min-w-0 items-start gap-3 rounded-[12px] border border-warning-300/40 bg-warning-50/80 px-4 py-3 dark:border-warning-500/25 dark:bg-warning-950/40">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-600 dark:text-warning-300" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-warning-900 dark:text-warning-100">{t("alreadyOpen")}</p>
                  <p className="mt-0.5 text-xs text-warning-700 dark:text-warning-300">{t("alreadyOpenHint")}</p>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label={t("psych")}
                  value={psych}
                  onChange={(e) => setPsych(e.target.value)}
                  disabled={studentLoading || triggeringSos || hasOpenStudentAlert}
                />
                <Input
                  label={t("teacher")}
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  disabled={studentLoading || triggeringSos || hasOpenStudentAlert}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="email"
                  label={t("psychEmailLabel")}
                  hint={t("emailOptional")}
                  value={psychEmail}
                  onChange={(e) => setPsychEmail(e.target.value)}
                  disabled={studentLoading || triggeringSos || hasOpenStudentAlert}
                />
                <Input
                  type="email"
                  label={t("teacherEmailLabel")}
                  hint={t("emailOptional")}
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  disabled={studentLoading || triggeringSos || hasOpenStudentAlert}
                />
              </div>
              <div className="flex items-center justify-end pt-1">
                <Button
                  variant="danger"
                  size="lg"
                  onClick={() => void triggerSos()}
                  loading={triggeringSos}
                  disabled={studentLoading || hasOpenStudentAlert}
                  icon={<Send className="size-4" />}
                  className="w-full justify-center sm:w-auto"
                >
                  {hasOpenStudentAlert ? t("alreadyOpenButton") : t("trigger")}
                </Button>
              </div>
            </div>
          </SosPanel>

          <SosPanel index={1} reducedEffects={reducedEffects} className="p-5">
            <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("historyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("historyDescription")}</p>
            <div className="mt-4 grid gap-2.5">
              {studentLoading ? (
                <><Skeleton className="h-20 rounded-[12px]" /><Skeleton className="h-20 rounded-[12px]" /></>
              ) : studentLoadError ? (
                <InlineFocusEmpty icon={XCircle}>{studentLoadError}</InlineFocusEmpty>
              ) : studentAlerts.length === 0 ? (
                <InlineFocusEmpty icon={HeartHandshake}>{t("noHistoryDescription")}</InlineFocusEmpty>
              ) : (
                studentAlerts.map((alert) => <StudentAlertRow key={alert.id} alert={alert} formatDate={formatDate} t={t} />)
              )}
            </div>
          </SosPanel>
        </div>
      </PageScaffold>
    );
  }

  // ── STAFF LOADING ───────────────────────────────────────────────────────────

  if (loading && alerts.length === 0 && !loadError) {
    return (
      <div className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[120px] rounded-[12px]" />)}
        </div>
        <Skeleton className="h-[100px] rounded-[12px]" />
        <Skeleton className="h-[420px] rounded-[12px]" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-[180px] rounded-[12px]" />
          <Skeleton className="h-[160px] rounded-[12px]" />
        </div>
      </div>
    );
  }

  // ── STAFF ERROR ─────────────────────────────────────────────────────────────

  if (loadError && alerts.length === 0) {
    return (
      <PageScaffold className="gap-5" headerProps={{ title: t("staffTitle"), description: t("staffDescription") }}>
        <SosPanel index={0} reducedEffects={reducedEffects} className="p-5">
          <EmptyState icon={XCircle} title={t("loadError")} description={loadError}
            action={<Button variant="outline" onClick={() => void fetchAlerts("refresh")} icon={<RefreshCw className="size-4" />}>{t("refresh")}</Button>}
          />
        </SosPanel>
      </PageScaffold>
    );
  }

  // ── STAFF MAIN ──────────────────────────────────────────────────────────────

  return (
    <PageScaffold
      className="gap-5"
      headerProps={{ title: t("staffTitle"), description: t("staffDescription") }}
      headerActions={
        <div className="flex items-center gap-3">
          {lastUpdatedAt && !refreshing && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {t("lastUpdated", { time: formatDate(lastUpdatedAt) })}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => void fetchAlerts("refresh")} loading={refreshing} disabled={refreshing} icon={<RefreshCw className="size-4" />}>
            {t("refresh")}
          </Button>
        </div>
      }
    >
      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiPanel index={0} reducedEffects={reducedEffects}
          icon={<ShieldAlert className="size-[18px]" />}
          iconClass="bg-navy-100 text-navy-700 dark:bg-white/8 dark:text-navy-100"
          label={t("totalAlerts")} value={String(animatedTotal)}
          footer={t("totalAlertsDescription")} footerIcon={<ShieldAlert className="size-3 shrink-0" />}
        />
        <KpiPanel index={1} reducedEffects={reducedEffects}
          icon={<AlertTriangle className="size-[18px]" />}
          iconClass={pendingAlerts.length > 0 ? "bg-danger-100 text-danger-700 dark:bg-danger-300/12 dark:text-danger-300" : "bg-navy-100 text-navy-700 dark:bg-white/8 dark:text-navy-100"}
          label={t("pendingAlerts")} value={String(animatedPending)}
          footer={t("pendingAlertsDescription")} footerIcon={<Clock3 className="size-3 shrink-0" />}
        />
        <KpiPanel index={2} reducedEffects={reducedEffects}
          icon={<CheckCircle2 className="size-[18px]" />}
          iconClass="bg-success-100 text-success-700 dark:bg-success-300/12 dark:text-success-200"
          label={t("resolvedAlerts")} value={String(animatedResolved)}
          footer={t("resolvedAlertsDescription")} footerIcon={<CheckCircle2 className="size-3 shrink-0" />}
        />
      </div>

      {/* Priority Focus */}
      <SosPanel index={3} reducedEffects={reducedEffects} className="p-5 sm:p-6">
        {oldestPending ? (
          <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)_auto] 2xl:items-center">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-danger-300/50 bg-danger-100/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-danger-700 dark:border-danger-500/30 dark:bg-danger-950/60 dark:text-danger-300">
                  <ShieldAlert className="size-3" />{t("oldestPendingLabel")}
                </span>
                <Badge variant="warning">{t("pending")}</Badge>
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-danger-200/50 bg-danger-100/70 dark:border-danger-500/20 dark:bg-danger-900/50">
                  <UserRound className="size-5 text-danger-700 dark:text-danger-300" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-black tracking-tight text-foreground">{oldestPending.student.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{getStudentMeta(oldestPending.student)}</p>
                </div>
              </div>
              <p className="mt-2 flex min-w-0 items-center gap-1.5 text-xs leading-snug text-danger-700/80 dark:text-danger-300/80">
                <Clock3 className="size-3.5" />Alerta aberto em {formatDate(oldestPending.createdAt)}
              </p>
            </div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
              <MetaRow label={t("psychLabel")} value={oldestPending.psych} sub={oldestPending.psychEmail ?? undefined} />
              <MetaRow label={t("teacherLabel")} value={oldestPending.teacher} sub={oldestPending.teacherEmail ?? undefined} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center 2xl:shrink-0 2xl:justify-end">
              <Link href={getStudentHref(role, oldestPending.student.id)} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                <ExternalLink className="size-4" />{t("openStudentProfile")}
              </Link>
              <Button variant="danger" onClick={() => void resolveAlert(oldestPending.id)} loading={resolvingIds.has(oldestPending.id)} icon={<CheckCircle2 className="size-4" />}>
                {t("resolve")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-success-500/10 text-success-700 dark:text-success-300">
              <CheckCircle2 className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-success-900 dark:text-success-100">{t("priorityEmptyTitle")}</p>
              <p className="mt-0.5 text-sm text-success-700 dark:text-success-300">{t("priorityEmptyDescription")}</p>
            </div>
          </div>
        )}
      </SosPanel>

      {/* Alert table */}
      <div className="grid min-w-0 gap-5">
        <SosPanel index={4} reducedEffects={reducedEffects} className="p-5 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("queueEyebrow")}</p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">{t("queueTitle")}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {(["all", "pending", "resolved"] as const).map((f) => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    statusFilter === f
                      ? "border-navy-700 bg-navy-700 text-white dark:border-navy-400 dark:bg-navy-800"
                      : "border-border/60 bg-background/60 text-muted-foreground hover:border-border dark:border-white/10 dark:bg-white/6 dark:hover:border-white/20",
                  )}
                >
                  {f === "all" && <ListFilter className="size-3" />}
                  {f === "pending" && <Clock3 className="size-3" />}
                  {f === "resolved" && <CheckCircle2 className="size-3" />}
                  {f === "all" ? t("filterAll") : f === "pending" ? t("pending") : t("resolved")}
                  {f === "pending" && pendingAlerts.length > 0 && (
                    <span className="ml-0.5 rounded-full bg-danger-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">{pendingAlerts.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <DataTable
            columns={columns} data={visibleAlerts} pageSize={10} searchable
            toolbarTitle={t("filterLabel")}
            toolbarSummary={<span>{t("visibleAlertsCount", { count: visibleAlerts.length })}</span>}
            emptyMessage={statusFilter === "all" ? t("emptyInboxDescription") : t("noFilteredDescription")}
            emptyStateIcon={ShieldAlert}
            rowKey={(a) => a.id}
            scrollAreaClassName="rounded-b-[24px]"
            tableClassName="min-w-[1040px] xl:min-w-full [&_td]:px-3 [&_th]:px-3"
          />
        </SosPanel>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Priority queue */}
          {priorityAlerts.length > 0 && (
            <SosPanel index={5} reducedEffects={reducedEffects} className="p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("priorityEyebrow")}</p>
                  <h3 className="mt-1 text-base font-bold tracking-tight text-foreground">{t("priorityTitle")}</h3>
                </div>
                <span className="inline-flex rounded-full border border-warning-300/40 bg-warning-100/60 px-2.5 py-1 text-xs font-semibold text-warning-700 dark:border-warning-500/25 dark:bg-warning-950/40 dark:text-warning-300">
                  {priorityAlerts.length}
                </span>
              </div>
              <div className="grid gap-2.5">
                {priorityAlerts.map((alert) => <QueueAlertRow key={alert.id} alert={alert} role={role} onResolve={() => void resolveAlert(alert.id)} resolving={resolvingIds.has(alert.id)} formatDate={formatDate} t={t} />)}
              </div>
            </SosPanel>
          )}

          {/* Stats panel */}
          <SosPanel index={6} reducedEffects={reducedEffects} className="p-5">
            <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("statsPanelEyebrow")}</p>
            <h3 className="mt-1 text-base font-bold tracking-tight text-foreground">{t("statsPanelTitle")}</h3>
            <div className="mt-3 grid gap-2">
              <MetaRow label={t("totalAlerts")} value={String(alerts.length)} />
              <MetaRow label={t("pendingAlerts")} value={String(pendingAlerts.length)} />
              <MetaRow label={t("resolvedAlerts")} value={String(resolvedAlerts.length)} />
              {lastUpdatedAt && (
                <MetaRow label={t("lastUpdatedLabel")} value={formatDate(lastUpdatedAt)} />
              )}
            </div>
          </SosPanel>
        </div>
      </div>
    </PageScaffold>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SosPanel({ children, className, index, reducedEffects }: {
  children: React.ReactNode; className?: string; index: number; reducedEffects: boolean;
}) {
  return (
    <section
      style={sectionAnimation(index, reducedEffects)}
      className={cn(
        "relative overflow-hidden rounded-[12px] border border-border bg-card/88 shadow-[0_4px_12px_rgba(9,21,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-navy-950/68 dark:shadow-[0_4px_18px_rgba(0,0,0,0.22)]",
        !reducedEffects && "animate-fade-in-up opacity-0",
        className,
      )}
    >
      <div className="relative">{children}</div>
    </section>
  );
}

function KpiPanel({ index, reducedEffects, icon, iconClass, label, value, footer, footerIcon }: {
  index: number; reducedEffects: boolean; icon: React.ReactNode; iconClass: string;
  label: string; value: string; footer?: React.ReactNode; footerIcon?: React.ReactNode;
}) {
  return (
    <SosPanel index={index} reducedEffects={reducedEffects} className="group h-full min-h-[120px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(9,21,35,0.12)] dark:hover:shadow-[0_10px_28px_rgba(0,0,0,0.34)]">
      <div className="flex h-full min-h-[120px] flex-col p-4">
        <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
          <p className="min-w-0 text-sm font-semibold leading-snug text-muted-foreground">{label}</p>
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-[8px] transition-transform duration-300 group-hover:scale-105", iconClass)}>
            {icon}
          </span>
        </div>
        <p className="text-4xl font-extrabold tracking-tight text-foreground">{value}</p>
        <span className="mt-auto inline-flex min-w-0 items-start gap-1 pt-2 text-xs font-semibold leading-snug text-muted-foreground">
          {footerIcon}<span className="min-w-0">{footer}</span>
        </span>
      </div>
    </SosPanel>
  );
}

function MetaRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  if (sub) {
    return (
      <div className="flex flex-col gap-0.5 rounded-[12px] border border-border/70 bg-background/65 px-3.5 py-2.5 shadow-sm">
        <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <span className="min-w-0 break-words text-sm font-semibold text-foreground">{value}</span>
        <span className="min-w-0 break-all text-xs text-muted-foreground">{sub}</span>
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[12px] border border-border/70 bg-background/65 px-3.5 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-sm font-semibold text-foreground sm:text-right">{value}</span>
    </div>
  );
}


function InlineFocusEmpty({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-dashed border-border/60 bg-background/40 px-4 py-6 text-center">
      <Icon className="mx-auto size-6 text-muted-foreground/40" />
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function QueueAlertRow({ alert, role, onResolve, resolving, formatDate, t }: {
  alert: SosAlert; role: string; onResolve: () => void; resolving: boolean;
  formatDate: (v: string | null) => string; t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="grid min-w-0 gap-2 rounded-[12px] border border-warning-300/40 bg-warning-50/50 px-3.5 py-3 shadow-sm dark:border-warning-500/20 dark:bg-warning-950/30">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-base font-black tracking-tight text-foreground">{alert.student.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{getStudentMeta(alert.student)}</p>
        </div>
        <Badge variant="warning" className="shrink-0">{t("pending")}</Badge>
      </div>
      <p className="flex min-w-0 items-center gap-1 text-xs leading-snug text-muted-foreground">
        <Clock3 className="size-3 text-warning-600 dark:text-warning-400" />{formatDate(alert.createdAt)}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Link href={getStudentHref(role, alert.student.id)} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "justify-center")}>
          <ExternalLink className="size-3.5" />{t("openStudentProfile")}
        </Link>
        <Button variant="primary" size="sm" onClick={onResolve} loading={resolving} icon={<CheckCircle2 className="size-4" />} className="justify-center">
          {t("resolve")}
        </Button>
      </div>
    </div>
  );
}

function StudentAlertRow({ alert, formatDate, t }: {
  alert: SosAlert; formatDate: (v: string | null) => string;
  t: ReturnType<typeof useTranslations>;
}) {
  const resolved = alert.resolved;
  return (
    <div className={cn(
      "grid gap-2 rounded-[12px] border px-3.5 py-3 shadow-sm",
      resolved
        ? "border-success-300/30 bg-success-50/40 dark:border-success-500/20 dark:bg-success-950/25"
        : "border-warning-300/40 bg-warning-50/50 dark:border-warning-500/20 dark:bg-warning-950/30",
    )}>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-[10px]",
            resolved ? "bg-success-500/10 text-success-700 dark:text-success-300" : "bg-warning-500/10 text-warning-700 dark:text-warning-300")}>
            {resolved ? <CheckCircle2 className="size-4" /> : <ShieldAlert className="size-4" />}
          </span>
          <p className="min-w-0 text-xs leading-snug text-muted-foreground">{formatDate(alert.createdAt)}</p>
        </div>
        <Badge variant={resolved ? "success" : "warning"} className="w-fit shrink-0">{resolved ? t("resolved") : t("pending")}</Badge>
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        <div className="min-w-0 rounded-[10px] bg-white/70 px-3 py-2 dark:bg-navy-950/40">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("psychLabel")}</p>
          <p className="mt-0.5 min-w-0 break-words text-sm font-medium text-foreground">{alert.psych}</p>
        </div>
        <div className="min-w-0 rounded-[10px] bg-white/70 px-3 py-2 dark:bg-navy-950/40">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("teacherLabel")}</p>
          <p className="mt-0.5 min-w-0 break-words text-sm font-medium text-foreground">{alert.teacher}</p>
        </div>
      </div>
      {resolved && alert.resolvedAt && (
        <p className="text-xs text-success-700 dark:text-success-300">{t("resolvedAt")}: {formatDate(alert.resolvedAt)}</p>
      )}
    </div>
  );
}
