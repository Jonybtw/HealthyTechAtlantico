"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Activity,
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  FileUp,
  MoveRight,
  Ruler,
  Save,
  Scale,
  ShieldAlert,
  Timer,
  Users,
  Wind,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Sex } from "@prisma/client";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { StudentPicker } from "@/components/ui/student-picker";
import { UnitInput } from "@/components/ui/unit-input";
import { Button } from "@/components/ui/button";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";
import { readApiResponse } from "@/lib/api-client";
import { classifyTest } from "@/lib/fitness-tests";
import { calcAgeFromBirthDate, classifyBmi } from "@/lib/zaf";
import { cn } from "@/lib/utils";
import { DashboardPanel, sectionAnimation } from "@/components/ui/dashboard-panel";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { useReducedEffects } from "@/hooks/use-reduced-effects";
import { TestBulkImportModal } from "@/components/ui/test-bulk-import-modal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentOption {
  id: string;
  name: string;
  sex: Sex;
  birthDate: string | null;
  className?: string | null;
  schoolYear?: string | null;
}

type TestFieldId =
  | "vai"
  | "cooper"
  | "milha"
  | "velocidade"
  | "agilidade"
  | "abd"
  | "bracos"
  | "senta";

interface TestFieldMeta {
  id: TestFieldId;
  label: string;
  unit: string;
  placeholder: string;
  type?: "number" | "text";
  step?: string;
  Icon: LucideIcon;
}

interface CategoryMeta {
  id: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  fields: TestFieldMeta[];
}

interface TestRecordResponse {
  id: string;
  testId: string;
  valueNum: number | string | null;
  valueText: string;
  unit: string;
  zone: string;
  recordedAt: string;
}

