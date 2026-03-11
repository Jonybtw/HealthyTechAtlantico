"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Link2,
  Mail,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useUser } from "@/components/user-context";
import { PageTransition, FadeIn, StaggerList, StaggerItem } from "@/components/ui/motion";

interface LinkedStudent {
  id: string;
  name: string;
  className: string | null;
  schoolYear: string | null;
}

interface SosAlert {
  id: string;
  psych: string;
  teacher: string;
  psychEmail: string | null;
  teacherEmail: string | null;
  resolved: boolean;
  createdAt: string;
  resolvedAt: string | null;
  student: LinkedStudent;
  resolvedBy: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}

type SosFilter = "pending" | "resolved" | "all";

const EMPTY_FORM = {
  psych: "",
  teacher: "",
  psychEmail: "",
  teacherEmail: "",
};

function getAlertsFromBody(body: unknown): SosAlert[] {
  if (Array.isArray(body)) {
    return body as SosAlert[];
  }

  if (
    body &&
    typeof body === "object" &&
    "alerts" in body &&
    Array.isArray((body as { alerts?: unknown }).alerts)
  ) {
    return (body as { alerts: SosAlert[] }).alerts;
  }

  return [];
}

function getErrorMessage(body: unknown): string | null {
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error?: unknown }).error;

    if (typeof error === "string") {
      return error;
    }

    if (Array.isArray(error) && typeof error[0]?.message === "string") {
      return error[0].message;
    }
  }

  return null;
}

