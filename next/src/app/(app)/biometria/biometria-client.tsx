"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowUpDown, Percent, Ruler, Scale, ShieldAlert } from "lucide-react";
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
import { classifyBmi, classifyWaist, calcAgeFromBirthDate } from "@/lib/zaf";
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
  const [classification, setClassification] = useState<Classification | null>(null);
  const [saving, setSaving] = useState(false);

  const pickerStudents = useMemo(
    () =>
      students.map((student) => ({
        id: student.id,
        name: student.name,
        className: student.className,
        schoolYear: student.schoolYear,
      })),
    [students]
  );

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const response = await fetch("/api/students?limit=500");
      if (!response.ok) {
        toast.error(common("studentListLoadError"));
        return;
      }

      const body = await readApiResponse<{ students: StudentOption[] }>(response);
      setStudents(
        body.students.map((student) => ({
          id: student.id,
          name: student.name,
          birthDate: student.birthDate ?? null,
          sex: student.sex ?? "M",
          age: student.age !== null && student.age !== undefined ? Number(student.age) : null,
          className: student.className ?? null,
          schoolYear: student.schoolYear ?? null,
        }))
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
      return;
    }

    const age = student.age ?? calcAgeFromBirthDate(student.birthDate) ?? 14;
    const imcResult = classifyBmi(bmi, student.sex, age);
    const imcZone = imcResult?.zone ?? (bmi <= 25 ? t("healthyZone") : t("improvementZone"));

    let waistZone: string | null = null;
    if (form.waistCm) {
      const waistResult = classifyWaist(parseFloat(form.waistCm), student.sex, age);
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

  if (!canManageBiometrics) {
    return (
      <PageScaffold headerProps={{ title: t("title"), description: t("description") }}>
        <EmptyState
          icon={ShieldAlert}
          title={common("noPermission")}
          description={t("description")}
        />
      </PageScaffold>
    );
  }

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
      const age = student ? student.age ?? calcAgeFromBirthDate(student.birthDate) ?? 14 : 14;
      const sex = student?.sex ?? "M";

      const imcResult = classifyBmi(bmi, sex, age);
      const imcZone = imcResult?.zone ?? (bmi <= 25 ? t("healthyZone") : t("improvementZone"));

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
      toast.error(error instanceof Error ? error.message : t("connectionError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageScaffold
      headerProps={{
        title: t("title"),
        description: t("description"),
      }}
    >

      {loadingStudents ? (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
          <PageSection tone="primary" layout="form" contentClassName="gap-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-14 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-9 w-32 rounded-xl" />
          </PageSection>
          <PageSection tone="secondary" layout="list" contentClassName="gap-3">
            <Skeleton className="h-72 w-full rounded-xl" />
          </PageSection>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
          <PageSection
            tone="primary"
            layout="form"
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <StudentPicker
                students={pickerStudents}
                value={studentId}
                onChange={setStudentId}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <UnitInput
                  label={t("height")}
                  unit="m"
                  value={form.heightM}
                  onChange={updateField("heightM")}
                  placeholder="1.65"
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
                  placeholder="60.0"
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
                  placeholder="70"
                  step="0.1"
                  icon={<Ruler className="size-4" />}
                />
                <UnitInput
                  label={t("fat")}
                  unit="%"
                  value={form.fatPct}
                  onChange={updateField("fatPct")}
                  placeholder="18.0"
                  step="0.1"
                  icon={<Percent className="size-4" />}
                />
              </div>

              <Button
                type="submit"
                loading={saving}
                icon={<Ruler className="size-4" />}
                className="self-start"
              >
                {t("save")}
              </Button>
            </form>
          </PageSection>

          <div className="flex flex-col gap-4 lg:sticky lg:top-6">
            <PageSection
              title={t("classificationTitle")}
              description={t("enterValuesHint")}
              tone="secondary"
              layout="analytics"
            >
              {!classification ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="relative">
                    <svg width="120" height="120" viewBox="0 0 120 120" className="text-muted-foreground/20">
                      <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="6 4" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-muted-foreground/30">-</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">IMC</span>
                    </div>
                  </div>
                  <p className="max-w-[200px] text-sm leading-relaxed text-muted-foreground">
                    {t("enterValuesHint")}
                  </p>
                </div>
              ) : (() => {
                const radius = 48;
                const circumference = 2 * Math.PI * radius;
                const bmiMin = 12;
                const bmiMax = 38;
                const pct = Math.min(Math.max((classification.imc - bmiMin) / (bmiMax - bmiMin), 0), 1);
                const dashOffset = circumference * (1 - pct);
                const isHealthy = classification.imcZone.includes("Saud") || classification.imcZone === "ZSAF";
                const trackColor = isHealthy ? "var(--color-success-500)" : "var(--color-warning-500)";

                return (
                  <>
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <svg width="148" height="148" viewBox="0 0 148 148" className="-rotate-90">
                          <circle cx="74" cy="74" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/25" />
                          <circle
                            cx="74"
                            cy="74"
                            r={radius}
                            fill="none"
                            stroke={trackColor}
                            strokeWidth="10"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.34,1.56,0.64,1), stroke 0.4s ease" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold tracking-tighter text-foreground tabular-nums">
                            {classification.imc}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">IMC</span>
                        </div>
                      </div>
                      <ZoneBadge zone={classification.imcZone} />
                    </div>

                    <div className="flex flex-col gap-2.5 border-t border-border/50 pt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-muted-foreground">{t("bmi")}</span>
                        <ZoneBadge zone={classification.imcZone} />
                      </div>
                      {classification.waistZone ? (
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-muted-foreground">{t("waist")}</span>
                          <ZoneBadge zone={classification.waistZone} />
                        </div>
                      ) : null}
                    </div>
                  </>
                );
              })()}
            </PageSection>

            <PageSection
              tone="secondary"
              title="Referencia ZAF"
              className="gap-0"
              contentClassName="gap-2"
              layout="list"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-success-500" />
                  <span className="text-xs text-muted-foreground">ZSAF - {t("healthyZone")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-warning-500" />
                  <span className="text-xs text-muted-foreground">ZMF - {t("improvementZone")}</span>
                </div>
              </div>
            </PageSection>
          </div>
        </div>
      )}
    </PageScaffold>
  );
}