interface TestRecord {
  id: string;
  testId: string;
  valueNum: number | null;
  valueText: string;
  unit: string;
  zone: string;
  recordedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TEST_FIELD_MAP: Record<TestFieldId, TestFieldMeta> = {
  vai: { id: "vai", label: "Vai-e-vem 20m", unit: "percursos", placeholder: "0", step: "1", Icon: Wind },
  cooper: { id: "cooper", label: "Cooper 12 min", unit: "voltas", placeholder: "0", step: "1", Icon: Wind },
  milha: { id: "milha", label: "Milha 1609m", unit: "mm:ss", placeholder: "08:30", type: "text", Icon: Clock3 },
  velocidade: { id: "velocidade", label: "Velocidade 40m", unit: "s", placeholder: "6.4", step: "0.1", Icon: Zap },
  agilidade: { id: "agilidade", label: "Agilidade 4x10m", unit: "s", placeholder: "10.8", step: "0.1", Icon: MoveRight },
  abd: { id: "abd", label: "Abdominais", unit: "reps", placeholder: "0", step: "1", Icon: Dumbbell },
  bracos: { id: "bracos", label: "Extensoes de bracos", unit: "reps", placeholder: "0", step: "1", Icon: Dumbbell },
  senta: { id: "senta", label: "Sentar e alcancar", unit: "cm", placeholder: "0.0", step: "0.1", Icon: Ruler },
};

const CATEGORY_SECTIONS: CategoryMeta[] = [
  { id: "aerobica", title: "Capacidade aerobica", description: "Resistencia e esforco continuo.", Icon: Wind, fields: [TEST_FIELD_MAP.vai, TEST_FIELD_MAP.cooper, TEST_FIELD_MAP.milha] },
  { id: "velocidade", title: "Velocidade e agilidade", description: "Tempo, explosao e mudanca de direcao.", Icon: Zap, fields: [TEST_FIELD_MAP.velocidade, TEST_FIELD_MAP.agilidade] },
  { id: "forca", title: "Forca muscular", description: "Repeticao, suporte e controlo do corpo.", Icon: Dumbbell, fields: [TEST_FIELD_MAP.abd, TEST_FIELD_MAP.bracos] },
  { id: "flexibilidade", title: "Flexibilidade", description: "Amplitude e alcance do tronco.", Icon: Ruler, fields: [TEST_FIELD_MAP.senta] },
];

const FIELD_ORDER = Object.keys(TEST_FIELD_MAP) as TestFieldId[];

const INITIAL_FORM: Record<TestFieldId | "weightKg" | "heightM", string> = {
  vai: "", cooper: "", milha: "", velocidade: "", agilidade: "", abd: "", bracos: "", senta: "", weightKg: "", heightM: "",
};

const TOTAL_TESTS = 8;

const FIELD_LABEL_KEYS: Record<TestFieldId, string> = {
  vai: "fieldVai",
  cooper: "fieldCooper",
  milha: "fieldMilha",
  velocidade: "fieldVelocidade",
  agilidade: "fieldAgilidade",
  abd: "fieldAbd",
  bracos: "fieldBracos",
  senta: "fieldSenta",
};

const CATEGORY_LABEL_KEYS: Record<string, { titleKey: string; descKey: string }> = {
  aerobica: { titleKey: "sectionAerobicaTitle", descKey: "sectionAerobicaDesc" },
  velocidade: { titleKey: "sectionVelocidadeTitle", descKey: "sectionVelocidadeDesc" },
  forca: { titleKey: "sectionForcaTitle", descKey: "sectionForcaDesc" },
  flexibilidade: { titleKey: "sectionFlexibilidadeTitle", descKey: "sectionFlexibilidadeDesc" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toOptionalNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeTestRecord(record: TestRecordResponse): TestRecord {
  return {
    id: record.id,
    testId: record.testId,
    valueNum: toOptionalNumber(record.valueNum),
    valueText: record.valueText,
    unit: record.unit,
    zone: record.zone,
    recordedAt: record.recordedAt,
  };
}

function getTestSortIndex(testId: string) {
  const index = FIELD_ORDER.indexOf(testId as TestFieldId);
  return index === -1 ? FIELD_ORDER.length : index;
}

function isHealthyZone(zone: string | null | undefined) {
  if (!zone) return false;
  const n = zone.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return n.includes("saudavel") || n.includes("healthy") || n.includes("zsaf");
}


// ─── Main Component ───────────────────────────────────────────────────────────

export default function TestesPage() {
  const t = useTranslations("testes");
  const common = useTranslations("common");
  const locale = useLocale();
  const { role } = useUser();
  const reducedEffects = useReducedEffects();
  const canManageTests = role === "ADMIN" || role === "PROFESSOR";

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showTestImport, setShowTestImport] = useState(false);
  const [loadingLatestTests, setLoadingLatestTests] = useState(false);
  const [latestTests, setLatestTests] = useState<TestRecord[]>([]);
  const [form, setForm] = useState<Record<TestFieldId | "weightKg" | "heightM", string>>(INITIAL_FORM);
  const [lastSubmission, setLastSubmission] = useState<{ count: number; zone: string | null; biometricsSaved: boolean } | null>(null);

  const selectedStudent = useMemo(() => students.find((s) => s.id === studentId) ?? null, [studentId, students]);
  const selectedStudentAge = useMemo(() => (selectedStudent ? calcAgeFromBirthDate(selectedStudent.birthDate) : null), [selectedStudent]);
  const selectedStudentContext = useMemo(
    () => [selectedStudent?.className, selectedStudent?.schoolYear].filter(Boolean).join(" / "),
    [selectedStudent?.className, selectedStudent?.schoolYear],
  );

  const completedTestsCount = useMemo(
    () => Object.entries(form).filter(([key, value]) => !["weightKg", "heightM"].includes(key) && value.trim().length > 0).length,
    [form],
  );

  const previewResults = useMemo(() => {
    if (!selectedStudent) return [];
    return FIELD_ORDER.flatMap((fieldId) => {
      const field = TEST_FIELD_MAP[fieldId];
      const value = form[field.id];
      if (!value.trim()) return [];
      const zone = selectedStudentAge !== null ? classifyTest(field.id, value, selectedStudent.sex, selectedStudentAge) : null;
      return [{ id: field.id, label: t(FIELD_LABEL_KEYS[field.id] ?? field.id), value, unit: field.unit, zone }];
    });
  }, [form, selectedStudent, selectedStudentAge, t]);

  const healthyPreviewCount = previewResults.filter((r) => isHealthyZone(r.zone)).length;
  const resolvedPreviewCount = previewResults.filter((r) => Boolean(r.zone)).length;

  const biometricsReady = Boolean(form.weightKg && form.heightM);
  const biometricsPreview = useMemo(() => {
    if (!biometricsReady || !selectedStudent) return null;
    const height = parseFloat(form.heightM);
    const weight = parseFloat(form.weightKg);
    if (!(height > 0 && weight > 0)) return null;
    const bmi = Math.round((weight / (height * height)) * 10) / 10;
    const age = selectedStudentAge ?? 14;
    const imcResult = classifyBmi(bmi, selectedStudent.sex, age);
    return { bmi, zone: imcResult?.zone ?? (bmi <= 25 ? t("healthyZone") : t("improvementZone")) };
  }, [biometricsReady, form.heightM, form.weightKg, selectedStudent, selectedStudentAge, t]);

  const familyCoverage = useMemo(
    () => CATEGORY_SECTIONS.map((section) => {
      const filled = section.fields.filter((f) => form[f.id].trim().length > 0).length;
      const keys = CATEGORY_LABEL_KEYS[section.id];
      return { id: section.id, title: keys ? t(keys.titleKey) : section.id, filled, total: section.fields.length, percentage: section.fields.length > 0 ? Math.round((filled / section.fields.length) * 100) : 0 };
    }),
    [form, t],
  );

  const sessionReady = completedTestsCount > 0 || biometricsReady;

  const loadStudents = useCallback(async (signal?: AbortSignal) => {
    setLoadingStudents(true);
    try {
      const response = await fetch("/api/students?limit=500", { signal });
      if (!response.ok) { toast.error(common("studentListLoadError")); return; }
      const body = await readApiResponse<{ students: Array<{ id: string; name: string; sex: Sex | null; birthDate: string | null; className?: string | null; schoolYear?: string | null }> }>(response);
      setStudents(body.students.map((s) => ({ id: s.id, name: s.name, sex: s.sex ?? "M", birthDate: s.birthDate ?? null, className: s.className ?? null, schoolYear: s.schoolYear ?? null })));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(common("studentListLoadError"));
    } finally {
      if (!signal?.aborted) setLoadingStudents(false);
    }
  }, [common]);

  const loadLatestTests = useCallback(async (targetStudentId: string, signal?: AbortSignal) => {
    setLoadingLatestTests(true);
    try {
      const response = await fetch(`/api/students/${targetStudentId}/tests?latest=true`, { signal });
      const records = await readApiResponse<TestRecordResponse[]>(response);
      setLatestTests(records.map(normalizeTestRecord).sort((a, b) => getTestSortIndex(a.testId) - getTestSortIndex(b.testId)));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setLatestTests([]);
      toast.error(t("loadConnectionError"));
    } finally {
      if (!signal?.aborted) setLoadingLatestTests(false);
    }
  }, [t]);

  useEffect(() => {
    const controller = new AbortController();
    void loadStudents(controller.signal);
    return () => controller.abort();
  }, [loadStudents]);

  useEffect(() => {
    setForm(INITIAL_FORM);
    setLastSubmission(null);
  }, [studentId]);

  useEffect(() => {
    if (!studentId) { setLatestTests([]); setLoadingLatestTests(false); return; }
    const controller = new AbortController();
    void loadLatestTests(studentId, controller.signal);
    return () => controller.abort();
  }, [studentId, loadLatestTests]);

  const updateField = (field: TestFieldId | "weightKg" | "heightM") => (value: string) => {
    setForm((c) => ({ ...c, [field]: value }));
    setLastSubmission(null);
  };

  const formatDate = useCallback(
    (value: string) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)),
    [locale],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!studentId || !selectedStudent) { toast.error(t("selectStudent")); return; }

