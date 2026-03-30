"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Activity,
  ArrowUpDown,
  CheckCircle2,
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

const HEADER_EYEBROW = "SAUDE · BIOMETRIA";

export default function BiometriaPage() {
  const t = useTranslations("biometria");
  const common = useTranslations("common");
  const { role } = useUser();
  const canManageBiometrics = role === "ADMIN" || role === "PROFESSOR";

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [form, setForm] = useState({
    heightM: "",
    weightKg: "",
    waistCm: "",
    fatPct: "",
  });
  const [classification, setClassification] = useState<Classification | null>(
    null,
  );
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

  const completedMeasurements = useMemo(
    () => Object.values(form).filter(Boolean).length,
    [form],
  );

  const requiredMeasurementsComplete = Boolean(form.heightM && form.weightKg);
  const completionLabel = requiredMeasurementsComplete
    ? t("completionReady")
    : t("completionPending");

  const liveStatusLabel =
    classification &&
    (classification.imcZone.includes("Saud") ||
      classification.imcZone.includes("Healthy") ||
      classification.imcZone === "ZSAF")
      ? t("statusHealthyShort")
      : t("statusAttentionShort");

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const response = await fetch("/api/students?limit=500");
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
    } catch {
      toast.error(common("studentListLoadError"));
    } finally {
      setLoadingStudents(false);
    }
  }, [common]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    const height = parseFloat(form.heightM);
    const weight = parseFloat(form.weightKg);

    if (!(height > 0 && weight > 0)) {
      setClassification(null);
      return;
    }

    const bmi = weight / (height * height);
    const student = students.find((entry) => entry.id === studentId);
    if (!student) {
      setClassification(null);
      return;
    }

    const age = student.age ?? calcAgeFromBirthDate(student.birthDate) ?? 14;
    const imcResult = classifyBmi(bmi, student.sex, age);
    const imcZone =
      imcResult?.zone ?? (bmi <= 25 ? t("healthyZone") : t("improvementZone"));

    let waistZone: string | null = null;
    if (form.waistCm) {
      const waistResult = classifyWaist(
        parseFloat(form.waistCm),
        student.sex,
        age,
      );
      waistZone = waistResult?.zone ?? null;
    }

    setClassification({
      imc: Math.round(bmi * 10) / 10,
      imcZone,
      waistZone,
    });
  }, [form.heightM, form.weightKg, form.waistCm, studentId, students, t]);

  const updateField = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!studentId) {
      toast.error(t("selectStudent"));
      return;
    }

    setSaving(true);

    try {
      const height = parseFloat(form.heightM);
      const weight = parseFloat(form.weightKg);
      const bmi = Math.round((weight / (height * height)) * 10) / 10;

      const student = students.find((entry) => entry.id === studentId);
      const age = student
        ? (student.age ?? calcAgeFromBirthDate(student.birthDate) ?? 14)
        : 14;
      const sex = student?.sex ?? "M";

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

      await readApiResponse(response);
      toast.success(t("success"));
      setForm({ heightM: "", weightKg: "", waistCm: "", fatPct: "" });
      setClassification(null);
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
          title: t("title"),
          description: t("description"),
          eyebrow: HEADER_EYEBROW,
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
        title: t("title"),
        description: t("description"),
        eyebrow: HEADER_EYEBROW,
      }}
    >
      {loadingStudents ? (
        <BiometriaLoadingState />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <BiometriaOverviewCard
              icon={UserRound}
              label={t("selectedStudentLabel")}
              value={selectedStudent?.name ?? t("selectedStudentEmpty")}
              description={
                selectedStudent
                  ? [selectedStudent.className, selectedStudent.schoolYear]
                      .filter(Boolean)
                      .join(" · ")
                  : t("selectionHint")
              }
            />
            <BiometriaOverviewCard
              icon={Activity}
              label={t("classificationTitle")}
              value={classification ? String(classification.imc) : "--.-"}
              description={
                classification ? liveStatusLabel : t("enterValuesHint")
              }
              accent={classification ? "gold" : "default"}
            />
            <BiometriaOverviewCard
              icon={CheckCircle2}
              label={t("completionLabel")}
              value={`${completedMeasurements}/4`}
              description={completionLabel}
              accent={requiredMeasurementsComplete ? "success" : "default"}
            />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <PageSection
              tone="primary"
              layout="form"
              eyebrow={t("registerCardEyebrow")}
              title={t("registerCardTitle")}
              description={t("registerCardDescription")}
              actions={
                selectedStudent ? (
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/55 px-3 py-1 text-tiny font-semibold uppercase tracking-[0.18em] text-navy-800 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-gold-200">
                    {selectedStudent.className ??
                      selectedStudent.schoolYear ??
                      t("selectedStudentLabel")}
                  </span>
                ) : null
              }
            >
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="rounded-2xl border border-white/35 bg-white/72 p-4 shadow-card backdrop-blur-md dark:border-white/10 dark:bg-navy-950/42">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-tiny font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {t("selectionLabel")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("selectionHint")}
                      </p>
                    </div>
                    <span className="hidden rounded-full border border-gold-400/25 bg-gold-400/10 px-2.5 py-1 text-tiny font-semibold text-gold-700 dark:text-gold-200 sm:inline-flex">
                      {t("studentCount", { count: students.length })}
                    </span>
                  </div>

                  <StudentPicker
                    students={pickerStudents}
                    value={studentId}
                    onChange={setStudentId}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                <div className="rounded-2xl border border-gold-400/18 bg-gradient-to-r from-gold-400/10 via-white/70 to-white/55 p-4 shadow-card dark:from-gold-400/10 dark:via-navy-950/60 dark:to-navy-950/50">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <p className="text-tiny font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {t("classificationTitle")}
                      </p>
                      {classification ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-2xl font-black tracking-[-0.04em] text-foreground">
                            {classification.imc}
                          </span>
                          <ZoneBadge zone={classification.imcZone} />
                          {classification.waistZone ? (
                            <ZoneBadge
                              zone={classification.waistZone}
                              size="sm"
                            />
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {t("enterValuesHint")}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      variant="gold"
                      size="xl"
                      loading={saving}
                      icon={<Save className="size-4" />}
                      className="w-full md:w-auto"
                    >
                      {t("save")}
                    </Button>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    {t("saveSupport")}
                  </p>
                </div>
              </form>
            </PageSection>

            <aside className="flex flex-col gap-6 xl:sticky xl:top-24">
              <PageSection
                tone="secondary"
                layout="analytics"
                eyebrow={t("classificationTitle")}
                title={t("liveSummaryTitle")}
                description={t("liveSummaryDescription")}
              >
                {classification ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <SummaryStat
                        label={t("bmi")}
                        value={String(classification.imc)}
                      />
                      <SummaryStat
                        label={t("bmiZone")}
                        value={liveStatusLabel}
                        highlight
                      />
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-foreground">
                          {t("waistZone")}
                        </span>
                        <ZoneBadge
                          zone={classification.waistZone ?? t("waistPending")}
                          size="sm"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 px-4 py-8 text-center">
                    <p className="text-3xl font-black tracking-[-0.05em] text-foreground">
                      --.-
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("enterValuesHint")}
                    </p>
                  </div>
                )}
              </PageSection>

              <PageSection
                tone="utility"
                layout="list"
                eyebrow={t("studentContextTitle")}
                title={selectedStudent?.name ?? t("selectedStudentEmpty")}
                description={t("studentContextDescription")}
              >
                {selectedStudent ? (
                  <div className="grid gap-3">
                    <MetaRow
                      label={t("classLabel")}
                      value={
                        [selectedStudent.className, selectedStudent.schoolYear]
                          .filter(Boolean)
                          .join(" · ") || "-"
                      }
                    />
                    <MetaRow
                      label={t("ageLabel")}
                      value={String(
                        selectedStudent.age ??
                          calcAgeFromBirthDate(selectedStudent.birthDate) ??
                          "-",
                      )}
                    />
                    <MetaRow
                      label={t("sexLabel")}
                      value={
                        selectedStudent.sex === "F"
                          ? t("sexFemale")
                          : t("sexMale")
                      }
                    />
                    <MetaRow
                      label={t("completionLabel")}
                      value={completionLabel}
                    />
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("studentContextEmpty")}
                  </p>
                )}
              </PageSection>

              <PageSection
                tone="utility"
                layout="list"
                eyebrow={t("referenceTitle")}
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
            </aside>
          </div>
        </>
      )}
    </PageScaffold>
  );
}

