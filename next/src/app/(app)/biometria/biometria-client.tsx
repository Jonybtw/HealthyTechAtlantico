"use client";

// Componente cliente de /biometria: seleciona aluno, calcula campos derivados
// e grava medições biométricas através da API do aluno.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Sex } from "@prisma/client";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { StudentPicker } from "@/components/ui/student-picker";
import { UnitInput } from "@/components/ui/unit-input";
import { Button } from "@/components/ui/button";
import {
  ChartFrame,
  ResponsiveChartContainer,
} from "@/components/ui/chart-frame";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";
import { calcAgeFromBirthDate, classifyBmi, classifyWaist } from "@/lib/zaf";
import { readApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useReducedEffects } from "@/hooks/use-reduced-effects";
import { useSyncStatus } from "@/hooks/use-sync-status";

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
  notes: "",
};

function toOptionalNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toRequiredNumber(value: number | string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeBiometricRecord(record: BiometricRecordResponse): BiometricRecord {
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

function isHealthyZone(zone: string) {
  const n = zone.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return n.includes("saudavel") || n.includes("healthy") || n.includes("zsaf");
}

function formatDelta(value: number) {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${Math.abs(value).toFixed(1)}`;
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
    const duration = 620;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
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

export default function BiometriaPage() {
  const t = useTranslations("biometria");
  const common = useTranslations("common");
  const locale = useLocale();
  const { role } = useUser();
  const reducedEffects = useReducedEffects();
  const canManageBiometrics = role === "ADMIN" || role === "PROFESSOR";
  const { isOnline, addDraft } = useSyncStatus();

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [classification, setClassification] = useState<Classification | null>(null);
  const [history, setHistory] = useState<BiometricRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickerStudents = useMemo(
    () => students.map((s) => ({ id: s.id, name: s.name, className: s.className, schoolYear: s.schoolYear })),
    [students],
  );

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === studentId) ?? null,
    [studentId, students],
  );

  const selectedStudentAge = useMemo(() => {
    if (!selectedStudent) return null;
    return selectedStudent.age ?? calcAgeFromBirthDate(selectedStudent.birthDate);
  }, [selectedStudent]);

  const selectedStudentContext = useMemo(
    () => [selectedStudent?.className, selectedStudent?.schoolYear].filter(Boolean).join(" / "),
    [selectedStudent?.className, selectedStudent?.schoolYear],
  );

  const completedMeasurements = useMemo(() => Object.values(form).filter(Boolean).length, [form]);
  const completionPercentage = Math.round((completedMeasurements / 4) * 100);
  const requiredMeasurementsComplete = Boolean(form.heightM && form.weightKg);
  const latestRecord = history[0] ?? null;
  const recentHistory = history.slice(0, 6);

  const bmiDelta = useMemo(() => {
    if (!classification || !latestRecord) return null;
    return Math.round((classification.imc - latestRecord.imc) * 10) / 10;
  }, [classification, latestRecord]);

  const liveStatusLabel = classification
    ? isHealthyZone(classification.imcZone)
      ? t("statusHealthyShort")
      : t("statusAttentionShort")
    : null;

  const loadStudents = useCallback(async (signal?: AbortSignal) => {
    setLoadingStudents(true);
    try {
      const response = await fetch("/api/students?limit=500", { signal });
      if (!response.ok) { toast.error(common("studentListLoadError")); return; }
      const body = await readApiResponse<{ students: StudentOption[] }>(response);
      setStudents(
        body.students.map((s) => ({
          id: s.id,
          name: s.name,
          birthDate: s.birthDate ?? null,
          sex: s.sex ?? "M",
          age: s.age !== null && s.age !== undefined ? Number(s.age) : null,
          className: s.className ?? null,
          schoolYear: s.schoolYear ?? null,
        })),
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(common("studentListLoadError"));
    } finally {
      if (!signal?.aborted) setLoadingStudents(false);
    }
  }, [common]);

  useEffect(() => {
    const controller = new AbortController();
    void loadStudents(controller.signal);
    return () => controller.abort();
  }, [loadStudents]);

  useEffect(() => {
    if (loadingStudents || students.length === 0) return;
    setStudentId((current) => {
      if (current && students.some((s) => s.id === current)) return current;
      return students[0].id;
    });
  }, [loadingStudents, students]);

  useEffect(() => {
    setForm(EMPTY_FORM);
    setClassification(null);
  }, [studentId]);

  useEffect(() => {
    let cancelled = false;
    if (!studentId) { setHistory([]); setLoadingHistory(false); return () => { cancelled = true; }; }

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await fetch(`/api/students/${studentId}/biometrics`);
        const records = await readApiResponse<BiometricRecordResponse[]>(response);
        if (!cancelled) setHistory(records.map(normalizeBiometricRecord));
      } catch {
        if (!cancelled) { setHistory([]); toast.error(t("loadConnectionError")); }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };

    void loadHistory();
    return () => { cancelled = true; };
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
    const imcZone = imcResult?.zone ?? (bmi <= 25 ? t("healthyZone") : t("improvementZone"));

    let waistZone: string | null = null;
    if (form.waistCm) {
      const waistResult = classifyWaist(parseFloat(form.waistCm), selectedStudent.sex, age);
      waistZone = waistResult?.zone ?? null;
    }

    setClassification({ imc: Math.round(bmi * 10) / 10, imcZone, waistZone });
  }, [form.heightM, form.weightKg, form.waistCm, selectedStudent, selectedStudentAge, t]);

  const updateField = (key: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((c) => ({ ...c, [key]: value }));

  const formatDate = useCallback(
    (value: string) =>
      new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)),
    [locale],
  );

  const formatDateTime = useCallback(
    (value: string) =>
      new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)),
    [locale],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!studentId) { toast.error(t("selectStudent")); return; }
    const height = parseFloat(form.heightM);
    const weight = parseFloat(form.weightKg);
    if (!(height > 0 && weight > 0)) { toast.error(t("enterValuesHint")); return; }

    const bmi = Math.round((weight / (height * height)) * 10) / 10;
    const age = selectedStudentAge ?? 14;
    const sex = selectedStudent?.sex ?? "M";
    const imcResult = classifyBmi(bmi, sex, age);
    const imcZone = imcResult?.zone ?? (bmi <= 25 ? t("healthyZone") : t("improvementZone"));
    let waistZone: string | undefined;
    if (form.waistCm) {
      const waistResult = classifyWaist(parseFloat(form.waistCm), sex, age);
      waistZone = waistResult?.zone ?? undefined;
    }

    const payload = {
      heightM: height,
      weightKg: weight,
      waistCm: form.waistCm ? parseFloat(form.waistCm) : undefined,
      fatPct: form.fatPct ? parseFloat(form.fatPct) : undefined,
      imc: bmi,
      imcZone,
      waistZone,
      notes: form.notes.trim() || undefined,
    };

    if (!isOnline) {
      addDraft({ type: "biometric", studentId, payload });
      setForm(EMPTY_FORM);
      setClassification(null);
      toast.info(t("draftSaved"));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/students/${studentId}/biometrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const savedRecord = normalizeBiometricRecord(await readApiResponse<BiometricRecordResponse>(response));
      setHistory((c) => [savedRecord, ...c]);
      setForm(EMPTY_FORM);
      setClassification(null);
      toast.success(t("success"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("connectionError"));
    } finally {
      setSaving(false);
    }
  };

  if (!canManageBiometrics) {
    return (
      <PageScaffold headerProps={{ eyebrow: t("eyebrow"), title: t("title"), description: t("description") }}>
        <EmptyState icon={ShieldAlert} title={common("noPermission")} description={t("description")} />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      className="gap-6"
      headerProps={{ eyebrow: t("eyebrow"), title: t("title"), description: t("description") }}
    >
      {loadingStudents ? (
        <BiometriaLoadingState />
      ) : (
        <BiometriaContent
          bmiDelta={bmiDelta}
          classification={classification}
          completedMeasurements={completedMeasurements}
          completionPercentage={completionPercentage}
          form={form}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          handleSubmit={handleSubmit}
          history={history}
          latestRecord={latestRecord}
          loadingHistory={loadingHistory}
          liveStatusLabel={liveStatusLabel}
          locale={locale}
          pickerStudents={pickerStudents}
          recentHistory={recentHistory}
          reducedEffects={reducedEffects}
          requiredMeasurementsComplete={requiredMeasurementsComplete}
          saving={saving}
          selectedStudent={selectedStudent}
          selectedStudentAge={selectedStudentAge}
          selectedStudentContext={selectedStudentContext}
          setStudentId={setStudentId}
          students={students}
          updateField={updateField}
        />
      )}
    </PageScaffold>
  );
}

interface BiometriaContentProps {
  bmiDelta: number | null;
  classification: Classification | null;
  completedMeasurements: number;
  completionPercentage: number;
  form: typeof EMPTY_FORM;
  formatDate: (v: string) => string;
  formatDateTime: (v: string) => string;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  history: BiometricRecord[];
  latestRecord: BiometricRecord | null;
  loadingHistory: boolean;
  liveStatusLabel: string | null;
  locale: string;
  pickerStudents: { id: string; name: string; className?: string | null; schoolYear?: string | null }[];
  recentHistory: BiometricRecord[];
  reducedEffects: boolean;
  requiredMeasurementsComplete: boolean;
  saving: boolean;
  selectedStudent: StudentOption | null;
  selectedStudentAge: number | null;
  selectedStudentContext: string;
  setStudentId: (id: string | null) => void;
  students: StudentOption[];
  updateField: (key: keyof typeof EMPTY_FORM) => (value: string) => void;
}

function BiometriaContent({
  bmiDelta,
  classification,
  completedMeasurements,
  completionPercentage,
  form,
  formatDate,
  formatDateTime,
  handleSubmit,
  history,
  latestRecord,
  loadingHistory,
  liveStatusLabel,
  locale,
  pickerStudents,
  recentHistory,
  reducedEffects,
  requiredMeasurementsComplete,
  saving,
  selectedStudent,
  selectedStudentAge,
  selectedStudentContext,
  setStudentId,
  students,
  updateField,
}: BiometriaContentProps) {
  const t = useTranslations("biometria");
  const common = useTranslations("common");
  const animatedStudents = useAnimatedNumber(students.length, reducedEffects);
  const animatedHistory = useAnimatedNumber(history.length, reducedEffects);
  const animatedBmi = classification?.imc ?? latestRecord?.imc ?? 0;
  const displayBmi = useAnimatedNumber(Math.round((animatedBmi) * 10), reducedEffects) / 10;

  const chartData = useMemo(
    () =>
      [...history]
        .reverse()
        .map((r) => ({
          imc: r.imc,
          label: new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "pt-PT", { month: "short", year: "2-digit" }).format(new Date(r.recordedAt)),
        })),
    [history, locale],
  );

  return (
    <div className="grid gap-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiPanel
          index={0}
          reducedEffects={reducedEffects}
          icon={<Users className="size-[18px]" />}
          iconClass="bg-navy-100 text-navy-700 dark:bg-white/8 dark:text-navy-100"
          label={t("selectionLabel")}
          value={String(animatedStudents)}
          footer={t("studentCount", { count: students.length })}
          footerIcon={<Users className="size-3 shrink-0" />}
        />
        <KpiPanel
          index={1}
          reducedEffects={reducedEffects}
          icon={<Scale className="size-[18px]" />}
          iconClass="bg-gold-100 text-gold-700 dark:bg-gold-300/12 dark:text-gold-200"
          label={t("completionLabel")}
          value={`${completedMeasurements}/4`}
          footer={
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-navy-800 to-gold-400 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          }
          footerProgress
        />
        <KpiPanel
          index={2}
          reducedEffects={reducedEffects}
          icon={<Activity className="size-[18px]" />}
          iconClass="bg-success-100 text-success-700 dark:bg-success-300/12 dark:text-success-200"
          label={t("bmi")}
          value={animatedBmi > 0 ? displayBmi.toFixed(1) : "—"}
          footer={
            classification
              ? liveStatusLabel ?? ""
              : latestRecord
                ? t("lastRecordedAt", { date: formatDateTime(latestRecord.recordedAt) })
                : t("latestRecordEmpty")
          }
          footerIcon={<TrendingUp className="size-3 shrink-0" />}
        />
        <KpiPanel
          index={3}
          reducedEffects={reducedEffects}
          icon={<HistoryIcon className="size-[18px]" />}
          iconClass="bg-navy-100 text-navy-700 dark:bg-white/8 dark:text-navy-100"
          label={t("historyTitle")}
          value={String(animatedHistory)}
          footer={selectedStudent ? selectedStudent.name : t("selectedStudentEmpty")}
          footerIcon={<UserRound className="size-3 shrink-0" />}
        />
      </div>

      {/* Main Grid: Form + Sidebar */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_360px]">
        {/* Form Panel */}
        <BioPanel index={4} reducedEffects={reducedEffects} className="p-5 sm:p-6">
          {/* Student Picker */}
          <div className="mb-5 rounded-[12px] border border-border/70 bg-background/55 p-4">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <p className="label-micro text-muted-foreground">
                  {t("selectionLabel")}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t("selectionHint")}
                </p>
                <div className="mt-3">
                  <StudentPicker students={pickerStudents} value={selectedStudent?.id ?? null} onChange={setStudentId} />
                </div>
              </div>
              {selectedStudentContext && (
                <span className="inline-flex rounded-full border border-gold-400/25 bg-gold-400/10 px-2.5 py-1 text-tiny font-semibold text-gold-700 dark:text-gold-200 whitespace-nowrap">
                  {selectedStudentContext}
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-4 xl:grid-cols-2">
              {/* Required */}
              <div className="rounded-[12px] border border-border/70 bg-background/55 p-4">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-[12px] border border-border/60 bg-surface-utility text-foreground shadow-sm">
                    <Scale className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t("requiredMeasurementsTitle")}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{t("requiredMeasurementsDescription")}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <UnitInput label={t("height")} unit="m" value={form.heightM} onChange={updateField("heightM")} placeholder="1.75" step="0.01" min="0.5" max="2.5" icon={<ArrowUpDown className="size-4" />} required />
                  <UnitInput label={t("weight")} unit="kg" value={form.weightKg} onChange={updateField("weightKg")} placeholder="72.5" step="0.1" min="10" max="300" icon={<Scale className="size-4" />} required />
                </div>
              </div>

              {/* Optional */}
              <div className="rounded-[12px] border border-border/70 bg-background/55 p-4">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-[12px] border border-border/60 bg-surface-utility text-foreground shadow-sm">
                    <Activity className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t("optionalMeasurementsTitle")}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{t("optionalMeasurementsDescription")}</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  <UnitInput label={t("waist")} unit="cm" value={form.waistCm} onChange={updateField("waistCm")} placeholder="84.0" step="0.1" icon={<Ruler className="size-4" />} />
                  <UnitInput label={t("fat")} unit="%" value={form.fatPct} onChange={updateField("fatPct")} placeholder="18.5" step="0.1" icon={<Percent className="size-4" />} />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-1.5">
              <p className="label-micro text-muted-foreground">
                {t("notesTitle")}
              </p>
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes")(e.target.value)}
                placeholder={t("notesPlaceholder")}
                rows={3}
                maxLength={1000}
                className="w-full resize-none rounded-[8px] border border-border/70 bg-background/55 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-colors duration-200 focus:border-gold-500/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-gold-400/12 dark:bg-white/4 dark:placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Classification + Submit */}
            <div className="rounded-[12px] border border-border/70 bg-background/55 p-4">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="label-micro text-muted-foreground">
                    {t("classificationTitle")}
                  </p>
                  {classification ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <ZoneBadge zone={classification.imcZone} />
                      {classification.waistZone ? <ZoneBadge zone={classification.waistZone} size="sm" /> : null}
                    </div>
                  ) : (
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t("enterValuesHint")}</p>
                  )}
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold",
                      requiredMeasurementsComplete
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                        : "border-white/20 bg-white/55 text-navy-800 dark:border-white/10 dark:bg-white/8 dark:text-navy-100",
                    )}
                  >
                    <CheckCircle2 className="size-4" />
                    {requiredMeasurementsComplete ? t("completionReady") : t("completionPending")}
                  </span>
                  <Button
                    type="submit"
                    loading={saving}
                    icon={<Save className="size-4" />}
                    className="h-11 w-full justify-center sm:w-auto"
                  >
                    {t("save")}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </BioPanel>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 grid gap-4">
          {/* Student info */}
          <BioPanel index={5} reducedEffects={reducedEffects} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="label-micro text-muted-foreground">
                  {t("selectedStudentLabel")}
                </p>
                <h2 className="mt-1 font-display text-[1.4rem] font-black tracking-[-0.05em] text-foreground truncate">
                  {selectedStudent?.name ?? t("selectedStudentEmpty")}
                </h2>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-white/22 bg-white/74 text-navy-900 shadow-sm dark:border-white/10 dark:bg-white/8 dark:text-navy-100">
                <UserRound className="size-4" />
              </span>
            </div>

            {selectedStudent ? (
              <div className="mt-4 grid gap-2">
                <MetaRow label={t("classLabel")} value={selectedStudentContext || common("noData")} />
                <MetaRow label={t("ageLabel")} value={selectedStudentAge !== null ? String(selectedStudentAge) : common("noData")} />
                <MetaRow label={t("sexLabel")} value={selectedStudent.sex === "F" ? t("sexFemale") : t("sexMale")} />
              </div>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("studentContextEmpty")}</p>
            )}
          </BioPanel>

          {/* Live classification */}
          <BioPanel index={6} reducedEffects={reducedEffects} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="label-micro text-muted-foreground">
                  {t("currentReadTitle")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("currentReadDescription")}</p>
              </div>
              {liveStatusLabel ? (
                <span className="inline-flex items-center rounded-full border border-gold-400/20 bg-gold-400/10 px-2.5 py-1 label-micro text-gold-700 dark:text-gold-200">
                  {liveStatusLabel}
                </span>
              ) : null}
            </div>

            {classification ? (
              <div className="mt-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[2.6rem] font-black leading-none tracking-[-0.06em] text-foreground">
                      {classification.imc.toFixed(1)}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {bmiDelta !== null
                        ? `${t("deltaFromLatest")}: ${formatDelta(bmiDelta)}`
                        : latestRecord
                          ? t("lastRecordedAt", { date: formatDateTime(latestRecord.recordedAt) })
                          : t("latestRecordEmpty")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <ZoneBadge zone={classification.imcZone} />
                    {classification.waistZone ? <ZoneBadge zone={classification.waistZone} size="sm" /> : (
                      <span className="text-xs font-semibold text-muted-foreground">{t("waistPending")}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <InlineFocusEmpty icon={Activity}>{t("enterValuesHint")}</InlineFocusEmpty>
            )}
          </BioPanel>

          {/* Last record */}
          <BioPanel index={7} reducedEffects={reducedEffects} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="label-micro text-muted-foreground">
                  {t("latestRecordTitle")}
                </p>
                {latestRecord ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("lastRecordedAt", { date: formatDateTime(latestRecord.recordedAt) })}
                  </p>
                ) : null}
              </div>
            </div>

            {loadingHistory ? (
              <div className="mt-3 grid gap-2">
                <Skeleton className="h-10 rounded-[8px]" />
                <Skeleton className="h-10 rounded-[8px]" />
                <Skeleton className="h-10 rounded-[8px]" />
              </div>
            ) : latestRecord ? (
              <div className="mt-3 grid gap-2">
                <MetaRow label={t("bmi")} value={latestRecord.imc.toFixed(1)} />
                <MetaRow label={t("weight")} value={`${latestRecord.weightKg.toFixed(1)} kg`} />
                <MetaRow label={t("height")} value={`${latestRecord.heightM.toFixed(2)} m`} />
              </div>
            ) : (
              <InlineFocusEmpty icon={HistoryIcon}>
                {selectedStudent ? t("latestRecordEmpty") : t("studentContextEmpty")}
              </InlineFocusEmpty>
            )}
          </BioPanel>
        </aside>
      </div>

      {/* Bottom Row: Chart + History */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,1fr)]">
        {/* BMI Trend Chart */}
        <BioPanel index={8} reducedEffects={reducedEffects} className="p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="label-micro text-muted-foreground">
                {t("historyTitle")}
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground">
                {selectedStudent?.name ?? t("selectedStudentEmpty")}
              </h3>
            </div>
            {history.length > 0 && (
              <span className="inline-flex rounded-full border border-white/22 bg-white/74 px-2.5 py-1 label-micro text-navy-800 shadow-sm dark:border-white/10 dark:bg-white/8 dark:text-navy-100">
                {history.length}
              </span>
            )}
          </div>

          <ChartFrame className="h-[220px] min-w-0">
            {chartData.length > 1 ? (
              <ResponsiveChartContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ bottom: 4, left: 8, right: 12, top: 8 }}>
                  <defs>
                    <linearGradient id="bmiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b88c19" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#b88c19" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="currentColor" strokeDasharray="0" vertical={false} className="text-muted-foreground/18" />
                  <XAxis axisLine={false} dataKey="label" minTickGap={16} tick={{ fill: "currentColor", fontSize: 11 }} tickLine={false} className="text-muted-foreground" />
                  <YAxis axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: "currentColor", fontSize: 11 }} tickFormatter={(v) => Number(v).toFixed(1)} tickLine={false} width={42} className="text-muted-foreground" />
                  <Tooltip
                    animationDuration={0}
                    content={({ active, payload, label: lbl }) => {
                      if (!active || !payload?.length) return null;
                      const val = payload[0]?.value as number | undefined;
                      if (val === undefined) return null;
                      return (
                        <div className="min-w-[160px] rounded-[12px] border border-navy-200/70 bg-[#fffdf8]/92 px-4 py-3 text-sm shadow-[0_4px_12px_rgba(9,21,35,0.08)] ring-1 ring-white/70 backdrop-blur-sm dark:border-white/14 dark:bg-navy-950/90 dark:shadow-[0_4px_12px_rgba(9,21,35,0.08)] dark:ring-white/6">
                          <p className="mb-2 text-base font-extrabold leading-tight tracking-tight text-navy-950 dark:text-white">{lbl}</p>
                          <div className="flex items-center justify-between gap-5">
                            <span className="inline-flex items-center gap-2 font-semibold text-muted-foreground">
                              <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: "#b88c19" }} />
                              <span>{t("bmi")}</span>
                            </span>
                            <span className="shrink-0 font-bold text-foreground">{val.toFixed(1)}</span>
                          </div>
                        </div>
                      );
                    }}
                    cursor={{ stroke: "#b88c19", strokeWidth: 1, strokeDasharray: "4 4" }}
                    wrapperStyle={{ outline: "none", pointerEvents: "none", transition: "none" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="imc"
                    stroke="#b88c19"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="url(#bmiGrad)"
                    dot={{ fill: "var(--color-card)", r: 4, stroke: "#b88c19", strokeWidth: 2 }}
                    isAnimationActive={!reducedEffects}
                  />
                </AreaChart>
              </ResponsiveChartContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[12px] border border-dashed border-border bg-background/45 px-4 text-center text-sm text-muted-foreground">
                {!selectedStudent
                  ? t("noStudentHistorySelected")
                  : loadingHistory
                    ? t("historyDescription")
                    : t("historyEmptySelected")}
              </div>
            )}
          </ChartFrame>
        </BioPanel>

        {/* History List */}
        <BioPanel index={9} reducedEffects={reducedEffects} className="p-5 sm:p-6">
          <div className="mb-4">
            <p className="label-micro text-muted-foreground">
              {t("historyDescription")}
            </p>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground">
              {t("historyTitle")}
            </h3>
          </div>

          {!selectedStudent ? (
            <InlineFocusEmpty icon={HistoryIcon}>{t("noStudentHistorySelected")}</InlineFocusEmpty>
          ) : loadingHistory ? (
            <div className="grid gap-2.5">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-[12px]" />)}
            </div>
          ) : recentHistory.length > 0 ? (
            <div className="grid gap-2.5">
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
            <InlineFocusEmpty icon={HistoryIcon}>{t("historyEmptySelected")}</InlineFocusEmpty>
          )}
        </BioPanel>
      </div>
    </div>
  );
}

function BiometriaLoadingState() {
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[120px] rounded-[12px]" />)}
      </div>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_360px]">
        <Skeleton className="h-[420px] rounded-[12px]" />
        <div className="grid gap-4">
          <Skeleton className="h-[140px] rounded-[12px]" />
          <Skeleton className="h-[160px] rounded-[12px]" />
          <Skeleton className="h-[140px] rounded-[12px]" />
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,1fr)]">
        <Skeleton className="h-[320px] rounded-[12px]" />
        <Skeleton className="h-[320px] rounded-[12px]" />
      </div>
    </div>
  );
}

function BioPanel({
  children,
  className,
  index,
  reducedEffects,
}: {
  children: React.ReactNode;
  className?: string;
  index: number;
  reducedEffects: boolean;
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

function KpiPanel({
  index,
  reducedEffects,
  icon,
  iconClass,
  label,
  value,
  footer,
  footerIcon,
  footerProgress,
}: {
  index: number;
  reducedEffects: boolean;
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
  footer?: React.ReactNode;
  footerIcon?: React.ReactNode;
  footerProgress?: boolean;
}) {
  return (
    <BioPanel
      index={index}
      reducedEffects={reducedEffects}
      className="group h-full min-h-[120px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(9,21,35,0.12)] dark:hover:shadow-[0_10px_28px_rgba(0,0,0,0.34)]"
    >
      <div className="flex h-full min-h-[120px] flex-col p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-[12px] transition-transform duration-300 group-hover:scale-105", iconClass)}>
            {icon}
          </span>
        </div>
        <p className="text-4xl font-extrabold tracking-tight text-foreground">{value}</p>
        {footerProgress ? (
          typeof footer !== "string" ? footer : null
        ) : (
          <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-semibold text-muted-foreground">
            {footerIcon}
            <span className="truncate">{footer}</span>
          </span>
        )}
      </div>
    </BioPanel>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-border/70 bg-background/65 px-3.5 py-2.5 shadow-sm">
      <span className="label-micro text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function InlineFocusEmpty({ icon: Icon, children }: { icon: typeof Activity; children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-[12px] border border-dashed border-border/60 bg-background/40 px-4 py-6 text-center">
      <Icon className="mx-auto size-6 text-muted-foreground/40" />
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
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
    .join(" · ");

  return (
    <div
      className={cn(
        "grid gap-2 rounded-[12px] border px-3.5 py-3 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center",
        current
          ? "border-gold-300/45 bg-white/82 dark:border-gold-400/25 dark:bg-white/8"
          : "border-border/70 bg-background/62",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-base font-black tracking-[-0.04em] text-foreground">
            {record.imc.toFixed(1)}
            <span className="ml-1 text-xs font-semibold text-muted-foreground">{bmiLabel}</span>
          </p>
          {current && (
            <span className="rounded-full border border-gold-400/25 bg-gold-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-gold-700 dark:text-gold-200">
              ↑ atual
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{details}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 sm:flex-col sm:items-end">
        <p className="label-micro text-muted-foreground">{dateLabel}</p>
        <div className="flex flex-wrap gap-1">
          <ZoneBadge zone={record.imcZone} size="sm" />
          {record.waistZone ? <ZoneBadge zone={record.waistZone} size="sm" /> : null}
        </div>
      </div>
    </div>
  );
}