    const testsToSave = FIELD_ORDER.filter((id) => form[id].trim().length > 0).map((id) => {
      const field = TEST_FIELD_MAP[id];
      const zone = selectedStudentAge !== null ? classifyTest(field.id, form[field.id], selectedStudent.sex, selectedStudentAge) ?? t("improvementZone") : t("improvementZone");
      return { testId: field.id, valueNum: field.type === "text" ? null : parseFloat(form[field.id]), valueText: form[field.id], unit: field.unit, zone };
    });

    if (testsToSave.length === 0 && !biometricsReady) { toast.error(t("fillValue")); return; }

    setSaving(true);
    try {
      let primaryZone: string | null = null;

      if (testsToSave.length > 0) {
        const response = await fetch(`/api/students/${studentId}/tests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tests: testsToSave }),
        });
        const body = await readApiResponse<{ count: number; tests: TestRecordResponse[] }>(response);
        primaryZone = body.tests[0]?.zone ?? null;
      }

      if (biometricsReady && biometricsPreview) {
        await fetch(`/api/students/${studentId}/biometrics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ heightM: parseFloat(form.heightM), weightKg: parseFloat(form.weightKg), imc: biometricsPreview.bmi, imcZone: biometricsPreview.zone }),
        }).then(readApiResponse);
      }

      if (testsToSave.length > 0) await loadLatestTests(studentId);

      setLastSubmission({ count: testsToSave.length, zone: primaryZone, biometricsSaved: biometricsReady });
      setForm(INITIAL_FORM);
      toast.success(t("success"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("connectionError"));
    } finally {
      setSaving(false);
    }
  };


  if (!canManageTests) {
    return (
      <PageScaffold headerProps={{ title: t("title"), description: t("description") }}>
        <EmptyState icon={ShieldAlert} title={common("noPermission")} description={t("description")} />
      </PageScaffold>
    );
  }

  return (
    <>
      <PageScaffold
        className="gap-6"
        headerProps={{ title: t("title"), description: t("description") }}
        headerActions={
          <Button size="sm" variant="primary" icon={<FileUp className="size-4" />} onClick={() => setShowTestImport(true)}>
            {t("bulkImportBtn")}
          </Button>
        }
      >
        {loadingStudents ? (
          <TestesLoadingState />
        ) : (
          <TestesContent
            biometricsPreview={biometricsPreview}
            completedTestsCount={completedTestsCount}
            familyCoverage={familyCoverage}
            form={form}
            formatDate={formatDate}
            handleSubmit={handleSubmit}
            healthyPreviewCount={healthyPreviewCount}
            lastSubmission={lastSubmission}
            latestTests={latestTests}
            loadingLatestTests={loadingLatestTests}
            previewResults={previewResults}
            reducedEffects={reducedEffects}
            resolvedPreviewCount={resolvedPreviewCount}
            saving={saving}
            selectedStudent={selectedStudent}
            selectedStudentAge={selectedStudentAge}
            selectedStudentContext={selectedStudentContext}
            sessionReady={sessionReady}
            setStudentId={setStudentId}
            students={students}
            updateField={updateField}
          />
        )}
      </PageScaffold>

      <TestBulkImportModal
        open={showTestImport}
        onClose={() => setShowTestImport(false)}
        onSuccess={() => setShowTestImport(false)}
      />
    </>
  );
}

