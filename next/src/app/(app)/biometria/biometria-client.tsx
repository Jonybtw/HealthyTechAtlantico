"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Activity,
  ArrowUpDown,
  CheckCircle2,
  History as HistoryIcon,
  Percent,
  Ruler,
  Save,
  Scale,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import type { Sex } from "@prisma/client";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { StudentPicker } from "@/components/ui/student-picker";
import { UnitInput } from "@/components/ui/unit-input";
import { Button } from "@/components/ui/button";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";
import { calcAgeFromBirthDate, classifyBmi, classifyWaist } from "@/lib/zaf";
import { readApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface StudentOption {
  id: string;
  name: string;
  birthDate: string | null;
  sex: Sex;
  age: number | null;
  className?: string | null;
  schoolYear?: string | null;
}

interface Classification {
  imc: number;
  imcZone: string;
  waistZone: string | null;
}

interface BiometricRecord {
  id: string;
  heightM: number;
  weightKg: number;
  waistCm: number | null;
  fatPct: number | null;
  imc: number;
  imcZone: string;
  waistZone: string | null;
  recordedAt: string;
}

interface BiometricRecordResponse {
  id: string;
  heightM: number | string;
  weightKg: number | string;
  waistCm: number | string | null;
  fatPct: number | string | null;
  imc: number | string;
  imcZone: string;
  waistZone: string | null;
  recordedAt: string;
}

const EMPTY_FORM = {
  heightM: "",
  weightKg: "",
  waistCm: "",
  fatPct: "",
};

function toOptionalNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toRequiredNumber(value: number | string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeBiometricRecord(
  record: BiometricRecordResponse,
): BiometricRecord {
  return {
    id: record.id,
    heightM: toRequiredNumber(record.heightM),
    weightKg: toRequiredNumber(record.weightKg),
    waistCm: toOptionalNumber(record.waistCm),
    fatPct: toOptionalNumber(record.fatPct),
    imc: toRequiredNumber(record.imc),
    imcZone: record.imcZone,
    waistZone: record.waistZone,
    recordedAt: record.recordedAt,
  };
}

export default function BiometriaPage() {
  const t = useTranslations("biometria");
  const common = useTranslations("common");
  const locale = useLocale();
  const { role } = useUser();
  const canManageBiometrics = role === "ADMIN" || role === "PROFESSOR";

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [classification, setClassification] = useState<Classification | null>(
    null,
  );
  const [history, setHistory] = useState<BiometricRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickerStudents = useMemo(
    () =>
      students.map((student) => ({
        id: student.id,
        name: student.name,
        className: student.className,
        schoolYear: student.schoolYear,
      })),
    [students],
  );

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === studentId) ?? null,
    [studentId, students],
  );

  const selectedStudentAge = useMemo(() => {
    if (!selectedStudent) {
      return null;
    }

    return selectedStudent.age ?? calcAgeFromBirthDate(selectedStudent.birthDate);
  }, [selectedStudent]);

  const selectedStudentContext = useMemo(
    () =>
      [selectedStudent?.className, selectedStudent?.schoolYear]
        .filter(Boolean)
        .join(" / "),
    [selectedStudent?.className, selectedStudent?.schoolYear],
  );

  const completedMeasurements = useMemo(
    () => Object.values(form).filter(Boolean).length,
    [form],
  );

  const completionPercentage = Math.round((completedMeasurements / 4) * 100);
  const requiredMeasurementsComplete = Boolean(form.heightM && form.weightKg);
  const completionLabel = requiredMeasurementsComplete
    ? t("completionReady")
    : t("completionPending");

  const liveStatusLabel = classification
    ? isHealthyZone(classification.imcZone)
      ? t("statusHealthyShort")
      : t("statusAttentionShort")
    : null;

  const latestRecord = history[0] ?? null;
  const recentHistory = history.slice(0, 4);

  const bmiDelta = useMemo(() => {
    if (!classification || !latestRecord) {
      return null;
    }

    return Math.round((classification.imc - latestRecord.imc) * 10) / 10;
  }, [classification, latestRecord]);

  const loadStudents = useCallback(async (signal?: AbortSignal) => {
    setLoadingStudents(true);
    try {
      const response = await fetch("/api/students?limit=500", { signal });
      if (!response.ok) {
        toast.error(common("studentListLoadError"));
        return;
      }

      const body = await readApiResponse<{ students: StudentOption[] }>(
        response,
      );

      setStudents(
        body.students.map((student) => ({
          id: student.id,
          name: student.name,
          birthDate: student.birthDate ?? null,
          sex: student.sex ?? "M",
          age:
            student.age !== null && student.age !== undefined
              ? Number(student.age)
              : null,
          className: student.className ?? null,
          schoolYear: student.schoolYear ?? null,
        })),
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      toast.error(common("studentListLoadError"));
    } finally {
      if (!signal?.aborted) {
        setLoadingStudents(false);
      }
    }
  }, [common]);

  useEffect(() => {
    const controller = new AbortController();
    void loadStudents(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadStudents]);

  useEffect(() => {
    if (loadingStudents || students.length === 0) {
      return;
    }

    setStudentId((current) => {
      if (current && students.some((student) => student.id === current)) {
        return current;
      }

      return students[0].id;
    });
  }, [loadingStudents, students]);

  useEffect(() => {
    setForm(EMPTY_FORM);
    setClassification(null);
  }, [studentId]);

  useEffect(() => {
    let cancelled = false;

    if (!studentId) {
      setHistory([]);
      setLoadingHistory(false);
      return () => {
        cancelled = true;
      };
    }

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await fetch(`/api/students/${studentId}/biometrics`);
        const records = await readApiResponse<BiometricRecordResponse[]>(
          response,
        );
        if (!cancelled) {
          setHistory(records.map(normalizeBiometricRecord));
        }
      } catch {
        if (!cancelled) {
          setHistory([]);
          toast.error(t("loadConnectionError"));
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [studentId, t]);

  useEffect(() => {
    const height = parseFloat(form.heightM);
    const weight = parseFloat(form.weightKg);

    if (!(height > 0 && weight > 0) || !selectedStudent) {
      setClassification(null);
      return;
    }

    const bmi = weight / (height * height);
    const age = selectedStudentAge ?? 14;
    const imcResult = classifyBmi(bmi, selectedStudent.sex, age);
    const imcZone =
      imcResult?.zone ?? (bmi <= 25 ? t("healthyZone") : t("improvementZone"));

    let waistZone: string | null = null;
    if (form.waistCm) {
      const waistResult = classifyWaist(
        parseFloat(form.waistCm),
        selectedStudent.sex,
        age,
      );
      waistZone = waistResult?.zone ?? null;
    }

    setClassification({
      imc: Math.round(bmi * 10) / 10,
      imcZone,
      waistZone,
    });
  }, [
    form.heightM,
    form.weightKg,
    form.waistCm,
    selectedStudent,
    selectedStudentAge,
    t,
  ]);

  const updateField = (key: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const formatDate = useCallback(
    (value: string) =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value)),
    [locale],
  );

  const formatDateTime = useCallback(
    (value: string) =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value)),
    [locale],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!studentId) {
      toast.error(t("selectStudent"));
      return;
    }

    const height = parseFloat(form.heightM);
    const weight = parseFloat(form.weightKg);
    if (!(height > 0 && weight > 0)) {
      toast.error(t("enterValuesHint"));
      return;
    }

    setSaving(true);

    try {
      const bmi = Math.round((weight / (height * height)) * 10) / 10;
      const age = selectedStudentAge ?? 14;
      const sex = selectedStudent?.sex ?? "M";

      const imcResult = classifyBmi(bmi, sex, age);
      const imcZone =
        imcResult?.zone ??
        (bmi <= 25 ? t("healthyZone") : t("improvementZone"));

      let waistZone: string | undefined;
      if (form.waistCm) {
        const waistResult = classifyWaist(parseFloat(form.waistCm), sex, age);
        waistZone = waistResult?.zone ?? undefined;
      }

      const response = await fetch(`/api/students/${studentId}/biometrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heightM: height,
          weightKg: weight,
          waistCm: form.waistCm ? parseFloat(form.waistCm) : undefined,
          fatPct: form.fatPct ? parseFloat(form.fatPct) : undefined,
          imc: bmi,
          imcZone,
          waistZone,
        }),
      });

      const savedRecord = normalizeBiometricRecord(
        await readApiResponse<BiometricRecordResponse>(response),
      );

      setHistory((current) => [savedRecord, ...current]);
      setForm(EMPTY_FORM);
      setClassification(null);
      toast.success(t("success"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("connectionError"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!canManageBiometrics) {
    return (
      <PageScaffold
        headerProps={{
          eyebrow: t("eyebrow"),
          title: t("title"),
          description: t("description"),
        }}
      >
        <EmptyState
          icon={ShieldAlert}
          title={common("noPermission")}
          description={t("description")}
        />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      className="gap-6"
      headerProps={{
        eyebrow: t("eyebrow"),
        title: t("title"),
        description: t("description"),
      }}
    >
      {loadingStudents ? (
        <BiometriaLoadingState />
      ) : (
        <div className="grid gap-6">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.12fr)_380px]">
            <PageSection
              tone="primary"
              layout="form"
              className="overflow-hidden"
              eyebrow={t("registerCardEyebrow")}
              title={t("registerCardTitle")}
              description={t("registerCardDescription")}
            >
              <div className="rounded-[24px] border border-border bg-surface-secondary p-4 shadow-sm sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
                  <div className="min-w-0">
                    <p className="section-kicker">
                      {t("selectionLabel")}
                    </p>
                    <p className="mt-1 section-copy">
                      {t("selectionHint")}
                    </p>
                    <div className="mt-4">
                      <StudentPicker
                        students={pickerStudents}
                        value={studentId}
                        onChange={setStudentId}
                      />
                    </div>
                  </div>

                  <div className="rounded-[1.3rem] border border-border/60 bg-background/70 px-4 py-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="section-kicker">
                          {t("completionLabel")}
                        </p>
                        <p className="mt-1 text-2xl font-black tracking-[-0.05em] text-foreground">
                          {completedMeasurements}/4
                        </p>
                      </div>
                      <span className="inline-flex rounded-full border border-gold-400/25 bg-gold-400/10 px-2.5 py-1 text-tiny font-semibold text-gold-700 dark:text-gold-200">
                        {t("studentCount", { count: students.length })}
                      </span>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-navy-800 via-navy-700 to-gold-400 transition-all duration-500"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {completionLabel}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-5">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.82fr)]">
                  <MeasurementPanel
                    icon={<Scale className="size-5" />}
                    title={t("requiredMeasurementsTitle")}
                    description={t("requiredMeasurementsDescription")}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <UnitInput
                        label={t("height")}
                        unit="m"
                        value={form.heightM}
                        onChange={updateField("heightM")}
                        placeholder="1.75"
                        step="0.01"
                        min="0.5"
                        max="2.5"
                        icon={<ArrowUpDown className="size-4" />}
                        required
                      />
                      <UnitInput
                        label={t("weight")}
                        unit="kg"
                        value={form.weightKg}
                        onChange={updateField("weightKg")}
                        placeholder="72.5"
                        step="0.1"
                        min="10"
                        max="300"
                        icon={<Scale className="size-4" />}
                        required
                      />
                    </div>
                  </MeasurementPanel>

                  <MeasurementPanel
                    icon={<Activity className="size-5" />}
                    title={t("optionalMeasurementsTitle")}
                    description={t("optionalMeasurementsDescription")}
                  >
                    <div className="grid gap-4">
                      <UnitInput
                        label={t("waist")}
                        unit="cm"
                        value={form.waistCm}
                        onChange={updateField("waistCm")}
                        placeholder="84.0"
                        step="0.1"
                        icon={<Ruler className="size-4" />}
                      />
                      <UnitInput
                        label={t("fat")}
                        unit="%"
                        value={form.fatPct}
                        onChange={updateField("fatPct")}
                        placeholder="18.5"
                        step="0.1"
                        icon={<Percent className="size-4" />}
                      />
                    </div>
                  </MeasurementPanel>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="min-w-0">
                      <p className="section-kicker">
                        {t("classificationTitle")}
                      </p>
                      {classification ? (
                        <>
                          <div className="mt-2 flex flex-wrap items-center gap-2.5">
                            <ZoneBadge zone={classification.imcZone} />
                            {classification.waistZone ? (
                              <ZoneBadge
                                zone={classification.waistZone}
                                size="sm"
                              />
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            {t("saveSupport")}
                          </p>
                        </>
                      ) : (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {t("enterValuesHint")}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                      <span
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold",
                          requiredMeasurementsComplete
                            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                            : "border-white/20 bg-white/55 text-navy-800 dark:border-white/10 dark:bg-white/8 dark:text-navy-100",
                        )}
                      >
                        <CheckCircle2 className="size-4" />
                        {completionLabel}
                      </span>

                      <Button
                        type="submit"
                        loading={saving}
                        icon={<Save className="size-4" />}
                        className="h-12 w-full justify-center text-base lg:w-auto"
                      >
                        {t("save")}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </PageSection>

            <aside className="lg:sticky lg:top-24">
              <div className="surface-secondary rounded-[24px] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="section-kicker">
                      {t("selectedStudentLabel")}
                    </p>
                    <h2 className="mt-1 font-display text-[1.55rem] font-black tracking-[-0.05em] text-foreground">
                      {selectedStudent?.name ?? t("selectedStudentEmpty")}
                    </h2>
                    <p className="mt-2 section-copy">
                      {selectedStudent
                        ? t("studentContextDescription")
                        : t("studentContextEmpty")}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold shadow-sm",
                      selectedStudent
                        ? "border-white/22 bg-white/74 text-navy-900 dark:border-white/10 dark:bg-white/8 dark:text-navy-100"
                        : "border-border/70 bg-background/80 text-muted-foreground",
                    )}
                  >
                    {completedMeasurements}/4
                  </span>
                </div>

                <div className="mt-5 grid gap-3">
                  <MetaRow
                    label={t("classLabel")}
                    value={selectedStudentContext || common("noData")}
                  />
                  <MetaRow
                    label={t("ageLabel")}
                    value={
                      selectedStudentAge !== null
                        ? String(selectedStudentAge)
                        : common("noData")
                    }
                  />
                  <MetaRow
                    label={t("sexLabel")}
                    value={
                      selectedStudent
                        ? selectedStudent.sex === "F"
                          ? t("sexFemale")
                          : t("sexMale")
                        : common("noData")
                    }
                  />
                </div>

                <div className="my-5 h-px bg-border/60" />

                <div className="space-y-4">
                  <div className="rounded-[1.35rem] border border-border/60 bg-background/55 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="section-kicker">
                          {t("currentReadTitle")}
                        </p>
                        <p className="mt-1 section-copy">
                          {t("currentReadDescription")}
                        </p>
                      </div>
                      {liveStatusLabel ? (
                        <span className="inline-flex items-center rounded-full border border-gold-400/20 bg-gold-400/10 px-2.5 py-1 text-tiny font-semibold uppercase tracking-[0.16em] text-gold-700 dark:text-gold-200">
                          {liveStatusLabel}
                        </span>
                      ) : null}
                    </div>

                    {classification ? (
                      <div className="mt-4">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <p className="text-[3rem] font-black leading-none tracking-[-0.06em] text-foreground">
                              {classification.imc.toFixed(1)}
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {bmiDelta !== null
                                ? `${t("deltaFromLatest")}: ${formatDelta(
                                    bmiDelta,
                                  )}`
                                : latestRecord
                                  ? t("lastRecordedAt", {
                                      date: formatDateTime(latestRecord.recordedAt),
                                    })
                                  : t("latestRecordEmpty")}
                            </p>
                          </div>

                          <div className="flex flex-col items-start gap-2 sm:items-end">
                            <ZoneBadge zone={classification.imcZone} />
                            {classification.waistZone ? (
                              <ZoneBadge
                                zone={classification.waistZone}
                                size="sm"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-muted-foreground">
                                {t("waistPending")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <FocusEmptyState icon={Activity}>
                        {t("enterValuesHint")}
                      </FocusEmptyState>
                    )}
                  </div>

                  <div className="rounded-[1.35rem] border border-border/60 bg-background/55 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="section-kicker">
                          {t("latestRecordTitle")}
                        </p>
                        {latestRecord ? (
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {t("lastRecordedAt", {
                              date: formatDateTime(latestRecord.recordedAt),
                            })}
                          </p>
                        ) : null}
                      </div>
                      <span className="flex size-9 items-center justify-center rounded-xl border border-white/22 bg-white/74 text-navy-900 shadow-sm dark:border-white/10 dark:bg-white/8 dark:text-navy-100">
                        <UserRound className="size-4" />
                      </span>
                    </div>

                    {loadingHistory ? (
                      <div className="mt-4 grid gap-3">
                        <Skeleton className="h-12 rounded-xl" />
                        <Skeleton className="h-12 rounded-xl" />
                        <Skeleton className="h-12 rounded-xl" />
                      </div>
                    ) : latestRecord ? (
                      <div className="mt-4 grid gap-3">
                        <MetaRow
                          label={t("bmi")}
                          value={latestRecord.imc.toFixed(1)}
                        />
                        <MetaRow
                          label={t("weight")}
                          value={`${latestRecord.weightKg.toFixed(1)} kg`}
                        />
                        <MetaRow
                          label={t("height")}
                          value={`${latestRecord.heightM.toFixed(2)} m`}
                        />
                      </div>
                    ) : (
                      <FocusEmptyState icon={HistoryIcon}>
                        {selectedStudent
                          ? t("latestRecordEmpty")
                          : t("studentContextEmpty")}
                      </FocusEmptyState>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(280px,0.82fr)]">
            <PageSection
              tone="utility"
              layout="list"
              eyebrow={t("historyDescription")}
              title={t("historyTitle")}
              description={t("historyDescription")}
              actions={
                selectedStudent && history.length > 0 ? (
                  <span className="inline-flex rounded-full border border-white/22 bg-white/74 px-3 py-1 text-tiny font-semibold uppercase tracking-[0.16em] text-navy-800 shadow-sm dark:border-white/10 dark:bg-white/8 dark:text-navy-100">
                    {history.length}
                  </span>
                ) : null
              }
            >
              {!selectedStudent ? (
                <FocusEmptyState icon={HistoryIcon}>
                  {t("noStudentHistorySelected")}
                </FocusEmptyState>
              ) : loadingHistory ? (
                <div className="grid gap-3">
                  {[1, 2, 3].map((item) => (
                    <Skeleton key={item} className="h-20 rounded-[24px]" />
                  ))}
                </div>
              ) : recentHistory.length > 0 ? (
                <div className="grid gap-3">
                  {recentHistory.map((record, index) => (
                    <HistoryRow
                      key={record.id}
                      record={record}
                      current={index === 0}
                      dateLabel={formatDate(record.recordedAt)}
                      bmiLabel={t("bmi")}
                      waistLabel={t("waist")}
                      fatLabel={t("fat")}
                    />
                  ))}
                </div>
              ) : (
                <FocusEmptyState icon={HistoryIcon}>
                  {t("historyEmptySelected")}
                </FocusEmptyState>
              )}
            </PageSection>

            <PageSection
              tone="utility"
              layout="list"
              eyebrow={t("referenceDescription")}
              title={t("referenceTitle")}
              description={t("referenceDescription")}
            >
              <ReferenceRow
                tone="success"
                title={t("healthyZone")}
                description={t("referenceHealthySummary")}
              />
              <ReferenceRow
                tone="warning"
                title={t("improvementZone")}
                description={t("referenceImprovementSummary")}
              />
              <ReferenceRow
                tone="danger"
                title={t("referenceRiskLabel")}
                description={t("referenceRiskSummary")}
              />
            </PageSection>
          </div>
        </div>
      )}
    </PageScaffold>
  );
}

function BiometriaLoadingState() {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.12fr)_380px]">
        <PageSection tone="primary" layout="form" contentClassName="gap-5">
          <Skeleton className="h-32 rounded-[1.5rem]" />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.82fr)]">
            <Skeleton className="h-52 rounded-[1.5rem]" />
            <Skeleton className="h-52 rounded-[1.5rem]" />
          </div>
          <Skeleton className="h-28 rounded-[1.5rem]" />
        </PageSection>

        <Skeleton className="h-[540px] rounded-[24px]" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(280px,0.82fr)]">
        <Skeleton className="h-72 rounded-[24px]" />
        <Skeleton className="h-72 rounded-[24px]" />
      </div>
    </div>
  );
}

function MeasurementPanel({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-border bg-surface-secondary p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-11 items-center justify-center rounded-[24px] bg-surface-utility text-foreground shadow-sm">
          {icon}
        </span>
        <div>
          <h3 className="text-base font-semibold tracking-[-0.03em] text-foreground">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[24px] border border-border/70 bg-background/65 px-4 py-3 shadow-sm">
      <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}

function FocusEmptyState({
  icon: Icon,
  children,
}: {
  icon: typeof Activity;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-border/60 bg-background/40 px-4 py-7 text-center">
      <Icon className="mx-auto size-7 text-muted-foreground/40" />
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

function HistoryRow({
  record,
  current,
  dateLabel,
  bmiLabel,
  waistLabel,
  fatLabel,
}: {
  record: BiometricRecord;
  current: boolean;
  dateLabel: string;
  bmiLabel: string;
  waistLabel: string;
  fatLabel: string;
}) {
  const details = [
    `${record.heightM.toFixed(2)} m`,
    `${record.weightKg.toFixed(1)} kg`,
    record.waistCm !== null ? `${waistLabel}: ${record.waistCm} cm` : null,
    record.fatPct !== null ? `${fatLabel}: ${record.fatPct}%` : null,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div
      className={cn(
        "grid gap-3 rounded-[1.35rem] border px-4 py-4 shadow-sm sm:grid-cols-[132px_minmax(0,1fr)_auto] sm:items-center",
        current
          ? "border-gold-300/45 bg-white/82 dark:border-gold-400/25 dark:bg-white/8"
          : "border-border/70 bg-background/62",
      )}
    >
      <div>
        <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {dateLabel}
        </p>
      </div>

      <div className="min-w-0">
        <p className="text-xl font-black tracking-[-0.04em] text-foreground">
          {record.imc.toFixed(1)}
          <span className="ml-1 text-sm font-semibold text-muted-foreground">{bmiLabel}</span>
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {details}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <ZoneBadge zone={record.imcZone} size="sm" />
        {record.waistZone ? <ZoneBadge zone={record.waistZone} size="sm" /> : null}
      </div>
    </div>
  );
}

function ReferenceRow({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "bg-success-500"
      : tone === "warning"
        ? "bg-warning-500"
        : "bg-danger-500";

  return (
    <div className="rounded-[24px] border border-border/70 bg-background/65 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={cn("size-2.5 rounded-full", toneClass)} />
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function isHealthyZone(zone: string) {
  const normalizedZone = zone
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return (
    normalizedZone.includes("saudavel") ||
    normalizedZone.includes("healthy") ||
    normalizedZone.includes("zsaf")
  );
}

function formatDelta(value: number) {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${Math.abs(value).toFixed(1)}`;
}