function BiometriaLoadingState() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-28 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PageSection tone="primary" layout="form" contentClassName="gap-6">
          <Skeleton className="h-24 rounded-2xl" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-16 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-24 rounded-2xl" />
        </PageSection>

        <div className="flex flex-col gap-6">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </>
  );
}

function BiometriaOverviewCard({
  icon: Icon,
  label,
  value,
  description,
  accent = "default",
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  description: string;
  accent?: "default" | "gold" | "success";
}) {
  const accentClass =
    accent === "gold"
      ? "bg-gold-400/18 text-gold-700 dark:text-gold-200"
      : accent === "success"
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
        : "bg-navy-100 text-navy-800 dark:bg-white/10 dark:text-navy-100";

  return (
    <div className="rounded-2xl border border-white/30 bg-white/72 p-5 shadow-card backdrop-blur-md dark:border-white/10 dark:bg-navy-950/58">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-tiny font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-black tracking-[-0.04em] text-foreground">
            {value}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        <span
          className={`flex size-11 items-center justify-center rounded-2xl ${accentClass}`}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
      <p className="text-tiny font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 text-xl font-black tracking-[-0.04em] ${
          highlight ? "text-gold-600 dark:text-gold-200" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/45 px-4 py-3">
      <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
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
      ? "bg-emerald-500"
      : tone === "warning"
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="rounded-2xl border border-border/60 bg-background/45 p-4">
      <div className="flex items-center gap-3">
        <span className={`size-2.5 rounded-full ${toneClass}`} />
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