// ─── Content Component ────────────────────────────────────────────────────────

interface TestesContentProps {
  biometricsPreview: { bmi: number; zone: string } | null;
  completedTestsCount: number;
  familyCoverage: { id: string; title: string; filled: number; total: number; percentage: number }[];
  form: Record<TestFieldId | "weightKg" | "heightM", string>;
  formatDate: (v: string) => string;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  healthyPreviewCount: number;
  lastSubmission: { count: number; zone: string | null; biometricsSaved: boolean } | null;
  latestTests: TestRecord[];
  loadingLatestTests: boolean;
  previewResults: { id: string; label: string; value: string; unit: string; zone: string | null }[];
  reducedEffects: boolean;
  resolvedPreviewCount: number;
  saving: boolean;
  selectedStudent: StudentOption | null;
  selectedStudentAge: number | null;
  selectedStudentContext: string;
  sessionReady: boolean;
  setStudentId: (id: string | null) => void;
  students: StudentOption[];
  updateField: (field: TestFieldId | "weightKg" | "heightM") => (value: string) => void;
}

function TestesContent({
  biometricsPreview,
  completedTestsCount,
  familyCoverage,
  form,
  formatDate,
  handleSubmit,
  healthyPreviewCount,
  lastSubmission,
  latestTests,
  loadingLatestTests,
  previewResults,
  reducedEffects,
  resolvedPreviewCount,
  saving,
  selectedStudent,
  selectedStudentAge,
  selectedStudentContext,
  sessionReady,
  setStudentId,
  students,
  updateField,
}: TestesContentProps) {
  const t = useTranslations("testes");
  const common = useTranslations("common");

  const animatedStudents = useAnimatedNumber(students.length, reducedEffects);
  const animatedHealthy = useAnimatedNumber(healthyPreviewCount, reducedEffects);
  const animatedLatest = useAnimatedNumber(latestTests.length, reducedEffects);

  const pickerStudents = useMemo(
    () => students.map((s) => ({ id: s.id, name: s.name, className: s.className, schoolYear: s.schoolYear })),
    [students],
  );

  return (
    <div className="grid gap-5">
      {/* ── Row 1: KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiPanel
          index={0}
          reducedEffects={reducedEffects}
          icon={<Users className="size-[18px]" />}
          iconClass="bg-navy-100 text-navy-700 dark:bg-white/8 dark:text-navy-100"
          label={t("kpiStudentsLabel")}
          value={String(animatedStudents)}
          footer={t("kpiStudentsSub", { count: students.length })}
          footerIcon={<Users className="size-3 shrink-0" />}
        />
        <KpiPanel
          index={1}
          reducedEffects={reducedEffects}
          icon={<Activity className="size-[18px]" />}
          iconClass="bg-gold-100 text-gold-700 dark:bg-gold-300/12 dark:text-gold-200"
          label={t("kpiSessionLabel")}
          value={`${completedTestsCount}/${TOTAL_TESTS}`}
          footer={
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-navy-800 to-gold-400 transition-all duration-500"
                style={{ width: `${Math.round((completedTestsCount / TOTAL_TESTS) * 100)}%` }}
              />
            </div>
          }
          footerProgress
        />
        <KpiPanel
          index={2}
          reducedEffects={reducedEffects}
          icon={<CheckCircle2 className="size-[18px]" />}
          iconClass="bg-success-100 text-success-700 dark:bg-success-300/12 dark:text-success-200"
          label={t("kpiHealthyZoneLabel")}
          value={String(animatedHealthy)}
          footer={
            resolvedPreviewCount > 0
              ? t("kpiHealthyResult", { healthy: healthyPreviewCount, total: resolvedPreviewCount })
              : t("kpiNoResults")
          }
          footerIcon={<CheckCircle2 className="size-3 shrink-0" />}
        />
        <KpiPanel
          index={3}
          reducedEffects={reducedEffects}
          icon={<Timer className="size-[18px]" />}
          iconClass="bg-navy-100 text-navy-700 dark:bg-white/8 dark:text-navy-100"
          label={t("kpiLastBatteryLabel")}
          value={String(animatedLatest)}
          footer={selectedStudent ? selectedStudent.name : t("kpiNoStudentSelected")}
          footerIcon={<CalendarDays className="size-3 shrink-0" />}
        />
      </div>

      {/* ── Row 2: Form + Sidebar ── */}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_340px]">
        {/* Form */}
        <DashboardPanel index={4} reducedEffects={reducedEffects} className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="grid gap-4">
            {/* Student picker */}
            <div className="rounded-[8px] border border-border/70 bg-background/55 p-4">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className="min-w-0">
                  <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("studentPickerLabel")}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("studentPickerHint")}</p>
                  <div className="mt-3">
                    <StudentPicker students={pickerStudents} value={selectedStudent?.id ?? null} onChange={setStudentId} />
                  </div>
                </div>
                {selectedStudentContext && (
                  <span className="inline-flex whitespace-nowrap rounded-full border border-gold-400/25 bg-gold-400/10 px-2.5 py-1 text-tiny font-semibold text-gold-700 dark:text-gold-200">
                    {selectedStudentContext}
                  </span>
                )}
              </div>
            </div>

            {/* Category panels */}
            <div className="overflow-hidden rounded-[8px] border border-border/70 bg-background/55">
              {CATEGORY_SECTIONS.map((section, index) => {
                const Icon = section.Icon;
                const bordered = index < CATEGORY_SECTIONS.length - 1;
                return (
                  <div
                    key={section.id}
                    className={cn(
                      "grid gap-4 p-4 xl:grid-cols-[200px_minmax(0,1fr)]",
                      bordered && "border-b border-border/50",
                    )}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="flex size-9 items-center justify-center rounded-[12px] border border-border/60 bg-surface-utility text-foreground shadow-sm">
                          <Icon className="size-4" />
                        </span>
                        <p className="text-sm font-semibold text-foreground">{CATEGORY_LABEL_KEYS[section.id] ? t(CATEGORY_LABEL_KEYS[section.id]!.titleKey) : section.title}</p>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">{CATEGORY_LABEL_KEYS[section.id] ? t(CATEGORY_LABEL_KEYS[section.id]!.descKey) : section.description}</p>
                    </div>
                    <div
                      className={cn(
                        "grid gap-3",
                        section.fields.length >= 3 ? "md:grid-cols-2 xl:grid-cols-3" : section.fields.length === 2 ? "md:grid-cols-2" : "grid-cols-1",
                      )}
                    >
                      {section.fields.map((field) => (
                        <UnitInput
                          key={field.id}
                          label={t(FIELD_LABEL_KEYS[field.id] ?? field.id)}
                          unit={field.unit}
                          value={form[field.id]}
                          onChange={updateField(field.id)}
                          placeholder={field.placeholder}
                          step={field.step}
                          type={field.type}
                          icon={<field.Icon className="size-4" />}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Biometrics support */}
              <div className="grid gap-4 border-t border-border/50 p-4 xl:grid-cols-[200px_minmax(0,1fr)]">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-[12px] border border-border/60 bg-surface-utility text-foreground shadow-sm">
                      <Scale className="size-4" />
                    </span>
                    <p className="text-sm font-semibold text-foreground">{t("bioSupportTitle")}</p>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t("bioSupportHint")}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <UnitInput label={t("weightLabel")} unit="kg" value={form.weightKg} onChange={updateField("weightKg")} placeholder="53.4" step="0.1" icon={<Scale className="size-4" />} />
                  <UnitInput label={t("heightLabel")} unit="m" value={form.heightM} onChange={updateField("heightM")} placeholder="1.62" step="0.01" icon={<ArrowUpDown className="size-4" />} />
                </div>
              </div>
            </div>

            {/* Session close */}
            <div className="rounded-[8px] border border-border/70 bg-background/55 p-4">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("sessionCloseTitle")}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t("sessionCloseHint")}
                  </p>
                  {lastSubmission ? (
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {lastSubmission.biometricsSaved
                        ? t("lastSubmissionWithBio", { count: lastSubmission.count })
                        : t("lastSubmissionLabel", { count: lastSubmission.count })}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold",
                    sessionReady
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                      : "border-white/20 bg-white/55 text-navy-800 dark:border-white/10 dark:bg-white/8 dark:text-navy-100",
                  )}>
                    <CheckCircle2 className="size-4" />
                    {sessionReady ? t("readyToSave") : t("awaitingResults")}
                  </span>
                  <Button type="submit" loading={saving} icon={<Save className="size-4" />} className="h-11 w-full justify-center sm:w-auto">
                    {t("saveSessionBtn")}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </DashboardPanel>

        {/* Sidebar */}
        <aside className="grid gap-4 xl:sticky xl:top-24">
          {/* Student info */}
          <DashboardPanel index={5} reducedEffects={reducedEffects} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("activeBatteryTitle")}</p>
                <h2 className="mt-1 truncate font-display text-[1.35rem] font-black tracking-[-0.05em] text-foreground">
                  {selectedStudent?.name ?? t("kpiNoStudentSelected")}
                </h2>
              </div>
              <span className={cn(
                "inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-[12px] border px-2.5 text-sm font-semibold shadow-sm",
                completedTestsCount > 0
                  ? "border-gold-400/25 bg-gold-400/10 text-gold-700 dark:text-gold-200"
                  : "border-border/70 bg-background/80 text-muted-foreground",
              )}>
                {completedTestsCount}/{TOTAL_TESTS}
              </span>
            </div>

            {selectedStudent ? (
              <div className="mt-4 grid gap-2">
                <MetaRow label={t("classLabel")} value={selectedStudentContext || common("noData")} />
                <MetaRow label={t("ageLabel")} value={selectedStudentAge !== null ? String(selectedStudentAge) : t("noReference")} />
                <MetaRow label={t("sexLabel")} value={selectedStudent.sex === "F" ? common("female") : common("male")} />
              </div>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("noStudentHint")}</p>
            )}
          </DashboardPanel>

          {/* Session metrics */}
          <DashboardPanel index={6} reducedEffects={reducedEffects} className="p-5">
            <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("sessionMetricsTitle")}</p>
            <div className="mt-3 grid gap-2">
              <SessionMetric label={t("filledTestsLabel")} value={`${completedTestsCount}/${TOTAL_TESTS}`} />
              <SessionMetric label={t("readyClassificationsLabel")} value={String(resolvedPreviewCount)} />
              <SessionMetric label={t("healthyZoneCountLabel")} value={String(healthyPreviewCount)} highlight={healthyPreviewCount > 0} />
              <SessionMetric
                label={t("bioSupportMetricLabel")}
                value={biometricsPreview ? `${biometricsPreview.bmi.toFixed(1)} IMC` : t("bioSupportOptional")}
                highlight={Boolean(biometricsPreview)}
              />
            </div>

            {previewResults.length > 0 && (
              <>
                <div className="my-3 h-px bg-border/50" />
                <div className="grid gap-2">
                  {previewResults.map((result) => (
                    <LiveResultRow key={result.id} label={result.label} value={`${result.value} ${result.unit}`} zone={result.zone} />
                  ))}
                </div>
              </>
            )}

            {!selectedStudent && (
              <InlineFocusEmpty icon={Timer}>{t("noTestsHint")}</InlineFocusEmpty>
            )}
            {selectedStudent && previewResults.length === 0 && (
              <InlineFocusEmpty icon={Timer}>{t("enterResultsHint")}</InlineFocusEmpty>
            )}

            {lastSubmission?.zone ? (
              <div className="mt-3 rounded-[12px] border border-gold-400/18 bg-gold-400/10 px-4 py-3">
                <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("lastZoneTitle")}</p>
                <div className="mt-2"><ZoneBadge zone={lastSubmission.zone} /></div>
              </div>
            ) : null}
          </DashboardPanel>

          {/* Family coverage */}
          <DashboardPanel index={7} reducedEffects={reducedEffects} className="p-5">
            <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("coverageTitle")}</p>
            <h3 className="mt-1 text-base font-bold tracking-tight text-foreground">{t("familiesTitle")}</h3>
            <div className="mt-3 grid gap-2.5">
              {familyCoverage.map((family) => (
                <FamilyProgressRow key={family.id} title={family.title} filled={family.filled} total={family.total} percentage={family.percentage} />
              ))}
            </div>
          </DashboardPanel>
        </aside>
      </div>

      {/* ── Row 3: Recent Results ── */}
      <DashboardPanel index={8} reducedEffects={reducedEffects} className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("lastBatteryPanelTitle")}</p>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground">{t("recentResultsTitle")}</h3>
          </div>
          {latestTests.length > 0 && (
            <span className="inline-flex rounded-full border border-white/22 bg-white/74 px-2.5 py-1 text-tiny font-semibold uppercase tracking-[0.16em] text-navy-800 shadow-sm dark:border-white/10 dark:bg-white/8 dark:text-navy-100">
              {latestTests.length}
            </span>
          )}
        </div>

        {!selectedStudent ? (
          <InlineFocusEmpty icon={Timer}>{t("selectForBatteryHint")}</InlineFocusEmpty>
        ) : loadingLatestTests ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-[12px]" />)}
          </div>
        ) : latestTests.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {latestTests.map((record) => (
              <RecentTestCard key={record.id} record={record} dateLabel={formatDate(record.recordedAt)} />
            ))}
          </div>
        ) : (
          <InlineFocusEmpty icon={Timer}>{t("noRecentResultsHint")}</InlineFocusEmpty>
        )}
      </DashboardPanel>
    </div>
  );
}

