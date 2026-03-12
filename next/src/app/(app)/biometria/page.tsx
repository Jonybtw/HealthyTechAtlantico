"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link2, Ruler, Activity } from "lucide-react";
import { PageTransition } from "@/components/ui/motion";
import { PageHeader } from "@/components/ui/page-header";
import { StudentPicker } from "@/components/ui/student-picker";
import { UnitInput } from "@/components/ui/unit-input";
import { Button } from "@/components/ui/button";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";
import { classifyBmi, classifyWaist, calcAgeFromBirthDate } from "@/lib/zaf";
import type { Sex } from "@prisma/client";
import { usePageTitle } from "@/hooks/use-page-title";

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
  usePageTitle(t("title"));
  const { role } = useUser();

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
    () => students.map((s) => ({ id: s.id, name: s.name, className: s.className, schoolYear: s.schoolYear })),
    [students],
  );

  /* load student list (teachers) or own student (alunos) */
  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch("/api/students?limit=500");
      if (!res.ok) { toast.error(t("loadError")); return; }
      const body = await res.json();
      setStudents(
        body.students.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          name: s.name as string,
          birthDate: (s.birthDate as string | null) ?? null,
          sex: (s.sex as Sex) ?? "M",
          age: s.age !== null && s.age !== undefined ? Number(s.age) : null,
          className: (s.className as string | null) ?? null,
          schoolYear: (s.schoolYear as string | null) ?? null,
        }))
      );
      if (role === "ALUNO" && body.students.length === 1) {
        setStudentId(body.students[0].id);
      }
    } catch {
      toast.error(t("loadConnectionError"));
    } finally {
      setLoadingStudents(false);
    }
  }, [role]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  /* compute BMI on-the-fly using real ZAF classification */
  useEffect(() => {
    const h = parseFloat(form.heightM);
    const w = parseFloat(form.weightKg);
    if (h > 0 && w > 0) {
      const bmi = w / (h * h);
      const student = students.find((s) => s.id === studentId);
      if (student) {
        const age =
          student.age ??
          calcAgeFromBirthDate(student.birthDate) ??
          14;
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
      }
    } else {
      setClassification(null);
    }
  }, [form.heightM, form.weightKg, form.waistCm, studentId, students]);

  const set = (key: string) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (role === "ALUNO" && students.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState
          icon={Link2}
          title={t("unlinkedTitle")}
          description={t("unlinkedDescription")}
        />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error(t("selectStudent"));
      return;
    }
    setSaving(true);

    try {
      const h = parseFloat(form.heightM);
      const w = parseFloat(form.weightKg);
      const bmi = Math.round((w / (h * h)) * 10) / 10;

      const student = students.find((s) => s.id === studentId);
      const age = student
        ? (student.age ?? calcAgeFromBirthDate(student.birthDate) ?? 14)
        : 14;
      const sex = student?.sex ?? "M";

      const imcResult = classifyBmi(bmi, sex, age);
      const imcZone = imcResult?.zone ?? (bmi <= 25 ? t("healthyZone") : t("improvementZone"));

      let waistZone: string | undefined;
      if (form.waistCm) {
        const wr = classifyWaist(parseFloat(form.waistCm), sex, age);
        waistZone = wr?.zone ?? undefined;
      }

      const res = await fetch(`/api/students/${studentId}/biometrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heightM: h,
          weightKg: w,
          waistCm: form.waistCm ? parseFloat(form.waistCm) : undefined,
          fatPct: form.fatPct ? parseFloat(form.fatPct) : undefined,
          imc: bmi,
          imcZone,
          waistZone,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? t("saveError"));
        return;
      }

      toast.success(t("success"));
      setForm({ heightM: "", weightKg: "", waistCm: "", fatPct: "" });
      setClassification(null);
    } catch {
      toast.error(t("connectionError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition className="flex flex-col gap-5">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      {loadingStudents ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
          <div className="bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-6 flex flex-col gap-5">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

          {/* LEFT — Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-6 flex flex-col gap-5"
          >
            {role !== "ALUNO" && (
              <StudentPicker
                students={pickerStudents}
                value={studentId}
                onChange={setStudentId}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UnitInput
                label={t("height")}
                unit="m"
                value={form.heightM}
                onChange={set("heightM")}
                placeholder="1.65"
                step="0.01"
                min="0.5"
                max="2.5"
                required
              />
              <UnitInput
                label={t("weight")}
                unit="kg"
                value={form.weightKg}
                onChange={set("weightKg")}
                placeholder="60.0"
                step="0.1"
                min="10"
                max="300"
                required
              />
              <UnitInput
                label={t("waist")}
                unit="cm"
                value={form.waistCm}
                onChange={set("waistCm")}
                placeholder="70"
                step="0.1"
              />
              <UnitInput
                label={t("fat")}
                unit="%"
                value={form.fatPct}
                onChange={set("fatPct")}
                placeholder="18.0"
                step="0.1"
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

          {/* RIGHT — Live Classification Panel */}
          <div className="lg:sticky lg:top-6 flex flex-col gap-4">
            <div className="bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-navy-600 dark:text-gold-400" />
                <h3 className="text-sm font-semibold tracking-tight">{t("classificationTitle")}</h3>
              </div>

              {!classification ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="relative">
                    <svg width="120" height="120" viewBox="0 0 120 120" className="text-muted-foreground/20">
                      <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="6 4" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-muted-foreground/30">—</span>
                      <span className="text-[10px] text-muted-foreground/40 font-semibold uppercase tracking-wider">IMC</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">{t("enterValuesHint")}</p>
                </div>
              ) : (() => {
                const r = 48;
                const circ = 2 * Math.PI * r;
                const bmiMin = 12, bmiMax = 38;
                const pct = Math.min(Math.max((classification.imc - bmiMin) / (bmiMax - bmiMin), 0), 1);
                const dashOffset = circ * (1 - pct);
                const isHealthy = classification.imcZone.includes("Saud") || classification.imcZone === "ZSAF";
                const trackColor = isHealthy ? "var(--color-success-500)" : "var(--color-warning-500)";

                return (
                  <>
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <svg width="148" height="148" viewBox="0 0 148 148" className="-rotate-90">
                          <circle cx="74" cy="74" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/25" />
                          <circle
                            cx="74" cy="74" r={r} fill="none"
                            stroke={trackColor} strokeWidth="10"
                            strokeDasharray={circ}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.34,1.56,0.64,1), stroke 0.4s ease" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold tabular-nums tracking-tighter text-foreground">{classification.imc}</span>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">IMC</span>
                        </div>
                      </div>
                      <ZoneBadge zone={classification.imcZone} />
                    </div>

                    <div className="flex flex-col gap-2.5 pt-3 border-t border-border/50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">{t("bmi")}</span>
                        <ZoneBadge zone={classification.imcZone} />
                      </div>
                      {classification.waistZone && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground font-medium">{t("waist")}</span>
                          <ZoneBadge zone={classification.waistZone} />
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* ZAF reference legend */}
            <div className="rounded-2xl border border-border/50 bg-card/60 p-4 flex flex-col gap-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">Referência ZAF</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-success-500" />
                  <span className="text-xs text-muted-foreground">ZSAF — {t("healthyZone")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-warning-400" />
                  <span className="text-xs text-muted-foreground">ZMF — {t("improvementZone")}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </PageTransition>
  );
}
