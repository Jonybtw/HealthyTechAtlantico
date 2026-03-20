"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Link2,
  ListFilter,
  Mail,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useUser } from "@/components/user-context";
import { StaggerList, StaggerItem } from "@/components/ui/motion";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage, readApiResponse } from "@/lib/api-client";

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

export default function SosPage() {
  const t = useTranslations("sos");
  const common = useTranslations("common");
  const locale = useLocale();
  const { role } = useUser();

  const [form, setForm] = useState(EMPTY_FORM);
  const [linkedStudent, setLinkedStudent] = useState<LinkedStudent | null>(null);
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [studentLoadError, setStudentLoadError] = useState<string | null>(null);
  const [alertsLoadError, setAlertsLoadError] = useState<string | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(role === "ALUNO");
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [sending, setSending] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<SosFilter>("pending");

  const formatDateTime = useCallback(
    (value: string | null) => {
      if (!value) {
        return "-";
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
    setStudentLoadError(null);
    setAlertsLoadError(null);

    try {
      const studentRes = await fetch("/api/students?limit=1");
      const studentBody = await readApiResponse<{ students: LinkedStudent[] }>(studentRes);
      const student = studentBody.students[0];

      if (!student) {
        setLinkedStudent(null);
        setAlerts([]);
        return;
      }

      setLinkedStudent(student);

      try {
        const alertsRes = await fetch(`/api/students/${student.id}/sos`);
        const alertsBody = await readApiResponse<SosAlert[]>(alertsRes);
        setAlerts(alertsBody);
      } catch (error) {
        const message = error instanceof Error ? error.message : common("studentListLoadError");
        setAlertsLoadError(message);
        toast.error(message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : common("studentListLoadError");
      setStudentLoadError(message);
      toast.error(message);
    } finally {
      setLoadingStudent(false);
      setLoadingAlerts(false);
    }
  }, [common]);

  const loadStaffView = useCallback(async () => {
    setLoadingAlerts(true);
    setAlertsLoadError(null);

    try {
      const res = await fetch("/api/stats/sos-alerts");
      const alertsBody = await readApiResponse<SosAlert[]>(res);
      setAlerts(alertsBody);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("loadError");
      setAlertsLoadError(message);
      toast.error(message);
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
    setStudentLoadError(null);
    setAlertsLoadError(null);
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
    if (alertsLoadError) {
      toast.error("Não é possível enviar o SOS enquanto os alertas não carregam.");
      return;
    }
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

      if (res.status === 409) {
        const body = await res.json().catch(() => undefined);
        toast.error(getApiErrorMessage(body, t("alreadyOpen")));
        await loadStudentView();
        return;
      }

      const alert = await readApiResponse<SosAlert>(res);
      setAlerts((current) => [alert, ...current.filter((item) => item.id !== alert.id)]);
      toast.success(t("success"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("sendError"));
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
      const updatedAlert = await readApiResponse<SosAlert>(res);
      setAlerts((current) =>
        current.map((alert) => (alert.id === updatedAlert.id ? updatedAlert : alert))
      );
      toast.success(t("resolvedSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("resolveError"));
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
        <PageScaffold headerProps={{ title: t("title"), description: t("descriptionStudent") }}>
          <Skeleton className="h-4 w-32" />
        </PageScaffold>
      );
    }

    if (studentLoadError && !linkedStudent) {
      return (
        <PageScaffold headerProps={{ title: t("title"), description: t("descriptionStudent") }}>
          <div className="rounded-3xl border border-warning-200/70 bg-warning-50/80 p-5 shadow-card dark:border-warning-900/30 dark:bg-warning-950/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-600 dark:text-warning-400" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Não foi possível carregar o teu perfil.</p>
                <p className="text-sm text-muted-foreground">
                  A associação ao aluno não pôde ser confirmada agora. Tenta novamente em instantes.
                </p>
                <p className="text-sm text-muted-foreground">{studentLoadError}</p>
              </div>
            </div>
            <Button
              className="mt-4"
              variant="secondary"
              icon={<RefreshCw className="size-4" />}
              onClick={refreshCurrentView}
            >
              {t("refresh")}
            </Button>
          </div>
        </PageScaffold>
      );
    }

    if (!linkedStudent) {
      return (
        <PageScaffold headerProps={{ title: t("title"), description: t("descriptionStudent") }}>
          <EmptyState
            icon={Link2}
            title={t("studentNotLinkedTitle")}
            description={t("studentNotLinkedDescription")}
          />
        </PageScaffold>
      );
    }

    return (
      <PageScaffold
        headerProps={{ title: t("title"), description: t("descriptionStudent") }}
        headerActions={
          <Button
            size="sm"
            variant="ghost"
            icon={<RefreshCw className="size-4" />}
            onClick={refreshCurrentView}
          >
            {t("refresh")}
          </Button>
        }
      >
        {studentLoadError || alertsLoadError ? (
          <div className="rounded-3xl border border-warning-200/70 bg-warning-50/80 p-4 shadow-card dark:border-warning-900/30 dark:bg-warning-950/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-600 dark:text-warning-400" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  {alertsLoadError
                    ? "Os alertas e o histórico não carregaram."
                    : "A ligação ao aluno não pôde ser atualizada."}
                </p>
                <p className="text-sm text-muted-foreground">
                  {alertsLoadError
                    ? "Mantivemos o aluno ligado visível, mas os dados podem estar desatualizados."
                    : "A ligação ao aluno continua visível, mas podes precisar de atualizar para confirmar os dados."}
                </p>
                <p className="text-sm text-muted-foreground">
                  {alertsLoadError ?? studentLoadError}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <PageSection
            tone="primary"
            layout="form"
            title={t("contactTitle")}
            description={t("contactDescription")}
          >
            <form onSubmit={handleTrigger} className="flex flex-col gap-4">

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label={t("psychLabel")}
                placeholder={t("psych")}
                value={form.psych}
                onChange={(event) =>
                  setForm((current) => ({ ...current, psych: event.target.value }))
                }
                disabled={sending || !!openAlert || !!alertsLoadError}
                required
              />
              <Input
                label={t("teacherLabel")}
                placeholder={t("teacher")}
                value={form.teacher}
                onChange={(event) =>
                  setForm((current) => ({ ...current, teacher: event.target.value }))
                }
                disabled={sending || !!openAlert || !!alertsLoadError}
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
                disabled={sending || !!openAlert || !!alertsLoadError}
              />
              <Input
                type="email"
                label={t("teacherEmailLabel")}
                placeholder={t("emailOptional")}
                value={form.teacherEmail}
                onChange={(event) =>
                  setForm((current) => ({ ...current, teacherEmail: event.target.value }))
                }
                disabled={sending || !!openAlert || !!alertsLoadError}
              />
            </div>

            <div className="rounded-xl border border-danger-200/70 bg-danger-50/70 dark:border-danger-900/30 dark:bg-danger-950/20 p-3 flex gap-3">
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
              disabled={!!openAlert || !!alertsLoadError}
            >
              {openAlert ? t("alreadyOpenButton") : t("trigger")}
            </Button>
            </form>
          </PageSection>

          <PageSection
            tone="secondary"
            layout="list"
            title={t("activeAlertTitle")}
            description={t("activeAlertDescription")}
          >
            <div className="rounded-xl border border-border/60 bg-background/40 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("linkedStudentLabel")}
              </p>
              <p className="mt-2 text-base font-semibold">{linkedStudent.name}</p>
                <p className="text-sm text-muted-foreground">
                  {[linkedStudent.className, linkedStudent.schoolYear].filter(Boolean).join(" - ") ||
                    "-"}
                </p>
            </div>

            {alertsLoadError ? (
              <div className="rounded-xl border border-warning-200/80 bg-warning-50/70 p-4 dark:border-warning-900/30 dark:bg-warning-950/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-600 dark:text-warning-400" />
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">
                      Não foi possível carregar os alertas desta ligação.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      O aluno continua ligado, mas os dados podem estar incompletos até atualizares a página.
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<RefreshCw className="size-4" />}
                      onClick={refreshCurrentView}
                    >
                      {t("refresh")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : openAlert ? (
              <div className="rounded-xl border border-danger-300/60 bg-danger-50/70 dark:border-danger-900/30 dark:bg-danger-950/20 p-3 flex flex-col gap-3">
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
          </PageSection>
        </div>

        <PageSection
          tone="secondary"
          layout="list"
          title={t("historyTitle")}
          description={t("historyDescription")}
        >
          {alertsLoadError ? (
            <div className="rounded-2xl border border-warning-200/80 bg-warning-50/70 p-4 dark:border-warning-900/30 dark:bg-warning-950/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-600 dark:text-warning-400" />
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">O histórico de alertas não carregou.</p>
                  <p className="text-sm text-muted-foreground">
                    O aluno continua ligado, mas esta lista pode estar incompleta até atualizares a página.
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<RefreshCw className="size-4" />}
                    onClick={refreshCurrentView}
                  >
                    {t("refresh")}
                  </Button>
                </div>
              </div>
            </div>
          ) : loadingAlerts ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
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
                  className="surface-secondary rounded-[18px] border border-border/50 p-4 flex flex-col gap-3 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{linkedStudent.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("createdAt")}: {formatDateTime(alert.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(alert.resolved)}`}
                    >
                      {alert.resolved ? (
                        <>
                          <CheckCircle2 className="size-3.5" />
                          {t("resolved")}
                        </>
                      ) : (
                        <>
                          <Clock3 className="size-3.5" />
                          {t("pending")}
                        </>
                      )}
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
        </PageSection>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      headerProps={{ title: t("staffTitle"), description: t("staffDescription") }}
      headerActions={
        <Button
          size="sm"
          variant="ghost"
          icon={<RefreshCw className="size-4" />}
          onClick={refreshCurrentView}
        >
          {t("refresh")}
        </Button>
      }
    >

      <StaggerList className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t("totalAlerts"), value: alerts.length, tone: "border-border/50", icon: ListFilter },
          { label: t("pendingAlerts"), value: pendingAlerts.length, tone: "border-danger-300/60 text-danger-600 dark:text-danger-400", icon: Clock3 },
          { label: t("resolvedAlerts"), value: resolvedAlerts.length, tone: "border-success-300/60 text-success-600 dark:text-success-400", icon: CheckCircle2 },
        ].map((card) => (
          <StaggerItem
            key={card.label}
            className={`surface-secondary relative overflow-hidden rounded-[20px] border ${card.tone.split(' ')[0]} p-5`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
              <card.icon className={`size-5 ${card.tone.includes('danger') ? 'text-danger-500' : card.tone.includes('success') ? 'text-success-500' : 'text-muted-foreground'}`} />
            </div>
            <p className={`mt-2 text-3xl font-extrabold tracking-tight ${card.tone.includes('danger') ? 'text-danger-600 dark:text-danger-400' : card.tone.includes('success') ? 'text-success-600 dark:text-success-400' : ''}`}>
              {card.value}
            </p>
          </StaggerItem>
        ))}
      </StaggerList>

      <div role="group" aria-label={t("filterLabel")} className="flex flex-wrap gap-2">
        {([
          ["pending", t("filterPending"), Clock3],
          ["resolved", t("filterResolved"), CheckCircle2],
          ["all", t("filterAll"), ListFilter],
        ] as const).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border ${
              filter === value
                ? "border-navy-800 bg-navy-900 text-white shadow-float"
                : "border-border/60 bg-card/70 text-muted-foreground hover:text-foreground hover:border-navy-300 hover:bg-muted/50"
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {alertsLoadError ? (
        <div className="rounded-2xl border border-warning-200/80 bg-warning-50/70 p-4 dark:border-warning-900/30 dark:bg-warning-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-600 dark:text-warning-400" />
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Não foi possível carregar os alertas.</p>
              <p className="text-sm text-muted-foreground">
                A lista pode estar desatualizada. Tenta atualizar para voltar a carregar os dados.
              </p>
              <Button
                size="sm"
                variant="secondary"
                icon={<RefreshCw className="size-4" />}
                onClick={refreshCurrentView}
              >
                {t("refresh")}
              </Button>
            </div>
          </div>
        </div>
      ) : loadingAlerts ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
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
              className={`surface-secondary rounded-[18px] border p-4 flex flex-col gap-3 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-card ${
                alert.resolved
                  ? "border-border/50"
                  : "border-danger-300/60 dark:border-danger-900/30"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{alert.student.name}</h2>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(alert.resolved)}`}
                    >
                      {alert.resolved ? (
                        <>
                          <CheckCircle2 className="size-3.5" />
                          {t("resolved")}
                        </>
                      ) : (
                        <>
                          <Clock3 className="size-3.5" />
                          {t("pending")}
                        </>
                      )}
                    </span>
                  </div>
                    <p className="text-sm text-muted-foreground">
                      {[alert.student.className, alert.student.schoolYear]
                        .filter(Boolean)
                        .join(" - ") || "-"}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/alunos/${alert.student.id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-navy-300 hover:text-foreground"
                  >
                    <ExternalLink className="size-3.5" />
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

              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {t("psychLabel")}
                  </p>
                  <p className="mt-1 font-medium">{alert.psych}</p>
                  {alert.psychEmail ? (
                    <p className="mt-2 inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                      <Mail className="size-4" />
                      {alert.psychEmail}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {t("teacherLabel")}
                  </p>
                  <p className="mt-1 font-medium">{alert.teacher}</p>
                  {alert.teacherEmail ? (
                    <p className="mt-2 inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                      <Mail className="size-4" />
                      {alert.teacherEmail}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-xl border border-border/60 bg-background/40 p-3 min-w-[200px]">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {t("createdAt")}
                  </p>
                  <p className="mt-1 text-[13px] font-medium">{formatDateTime(alert.createdAt)}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {t("resolvedAt")}
                  </p>
                  <p className="mt-1 text-[13px] font-medium">{formatDateTime(alert.resolvedAt)}</p>
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
    </PageScaffold>
  );
}
