"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StaggerItem, StaggerList } from "@/components/ui/motion";
import { readApiResponse } from "@/lib/api-client";
import {
  getKidmedClassificationLabelKey,
  getKidmedPeriodLabelKey,
  getQuestionnairePreviewItems,
  getQuestionnaireTypeLabelKey,
  type KidmedClassification,
  type QuestionnaireTypeValue,
} from "@/lib/questionnaires";

interface StudentIdentity {
  id: string;
  name: string;
  className: string | null;
  schoolYear: string | null;
  birthDate: string | null;
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
  resolvedBy: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}

interface QuestionnaireRecord {
  id: string;
  type: QuestionnaireTypeValue;
  deferredCount: number;
  submittedAt: string;
  instrumentVersion: string | null;
  schoolYear: string | null;
  periodKey: string | null;
  score: number | null;
  classification: KidmedClassification | null;
  payload: Record<string, unknown>;
}

function formatStudentAge(birthDate: string | null) {
  if (!birthDate) {
    return null;
  }

  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() >= birth.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function AcompanhamentoClient({
  student,
}: {
  student: StudentIdentity;
}) {
  const t = useTranslations("acompanhamento");
  const q = useTranslations("questionarios");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireRecord[]>(
    [],
  );
  const [sosError, setSosError] = useState<string | null>(null);
  const [questionnaireError, setQuestionnaireError] = useState<string | null>(
    null,
  );

  const formatDateTime = useCallback(
    (value: string | null) => {
      if (!value) {
        return "-";
      }

      return new Date(value).toLocaleString(
        locale === "en" ? "en-GB" : "pt-PT",
        {
          dateStyle: "medium",
          timeStyle: "short",
        },
      );
    },
    [locale],
  );

  const loadContext = useCallback(async () => {
    setLoading(true);
    setSosError(null);
    setQuestionnaireError(null);

    const [sosResult, questionnairesResult] = await Promise.allSettled([
      fetch(`/api/students/${student.id}/sos`).then((response) =>
        readApiResponse<SosAlert[]>(response),
      ),
      fetch(`/api/students/${student.id}/questionnaires`).then((response) =>
        readApiResponse<QuestionnaireRecord[]>(response),
      ),
    ]);

    if (sosResult.status === "fulfilled") {
      setSosAlerts(sosResult.value);
    } else {
      const message =
        sosResult.reason instanceof Error
          ? sosResult.reason.message
          : t("loadSosError");
      setSosAlerts([]);
      setSosError(message);
      toast.error(message);
    }

    if (questionnairesResult.status === "fulfilled") {
      setQuestionnaires(questionnairesResult.value);
    } else {
      const message =
        questionnairesResult.reason instanceof Error
          ? questionnairesResult.reason.message
          : t("loadQuestionnairesError");
      setQuestionnaires([]);
      setQuestionnaireError(message);
      toast.error(message);
    }

    setLoading(false);
  }, [student.id, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadContext();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadContext]);

  const pendingSosCount = useMemo(
    () => sosAlerts.filter((alert) => !alert.resolved).length,
    [sosAlerts],
  );
  const lastQuestionnaireAt = questionnaires[0]?.submittedAt ?? null;
  const studentAge = formatStudentAge(student.birthDate);

  function getQuestionnaireTypeLabel(type: QuestionnaireRecord["type"]) {
    return q(getQuestionnaireTypeLabelKey(type));
  }

  function getQuestionnairePeriodLabel(questionnaire: QuestionnaireRecord) {
    const period = questionnaire.periodKey?.split(":")[1];

    if (
      (period === "P1" || period === "P2" || period === "P3") &&
      questionnaire.schoolYear
    ) {
      return `${q(getKidmedPeriodLabelKey(period))} - ${questionnaire.schoolYear}`;
    }

    return questionnaire.schoolYear ?? questionnaire.periodKey ?? null;
  }

  function formatPayloadValue(
    key: string,
    value: unknown,
    meta: { unitKey?: string; scaleMax?: number },
  ) {
    if (typeof value === "boolean") {
      return value ? q("yes") : q("no");
    }

    if (typeof value === "number") {
      if (meta.scaleMax) {
        return `${value}/${meta.scaleMax}`;
      }

      if (meta.unitKey) {
        return `${value} ${q(meta.unitKey)}`;
      }

      return String(value);
    }

    if (typeof value === "string") {
      return value;
    }

    return t("notAvailable");
  }

  function getQuestionnaireHighlights(questionnaire: QuestionnaireRecord) {
    return getQuestionnairePreviewItems(questionnaire).map((item) => {
      if (item.key === "classification" && typeof item.value === "string") {
        return {
          key: item.key,
          label: q(item.labelKey),
          value: q(
            getKidmedClassificationLabelKey(item.value as KidmedClassification),
          ),
        };
      }

      if (item.key === "period") {
        return {
          key: item.key,
          label: q(item.labelKey),
          value:
            getQuestionnairePeriodLabel(questionnaire) ?? t("notAvailable"),
        };
      }

      if (item.key === "score" && typeof item.value === "number") {
        return {
          key: item.key,
          label: q(item.labelKey),
          value: `${item.value}/12`,
        };
      }

      return {
        key: item.key,
        label: q(item.labelKey),
        value: formatPayloadValue(item.key, item.value, item),
      };
    });
  }

  return (
    <PageScaffold
      headerProps={{
        title: t("title"),
        description: t("description"),
        meta: student.name,
      }}
      headerActions={
        <Button
          size="sm"
          variant="ghost"
          icon={<RefreshCw className="size-4" />}
          loading={loading}
          onClick={() => void loadContext()}
        >
          {t("refresh")}
        </Button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <PageSection
          tone="primary"
          layout="list"
          title={t("studentContextTitle")}
          description={t("studentContextDescription")}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface-utility p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("studentLabel")}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-navy-900 text-white dark:bg-gold-300 dark:text-navy-950">
                  <UserRound className="size-5" />
                </span>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {student.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[student.className, student.schoolYear]
                      .filter(Boolean)
                      .join(" - ") || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface-utility p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("contextSummary")}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-tiny uppercase tracking-[0.18em] text-muted-foreground">
                    {t("ageLabel")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {studentAge !== null ? `${studentAge} ${t("years")}` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-tiny uppercase tracking-[0.18em] text-muted-foreground">
                    {t("lastQuestionnaire")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatDateTime(lastQuestionnaireAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PageSection>

        <PageSection
          tone="secondary"
          layout="list"
          title={t("signalsTitle")}
          description={t("signalsDescription")}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-danger-300/50 bg-danger-50/50 p-4 dark:border-danger-900/30 dark:bg-danger-950/20">
              <p className="text-xs uppercase tracking-[0.18em] text-danger-700 dark:text-danger-300">
                {t("pendingSos")}
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-danger-700 dark:text-danger-300">
                {pendingSosCount}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("pendingSosDescription")}
              </p>
            </div>
            <div className="rounded-2xl border border-gold-300/50 bg-gold-50/50 p-4 dark:border-gold-900/30 dark:bg-gold-950/20">
              <p className="text-xs uppercase tracking-[0.18em] text-gold-700 dark:text-gold-300">
                {t("questionnairesAvailable")}
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-gold-700 dark:text-gold-300">
                {questionnaires.length}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("questionnairesAvailableDescription")}
              </p>
            </div>
          </div>
        </PageSection>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PageSection
          tone="secondary"
          layout="list"
          title={t("sosHistoryTitle")}
          description={t("sosHistoryDescription")}
        >
          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : sosError ? (
            <EmptyState
              icon={AlertTriangle}
              title={t("sosLoadFailedTitle")}
              description={sosError}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<RefreshCw className="size-4" />}
                  onClick={() => void loadContext()}
                >
                  {t("refresh")}
                </Button>
              }
            />
          ) : sosAlerts.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title={t("emptySosTitle")}
              description={t("emptySosDescription")}
            />
          ) : (
            <StaggerList className="grid gap-3">
              {sosAlerts.map((alert) => (
                <StaggerItem
                  key={alert.id}
                  className="surface-secondary rounded-2xl p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatDateTime(alert.createdAt)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("resolvedAt")}: {formatDateTime(alert.resolvedAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        alert.resolved
                          ? "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-300"
                          : "bg-danger-100 text-danger-700 dark:bg-danger-900/20 dark:text-danger-300"
                      }`}
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

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-surface-utility p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {t("psychLabel")}
                      </p>
                      <p className="mt-1 font-medium text-foreground">
                        {alert.psych}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {alert.psychEmail ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface-utility p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {t("teacherLabel")}
                      </p>
                      <p className="mt-1 font-medium text-foreground">
                        {alert.teacher}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {alert.teacherEmail ?? "-"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground">
                    {t("resolvedBy")}:{" "}
                    {alert.resolvedBy
                      ? (alert.resolvedBy.name ?? alert.resolvedBy.email)
                      : t("notAvailable")}
                  </p>
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </PageSection>

        <PageSection
          tone="secondary"
          layout="list"
          title={t("questionnairesTitle")}
          description={t("questionnairesDescription")}
        >
          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : questionnaireError ? (
            <EmptyState
              icon={BookOpen}
              title={t("questionnairesLoadFailedTitle")}
              description={questionnaireError}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<RefreshCw className="size-4" />}
                  onClick={() => void loadContext()}
                >
                  {t("refresh")}
                </Button>
              }
            />
          ) : questionnaires.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={t("emptyQuestionnairesTitle")}
              description={t("emptyQuestionnairesDescription")}
            />
          ) : (
            <StaggerList className="grid gap-3">
              {questionnaires.map((questionnaire) => {
                const highlights = getQuestionnaireHighlights(questionnaire);

                return (
                  <StaggerItem
                    key={questionnaire.id}
                    className="surface-secondary rounded-2xl p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {getQuestionnaireTypeLabel(questionnaire.type)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(questionnaire.submittedAt)}
                        </p>
                      </div>
                      {questionnaire.type === "KIDMED" ? (
                        <span className="rounded-full border border-border bg-surface-utility px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                          {getQuestionnairePeriodLabel(questionnaire) ??
                            q("kidmed")}
                        </span>
                      ) : (
                        <span className="rounded-full border border-border bg-surface-utility px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                          {t("deferralsUsed", {
                            count: questionnaire.deferredCount,
                          })}
                        </span>
                      )}
                    </div>

                    {highlights.length > 0 ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {highlights.map((item) => (
                          <div
                            key={item.key}
                            className="rounded-xl border border-border bg-surface-utility p-3"
                          >
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              {item.label}
                            </p>
                            <p className="mt-1 text-sm font-medium text-foreground">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">
                        {t("noQuestionnairePreview")}
                      </p>
                    )}
                  </StaggerItem>
                );
              })}
            </StaggerList>
          )}
        </PageSection>
      </div>
    </PageScaffold>
  );
}