// ─── Loading State ─────────────────────────────────────────────────────────────

function TestesLoadingState() {
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[120px] rounded-[12px]" />)}
      </div>
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_340px]">
        <Skeleton className="h-[580px] rounded-[12px]" />
        <div className="grid gap-4">
          <Skeleton className="h-[160px] rounded-[12px]" />
          <Skeleton className="h-[220px] rounded-[12px]" />
          <Skeleton className="h-[180px] rounded-[12px]" />
        </div>
      </div>
      <Skeleton className="h-[260px] rounded-[12px]" />
    </div>
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
    <DashboardPanel
      index={index}
      reducedEffects={reducedEffects}
      className="group h-full min-h-[120px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(9,21,35,0.12)] dark:hover:shadow-[0_10px_28px_rgba(0,0,0,0.34)]"
    >
      <div className="flex h-full min-h-[120px] flex-col p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-[8px] transition-transform duration-300 group-hover:scale-105", iconClass)}>
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
    </DashboardPanel>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-border/70 bg-background/65 px-3.5 py-2.5 shadow-sm">
      <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function SessionMetric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-border/70 bg-background/65 px-3.5 py-2.5 shadow-sm">
      <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold", highlight ? "text-gold-700 dark:text-gold-200" : "text-foreground")}>{value}</span>
    </div>
  );
}

