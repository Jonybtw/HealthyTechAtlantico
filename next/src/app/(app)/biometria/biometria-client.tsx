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
      <PageScaffold headerProps={{ title: t("title"), description: t("description"), eyebrow: "SAÚDE · BIOMETRIA" }}>
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
        eyebrow: "SAÚDE · BIOMETRIA",
      }}
    >
      {loadingStudents ? (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_380px]">
          <PageSection tone="primary" layout="form" contentClassName="gap-6">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-12 w-full rounded-full" />
          </PageSection>
          <div className="flex flex-col gap-6">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_380px]">
          <PageSection
            tone="primary"
            layout="form"
            title={
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-3xl">analytics</span>
                <span>{t("title")}</span>
              </div>
            }
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">
                  Seleção de Aluno
                </label>
                <StudentPicker
                  students={pickerStudents}
                  value={studentId}
                  onChange={setStudentId}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

              <Button
                type="submit"
                variant="sanctuary"
                size="xl"
                loading={saving}
                icon={<span className="material-symbols-outlined mr-2">save</span>}
                className="w-full text-lg shadow-glow"
              >
                {t("save")}
              </Button>
            </form>
          </PageSection>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
            <PageSection
              tone="secondary"
              title={
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                  Classificação Automática
                </span>
              }
              layout="analytics"
              className="relative overflow-hidden group"
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary/5 rounded-full blur-3xl group-hover:bg-secondary/10 transition-colors" />
              
              {!classification ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="relative">
                    <svg width="120" height="120" viewBox="0 0 120 120" className="text-muted-foreground/10">
                      <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="6 4" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-muted-foreground/20 italic">--.-</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground/60 px-4">
                    {t("enterValuesHint")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-6 bg-navy-950/40 rounded-2xl border border-white/5 shadow-inner">
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter mb-2">IMC ESTIMADO</p>
                    <p className="text-3xl font-black text-foreground italic">{classification.imc}</p>
                  </div>
                  <div className="text-center p-6 bg-navy-950/40 rounded-2xl border border-white/5 shadow-inner">
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter mb-2">ZAF STATUS</p>
                    <p className="text-2xl font-black text-secondary italic uppercase tracking-tight">
                      {classification.imcZone.includes("Saud") || classification.imcZone === "ZSAF" ? "SAUDÁVEL" : "ATENÇÃO"}
                    </p>
                  </div>
                </div>
              )}
            </PageSection>

            <PageSection
              tone="secondary"
              title={
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                  Referência ZAF
                </span>
              }
              layout="list"
              contentClassName="gap-3"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-full transition-all border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                    <span className="font-bold text-foreground text-sm">Saudável</span>
                  </div>
                  <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full uppercase tracking-wider">Ideal</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-full transition-all border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                    <span className="font-bold text-foreground text-sm">Melhoria</span>
                  </div>
                  <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full uppercase tracking-wider">Atenção</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-full opacity-50 transition-all border border-transparent">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <span className="font-bold text-foreground text-sm">Risco</span>
                  </div>
                  <span className="text-[9px] font-bold bg-red-500/10 text-red-400 px-3 py-1 rounded-full uppercase tracking-wider">Crítico</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary text-sm">info</span>
                  <p className="text-[11px] text-muted-foreground/70 leading-relaxed font-medium">
                    A Zona de Aptidão Física (ZAF) é calculada com base nos parâmetros da Direção-Geral da Saúde.
                  </p>
                </div>
              </div>
            </PageSection>

            <div className="rounded-2xl p-[1px] bg-gradient-to-br from-primary/20 to-transparent">
              <div className="bg-navy-950/60 backdrop-blur-xl rounded-2xl p-6 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary-foreground shadow-inner">
                  <span className="material-symbols-outlined text-3xl">history</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground mb-0.5">Última Atualização</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Há 14 dias · 12 de Outubro</p>
                  <a href="#" className="inline-block mt-2 text-[10px] font-bold text-secondary hover:underline tracking-tight uppercase">
                    Ver histórico completo
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </PageScaffold>
  );
}