export default function SosPage() {
  const t = useTranslations("sos");
  const locale = useLocale();
  const { role } = useUser();

  const [form, setForm] = useState(EMPTY_FORM);
  const [linkedStudent, setLinkedStudent] = useState<LinkedStudent | null>(null);
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loadingStudent, setLoadingStudent] = useState(role === "ALUNO");
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [sending, setSending] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<SosFilter>("pending");

  const formatDateTime = useCallback(
    (value: string | null) => {
      if (!value) {
        return "—";
      }

      return new Date(value).toLocaleString(locale === "en" ? "en-GB" : "pt-PT", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    },
    [locale]
  );

  const loadStudentView = useCallback(async () => {
    setLoadingStudent(true);
    setLoadingAlerts(true);

    try {
      const studentRes = await fetch("/api/students?limit=1");
      const studentBody = await studentRes.json().catch(() => ({}));

      if (!studentRes.ok) {
        throw new Error(getErrorMessage(studentBody) ?? t("loadStudentError"));
      }

      const student = studentBody.students?.[0] as LinkedStudent | undefined;
      setLinkedStudent(student ?? null);

      if (!student) {
        setAlerts([]);
        return;
      }

      const alertsRes = await fetch(`/api/students/${student.id}/sos`);
      const alertsBody = await alertsRes.json().catch(() => ({}));

      if (!alertsRes.ok) {
        throw new Error(getErrorMessage(alertsBody) ?? t("loadError"));
      }

      setAlerts(getAlertsFromBody(alertsBody));
    } catch (error) {
      setLinkedStudent(null);
      setAlerts([]);
      toast.error(error instanceof Error ? error.message : t("loadError"));
    } finally {
      setLoadingStudent(false);
      setLoadingAlerts(false);
    }
  }, [t]);

  const loadStaffView = useCallback(async () => {
    setLoadingAlerts(true);

    try {
      const res = await fetch("/api/stats/sos-alerts");
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(getErrorMessage(body) ?? t("loadError"));
      }

      setAlerts(getAlertsFromBody(body));
    } catch (error) {
      setAlerts([]);
      toast.error(error instanceof Error ? error.message : t("loadError"));
    } finally {
      setLoadingAlerts(false);
    }
  }, [t]);

  useEffect(() => {
    if (role === "ALUNO") {
      void loadStudentView();
      return;
    }

    setLinkedStudent(null);
    setLoadingStudent(false);
    void loadStaffView();
  }, [role, loadStudentView, loadStaffView]);

  const refreshCurrentView = async () => {
    if (role === "ALUNO") {
      await loadStudentView();
      return;
    }

    await loadStaffView();
  };

  const handleTrigger = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!linkedStudent) {
      toast.error(t("studentNotLinkedDescription"));
      return;
    }

    setSending(true);

    try {
      const res = await fetch(`/api/students/${linkedStudent.id}/sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const body = await res.json().catch(() => ({}));

      if (res.status === 409) {
        const existingAlert = (body as { alert?: SosAlert }).alert;
        if (existingAlert) {
          setAlerts((current) => [
            existingAlert,
            ...current.filter((alert) => alert.id !== existingAlert.id),
          ]);
        }

        toast.error(getErrorMessage(body) ?? t("alreadyOpen"));
        return;
      }

      if (!res.ok) {
        toast.error(getErrorMessage(body) ?? t("sendError"));
        return;
      }

      const alert = body as SosAlert;
      setAlerts((current) => [alert, ...current.filter((item) => item.id !== alert.id)]);
      toast.success(t("success"));
    } catch {
      toast.error(t("sendError"));
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    setResolvingId(alertId);

    try {
      const res = await fetch(`/api/sos/${alertId}`, {
        method: "PATCH",
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(getErrorMessage(body) ?? t("resolveError"));
        return;
      }

      const updatedAlert = body as SosAlert;
      setAlerts((current) =>
        current.map((alert) => (alert.id === updatedAlert.id ? updatedAlert : alert))
      );
      toast.success(t("resolvedSuccess"));
    } catch {
      toast.error(t("resolveError"));
    } finally {
      setResolvingId(null);
    }
  };

  const pendingAlerts = alerts.filter((alert) => !alert.resolved);
  const resolvedAlerts = alerts.filter((alert) => alert.resolved);
  const openAlert = pendingAlerts[0] ?? null;
  const filteredAlerts =
    filter === "all"
      ? alerts
      : filter === "pending"
        ? pendingAlerts
        : resolvedAlerts;

  const statusClass = (resolved: boolean) =>
    resolved
      ? "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400"
      : "bg-danger-100 text-danger-700 dark:bg-danger-900/20 dark:text-danger-300";

  if (role === "ALUNO") {
    if (loadingStudent) {
      return (
        <div className="flex flex-col gap-5">
          <PageHeader title={t("title")} description={t("descriptionStudent")} />
          <p className="text-sm text-muted-foreground animate-pulse">{t("loading")}</p>
        </div>
      );
    }

    if (!linkedStudent) {
      return (
        <div className="flex flex-col gap-5">
          <PageHeader title={t("title")} description={t("descriptionStudent")} />
          <EmptyState
            icon={Link2}
            title={t("studentNotLinkedTitle")}
            description={t("studentNotLinkedDescription")}
          />
        </div>
      );
    }

    return (
      <PageTransition className="flex flex-col gap-5">
        <PageHeader title={t("title")} description={t("descriptionStudent")}>
          <Button
            size="sm"
            variant="ghost"
            icon={<RefreshCw className="size-4" />}
            onClick={refreshCurrentView}
          >
            {t("refresh")}
          </Button>
        </PageHeader>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleTrigger}
            className="bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-5 flex flex-col gap-5"
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold tracking-tight">{t("contactTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("contactDescription")}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label={t("psychLabel")}
                placeholder={t("psych")}
                value={form.psych}
                onChange={(event) =>
                  setForm((current) => ({ ...current, psych: event.target.value }))
                }
                disabled={sending || !!openAlert}
                required
              />
              <Input
                label={t("teacherLabel")}
                placeholder={t("teacher")}
                value={form.teacher}
                onChange={(event) =>
                  setForm((current) => ({ ...current, teacher: event.target.value }))
                }
                disabled={sending || !!openAlert}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                type="email"
                label={t("psychEmailLabel")}
                placeholder={t("emailOptional")}
                value={form.psychEmail}
                onChange={(event) =>
                  setForm((current) => ({ ...current, psychEmail: event.target.value }))
                }
                disabled={sending || !!openAlert}
              />
              <Input
                type="email"
                label={t("teacherEmailLabel")}
                placeholder={t("emailOptional")}
                value={form.teacherEmail}
                onChange={(event) =>
                  setForm((current) => ({ ...current, teacherEmail: event.target.value }))
                }
                disabled={sending || !!openAlert}
              />
            </div>

            <div className="rounded-2xl border border-danger-200/70 bg-danger-50/70 dark:border-danger-900/30 dark:bg-danger-950/20 p-4 flex gap-3">
              <AlertTriangle className="size-5 shrink-0 text-danger-600 dark:text-danger-400" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-danger-700 dark:text-danger-300">
                  {t("confidentialTitle")}
                </p>
                <p className="text-sm text-danger-700/90 dark:text-danger-300/80">
                  {t("confidential")}
                </p>
              </div>
            </div>

            <Button
              type="submit"
              loading={sending}
              variant="danger"
              icon={<AlertTriangle className="size-4" />}
              className="self-start"
              disabled={!!openAlert}
            >
              {openAlert ? t("alreadyOpenButton") : t("trigger")}
            </Button>
          </form>

          <div className="bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold tracking-tight">{t("activeAlertTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("activeAlertDescription")}</p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("linkedStudentLabel")}
              </p>
              <p className="mt-2 text-base font-semibold">{linkedStudent.name}</p>
              <p className="text-sm text-muted-foreground">
                {[linkedStudent.className, linkedStudent.schoolYear].filter(Boolean).join(" · ") ||
                  "—"}
              </p>
            </div>

            {openAlert ? (
              <div className="rounded-2xl border border-danger-300/60 bg-danger-50/70 dark:border-danger-900/30 dark:bg-danger-950/20 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(false)}`}>
                    {t("pending")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(openAlert.createdAt)}
                  </span>
                </div>
                <p className="text-sm">
                  <span className="font-medium">{t("psychLabel")}:</span> {openAlert.psych}
                </p>
                <p className="text-sm">
                  <span className="font-medium">{t("teacherLabel")}:</span> {openAlert.teacher}
                </p>
                <p className="text-sm text-muted-foreground">{t("alreadyOpenHint")}</p>
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title={t("noActiveTitle")}
                description={t("noActiveDescription")}
              />
            )}
          </div>
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight">{t("historyTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("historyDescription")}</p>
          </div>

          {loadingAlerts ? (
            <p className="text-sm text-muted-foreground animate-pulse">{t("loading")}</p>
          ) : alerts.length === 0 ? (
            <EmptyState
              icon={Clock3}
              title={t("noHistoryTitle")}
              description={t("noHistoryDescription")}
            />
          ) : (
            <StaggerList className="grid gap-3">
              {alerts.map((alert) => (
                <StaggerItem
                  key={alert.id}
                  className="bg-card/85 glass rounded-2xl border border-border/50 p-5 flex flex-col gap-4 shadow-float"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{linkedStudent.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("createdAt")}: {formatDateTime(alert.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(alert.resolved)}`}
                    >
                      {alert.resolved ? t("resolved") : t("pending")}
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {t("psychLabel")}
                      </p>
                      <p className="mt-1 font-medium">{alert.psych}</p>
                      {alert.psychEmail ? (
                        <p className="mt-1 text-sm text-muted-foreground">{alert.psychEmail}</p>
                      ) : null}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {t("teacherLabel")}
                      </p>
                      <p className="mt-1 font-medium">{alert.teacher}</p>
                      {alert.teacherEmail ? (
                        <p className="mt-1 text-sm text-muted-foreground">{alert.teacherEmail}</p>
                      ) : null}
                    </div>
                  </div>

                  {alert.resolved ? (
                    <p className="text-sm text-muted-foreground">
                      {t("resolvedAt")}: {formatDateTime(alert.resolvedAt)}
                    </p>
                  ) : null}
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </section>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex flex-col gap-5">
      <PageHeader title={t("staffTitle")} description={t("staffDescription")}>
        <Button
          size="sm"
          variant="ghost"
          icon={<RefreshCw className="size-4" />}
          onClick={refreshCurrentView}
        >
          {t("refresh")}
        </Button>
      </PageHeader>

      <StaggerList className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t("totalAlerts"), value: alerts.length, tone: "border-border/50" },
          { label: t("pendingAlerts"), value: pendingAlerts.length, tone: "border-danger-300/60" },
          { label: t("resolvedAlerts"), value: resolvedAlerts.length, tone: "border-success-300/60" },
        ].map((card) => (
          <StaggerItem
            key={card.label}
            className={`bg-card/85 glass rounded-2xl border ${card.tone} shadow-float p-5`}
          >
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight">{card.value}</p>
          </StaggerItem>
        ))}
      </StaggerList>

      <div className="flex flex-wrap gap-2">
        {([
          ["pending", t("filterPending")],
          ["resolved", t("filterResolved")],
          ["all", t("filterAll")],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all border ${
              filter === value
                ? "border-navy-800 bg-navy-900 text-white shadow-float"
                : "border-border/60 bg-card/70 text-muted-foreground hover:text-foreground hover:border-navy-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loadingAlerts ? (
        <p className="text-sm text-muted-foreground animate-pulse">{t("loading")}</p>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={t("emptyInboxTitle")}
          description={t("emptyInboxDescription")}
        />
      ) : filteredAlerts.length === 0 ? (
        <EmptyState
          icon={Clock3}
          title={t("noFilteredTitle")}
          description={t("noFilteredDescription")}
        />
      ) : (
        <StaggerList className="flex flex-col gap-3">
          {filteredAlerts.map((alert) => (
            <StaggerItem
              key={alert.id}
              className={`bg-card/85 glass rounded-2xl border p-5 flex flex-col gap-4 shadow-float ${
                alert.resolved
                  ? "border-border/50"
                  : "border-danger-300/60 dark:border-danger-900/30"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{alert.student.name}</h2>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(alert.resolved)}`}
                    >
                      {alert.resolved ? t("resolved") : t("pending")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {[alert.student.className, alert.student.schoolYear]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/alunos/${alert.student.id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-navy-300 hover:text-foreground"
                  >
                    {t("openStudentProfile")}
                  </Link>
                  {!alert.resolved ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={resolvingId === alert.id}
                      icon={<CheckCircle2 className="size-4" />}
                      onClick={() => handleResolve(alert.id)}
                    >
                      {t("resolve")}
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {t("psychLabel")}
                  </p>
                  <p className="mt-1 font-medium">{alert.psych}</p>
                  {alert.psychEmail ? (
                    <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="size-4" />
                      {alert.psychEmail}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {t("teacherLabel")}
                  </p>
                  <p className="mt-1 font-medium">{alert.teacher}</p>
                  {alert.teacherEmail ? (
                    <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="size-4" />
                      {alert.teacherEmail}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/40 p-4 min-w-[220px]">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {t("createdAt")}
                  </p>
                  <p className="mt-1 text-sm font-medium">{formatDateTime(alert.createdAt)}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {t("resolvedAt")}
                  </p>
                  <p className="mt-1 text-sm font-medium">{formatDateTime(alert.resolvedAt)}</p>
                </div>
              </div>

              {alert.resolved && alert.resolvedBy ? (
                <p className="text-sm text-muted-foreground">
                  {t("resolvedBy")}: {alert.resolvedBy.name ?? alert.resolvedBy.email}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{t("staffPendingHint")}</p>
              )}
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </PageTransition>
  );
}