function InlineFocusEmpty({ icon: Icon, children }: { icon: typeof Timer; children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-[12px] border border-dashed border-border/60 bg-background/40 px-4 py-6 text-center">
      <Icon className="mx-auto size-6 text-muted-foreground/40" />
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function LiveResultRow({ label, value, zone }: { label: string; value: string; zone: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-border/60 bg-background/55 px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{value}</p>
      </div>
      {zone ? <ZoneBadge zone={zone} size="sm" /> : <span className="shrink-0 text-xs font-semibold text-muted-foreground">Sem ref.</span>}
    </div>
  );
}

function FamilyProgressRow({ title, filled, total, percentage }: { title: string; filled: number; total: number; percentage: number }) {
  return (
    <div className="rounded-[12px] border border-border/70 bg-background/65 px-3.5 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <span className="text-xs font-semibold text-muted-foreground">{filled}/{total}</span>
      </div>
      <div className="mt-2.5 h-1.5 rounded-full bg-muted">
        <div className="h-full rounded-full bg-gradient-to-r from-navy-800 via-navy-700 to-gold-400 transition-all duration-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function RecentTestCard({ record, dateLabel }: { record: TestRecord; dateLabel: string }) {
  const meta = TEST_FIELD_MAP[record.testId as TestFieldId];
  const Icon = meta?.Icon ?? Activity;

  return (
    <div className="rounded-[12px] border border-border/70 bg-background/65 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] border border-border/60 bg-surface-utility text-foreground shadow-sm">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{meta?.label ?? record.testId}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3" />
              {dateLabel}
            </p>
          </div>
        </div>
        <ZoneBadge zone={record.zone} size="sm" />
      </div>
      <p className="mt-3.5 text-[1.8rem] font-black leading-none tracking-[-0.05em] text-foreground">
        {record.valueText}
        <span className="ml-1 text-xs font-semibold text-muted-foreground">{record.unit}</span>
      </p>
    </div>
  );
}
