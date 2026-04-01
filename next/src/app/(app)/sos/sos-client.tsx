"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  ListFilter,
  Clock3,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { FieldShell } from "@/components/ui/field-shell";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useUser } from "@/components/user-context";
import { readApiResponse } from "@/lib/api-client";

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

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStudent(student: SosAlert["student"]) {
  const classLabel = student.className ? ` · ${student.className}` : "";
  const yearLabel = student.schoolYear ? ` (${student.schoolYear})` : "";
  return `${student.name}${classLabel}${yearLabel}`;
}

export default function SosClient() {
  const t = useTranslations("sos");
  const { role } = useUser();
  const isStudent = role === "ALUNO";
  const isStaff = !isStudent;
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "resolved"
  >("all");
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

  const fetchAlerts = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (!isStaff) {
      return;
    }

    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setLoadError(null);

    try {
      const data = await readApiResponse<SosAlert[]>(
        await fetch("/api/stats/sos-alerts"),
      );
      setAlerts(data);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro a carregar SOS";
      setLoadError(message);
      toast.error(message);
    } finally {
      if (mode === "initial") {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, [isStaff]);

  useEffect(() => {
    void fetchAlerts("initial");
  }, [fetchAlerts]);

  const fetchStudentAlerts = useCallback(async () => {
    setStudentLoading(true);
    setStudentLoadError(null);

    try {
      const data = await readApiResponse<SosAlert[]>(
        await fetch("/api/me/sos"),
      );
      setStudentAlerts(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("loadError");
      setStudentAlerts([]);
      setStudentLoadError(message);
      toast.error(message);
    } finally {
      setStudentLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isStudent) {
      return;
    }

    void fetchStudentAlerts();
  }, [isStudent, fetchStudentAlerts]);

  const resolveAlert = useCallback(
    async (alertId: string) => {
      setResolvingIds((current) => new Set(current).add(alertId));

      try {
        await readApiResponse<SosAlert>(
          await fetch(`/api/sos/${alertId}`, { method: "PATCH" }),
        );

        toast.success(t("resolvedSuccess"));
        await fetchAlerts("refresh");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao resolver alerta";
        toast.error(message);
      } finally {
        setResolvingIds((current) => {
          const next = new Set(current);
          next.delete(alertId);
          return next;
        });
      }
    },
    [fetchAlerts, t],
  );

  const visibleAlerts = useMemo(() => {
    if (statusFilter === "pending") {
      return alerts.filter((alert) => !alert.resolved);
    }

    if (statusFilter === "resolved") {
      return alerts.filter((alert) => alert.resolved);
    }

    return alerts;
  }, [alerts, statusFilter]);

  const hasOpenStudentAlert = studentAlerts.some((alert) => !alert.resolved);
  const activeStudentAlert = studentAlerts.find((alert) => !alert.resolved);

  const triggerSos = useCallback(async () => {
    if (hasOpenStudentAlert) {
      toast.error(t("alreadyOpen"));
      return;
    }

    setTriggeringSos(true);

    try {
      const response = await fetch("/api/me/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          psych: psych.trim(),
          teacher: teacher.trim(),
          psychEmail: psychEmail.trim() || undefined,
          teacherEmail: teacherEmail.trim() || undefined,
        }),
      });

      const result = await readApiResponse<SosAlert>(response);
      toast.success(t("success"));
      setStudentAlerts((current) => [result, ...current]);
      setPsych("");
      setTeacher("");
      setPsychEmail("");
      setTeacherEmail("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao enviar alerta SOS";
      toast.error(message);
    } finally {
      setTriggeringSos(false);
    }
  }, [hasOpenStudentAlert, psych, teacher, psychEmail, teacherEmail, t]);

  const columns = useMemo<Column<SosAlert>[]>(
    () => [
      {
        key: "student",
        header: t("studentLabel"),
        render: (alert) => formatStudent(alert.student),
        className: "min-w-[220px]",
      },
      {
        key: "psych",
        header: t("psychLabel"),
        render: (alert) => (
          <div className="flex flex-col gap-1">
            <span>{alert.psych}</span>
            {alert.psychEmail ? (
              <span className="text-tiny text-slate-500">
                {alert.psychEmail}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: "teacher",
        header: t("teacherLabel"),
        render: (alert) => (
          <div className="flex flex-col gap-1">
            <span>{alert.teacher}</span>
            {alert.teacherEmail ? (
              <span className="text-tiny text-slate-500">
                {alert.teacherEmail}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: "createdAt",
        header: t("createdAt"),
        render: (alert) => formatDate(alert.createdAt),
      },
      {
        key: "resolved",
        header: t("activeAlertTitle"),
        render: (alert) => (
          <Badge variant={alert.resolved ? "success" : "warning"}>
            {alert.resolved ? t("resolved") : t("pending")}
          </Badge>
        ),
      },
      {
        key: "resolvedBy",
        header: t("resolvedBy"),
        render: (alert) =>
          alert.resolvedBy
            ? (alert.resolvedBy.name ?? alert.resolvedBy.email)
            : "-",
      },
      {
        key: "actions",
        header: "",
        render: (alert) => {
          const studentHref =
            role === "PSICOLOGO"
              ? `/acompanhamento/${alert.student.id}`
              : `/alunos/${alert.student.id}`;

          return (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link
                href={studentHref}
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                <ExternalLink className="size-4" />
                {t("openStudentProfile")}
              </Link>
              {!alert.resolved ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void resolveAlert(alert.id)}
                  loading={resolvingIds.has(alert.id)}
                  icon={<CheckCircle2 className="size-4" />}
                >
                  {t("resolve")}
                </Button>
              ) : (
                <span className="text-sm text-slate-500">
                  {formatDate(alert.resolvedAt)}
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [resolveAlert, resolvingIds, role, t],
  );

  if (isStudent) {
    return (
      <PageScaffold
        headerProps={{
          title: t("title"),
          description: t("descriptionStudent"),
          eyebrow: "S.O.S.",
        }}
      >
        <div className="grid gap-6">
          <PageSection
            title={t("contactTitle")}
            description={t("contactDescription")}
            tone="secondary"
          >
            <div className="grid gap-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <FieldShell label={t("psych")}>
                  <Input
                    value={psych}
                    onChange={(event) => setPsych(event.target.value)}
                    placeholder={t("psych")}
                    disabled={
                      studentLoading || triggeringSos || hasOpenStudentAlert
                    }
                  />
                </FieldShell>
                <FieldShell label={t("teacher")}>
                  <Input
                    value={teacher}
                    onChange={(event) => setTeacher(event.target.value)}
                    placeholder={t("teacher")}
                    disabled={
                      studentLoading || triggeringSos || hasOpenStudentAlert
                    }
                  />
                </FieldShell>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <FieldShell
                  label={t("psychEmailLabel")}
                  hint={t("emailOptional")}
                >
                  <Input
                    type="email"
                    value={psychEmail}
                    onChange={(event) => setPsychEmail(event.target.value)}
                    placeholder="nome@escola.pt"
                    disabled={
                      studentLoading || triggeringSos || hasOpenStudentAlert
                    }
                  />
                </FieldShell>
                <FieldShell
                  label={t("teacherEmailLabel")}
                  hint={t("emailOptional")}
                >
                  <Input
                    type="email"
                    value={teacherEmail}
                    onChange={(event) => setTeacherEmail(event.target.value)}
                    placeholder="nome@escola.pt"
                    disabled={
                      studentLoading || triggeringSos || hasOpenStudentAlert
                    }
                  />
                </FieldShell>
              </div>

              {activeStudentAlert ? (
                <div className="rounded-2xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-900">
                  <p className="font-semibold">{t("alreadyOpen")}</p>
                  <p>{t("alreadyOpenHint")}</p>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  onClick={() => void triggerSos()}
                  loading={triggeringSos}
                  disabled={studentLoading || hasOpenStudentAlert}
                  icon={<ShieldAlert className="size-4" />}
                  className="w-full sm:w-auto"
                >
                  {hasOpenStudentAlert ? t("alreadyOpenButton") : t("trigger")}
                </Button>
                {studentLoading ? (
                  <p className="text-sm text-muted-foreground">
                    {t("loading")}
                  </p>
                ) : null}
              </div>

              {studentLoadError ? (
                <EmptyState
                  icon={XCircle}
                  title={t("loadError")}
                  description={studentLoadError}
                />
              ) : null}
            </div>
          </PageSection>

          <PageSection
            title={t("historyTitle")}
            description={t("historyDescription")}
            tone="secondary"
          >
            {studentLoading ? (
              <div className="grid gap-3">
                <div className="h-24 rounded-2xl bg-muted/70" />
                <div className="h-24 rounded-2xl bg-muted/70" />
              </div>
            ) : studentLoadError ? (
              <EmptyState
                icon={XCircle}
                title={t("loadError")}
                description={studentLoadError}
              />
            ) : studentAlerts.length === 0 ? (
              <EmptyState
                icon={ShieldAlert}
                title={t("noActiveTitle")}
                description={t("noHistoryDescription")}
              />
            ) : (
              <div className="grid gap-4">
                {studentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-2xl border border-white/20 bg-white/60 p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatStudent(alert.student)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(alert.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          alert.resolved
                            ? "bg-success-100 text-success-700"
                            : "bg-warning-100 text-warning-700"
                        }`}
                      >
                        {alert.resolved ? t("resolved") : t("pending")}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-navy-950/5 p-3">
                        <p className="text-tiny uppercase tracking-[0.18em] text-muted-foreground">
                          {t("psychLabel")}
                        </p>
                        <p className="mt-2 font-medium text-foreground">
                          {alert.psych}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {alert.psychEmail ?? "-"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-navy-950/5 p-3">
                        <p className="text-tiny uppercase tracking-[0.18em] text-muted-foreground">
                          {t("teacherLabel")}
                        </p>
                        <p className="mt-2 font-medium text-foreground">
                          {alert.teacher}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {alert.teacherEmail ?? "-"}
                        </p>
                      </div>
                    </div>

                    {alert.resolved ? (
                      <p className="mt-4 text-sm text-muted-foreground">
                        {t("resolvedAt")}: {formatDate(alert.resolvedAt)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </PageSection>
        </div>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      headerProps={{
        title: t("staffTitle"),
        description: t("staffDescription"),
        eyebrow: "S.O.S.",
      }}
    >
      <PageSection
        title={t("staffTitle")}
        description={t("staffDescription")}
        tone="secondary"
      >
        {loading ? (
          <div className="grid gap-3">
            <div className="h-16 rounded-2xl bg-muted/70" />
            <div className="h-16 rounded-2xl bg-muted/70" />
            <div className="h-16 rounded-2xl bg-muted/70" />
          </div>
        ) : loadError ? (
          <EmptyState
            icon={XCircle}
            title={t("loadError")}
            description={loadError}
          />
        ) : (
          <DataTable
            columns={columns}
            data={visibleAlerts}
            pageSize={10}
            searchable
            toolbarTitle={t("staffTitle")}
            toolbarSummary={
              <>
                <span className="block">
                  {visibleAlerts.length} alerta
                  {visibleAlerts.length === 1 ? "" : "s"}
                </span>
                <span className="mt-0.5 block text-xs font-medium text-muted-foreground">
                  {refreshing
                    ? t("refreshing")
                    : lastUpdatedAt
                      ? t("lastUpdated", { time: formatDate(lastUpdatedAt) })
                      : t("neverUpdated")}
                </span>
              </>
            }
            toolbarActions={
              <>
                <Button
                  variant={statusFilter === "all" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  icon={<ListFilter className="size-4" />}
                >
                  {t("filterAll")}
                </Button>
                <Button
                  variant={statusFilter === "pending" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("pending")}
                  icon={<Clock3 className="size-4" />}
                >
                  {t("pending")}
                </Button>
                <Button
                  variant={statusFilter === "resolved" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("resolved")}
                  icon={<CheckCircle2 className="size-4" />}
                >
                  {t("resolved")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchAlerts("refresh")}
                  loading={refreshing}
                  disabled={loading || refreshing}
                  icon={<RefreshCw className="size-4" />}
                >
                  {refreshing ? t("refreshing") : t("refresh")}
                </Button>
              </>
            }
            emptyMessage={t("noHistoryDescription")}
            rowKey={(alert) => alert.id}
          />
        )}
      </PageSection>
    </PageScaffold>
  );
}
