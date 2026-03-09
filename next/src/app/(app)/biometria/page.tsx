"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Link2, Ruler } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StudentPicker } from "@/components/ui/student-picker";
import { UnitInput } from "@/components/ui/unit-input";
import { Button } from "@/components/ui/button";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { classifyBmi, classifyWaist, calcAgeFromBirthDate } from "@/lib/zaf";
import type { Sex } from "@prisma/client";

interface StudentOption {
  id: string;
  name: string;
  birthDate: string | null;
  sex: Sex;
  age: number | null;
}

interface Classification {
  imc: number;
  imcZone: string;
  waistZone: string | null;
}

export default function BiometriaPage() {
  const t = useTranslations("biometria");
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown>)?.role as string;

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [form, setForm] = useState({
    heightM: "",
    weightKg: "",
    waistCm: "",
    fatPct: "",
  });
  const [classification, setClassification] = useState<Classification | null>(null);
  const [saving, setSaving] = useState(false);

  /* load student list (teachers) or own student (alunos) */
  const loadStudents = useCallback(async () => {
    const res = await fetch("/api/students?limit=500");
    if (res.ok) {
      const body = await res.json();
      setStudents(
        body.students.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          name: s.name as string,
          birthDate: (s.birthDate as string | null) ?? null,
          sex: (s.sex as Sex) ?? "M",
          age: s.age != null ? Number(s.age) : null,
        }))
      );
      // auto-select for aluno
      if (role === "ALUNO" && body.students.length === 1) {
        setStudentId(body.students[0].id);
      }
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
        const imcZone = imcResult?.zone ?? (bmi <= 25 ? "Zona Saudável" : "Zona de Melhoria");

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
      <div className="flex flex-col gap-6">
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState
          icon={Link2}
          title="Perfil não associado"
          description="A tua conta ainda não está associada a um perfil de aluno. Contacta a escola para concluírem a ligação."
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
      const imcZone = imcResult?.zone ?? (bmi <= 25 ? "Zona Saudável" : "Zona de Melhoria");

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
        toast.error(body.error ?? "Erro ao gravar biometria.");
        return;
      }

      toast.success(t("success"));
      setForm({ heightM: "", weightKg: "", waistCm: "", fatPct: "" });
      setClassification(null);
    } catch {
      toast.error("Erro de ligação.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-xl border border-border p-6 flex flex-col gap-5 max-w-lg"
      >
        {/* Student Picker — hidden for ALUNOs */}
        {role !== "ALUNO" && (
          <StudentPicker
            students={students.map((s) => ({ id: s.id, name: s.name }))}
            value={studentId}
            onChange={setStudentId}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
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

        {/* Live classification */}
        {classification && (
          <div
            className={`relative overflow-hidden flex flex-wrap items-center gap-4 p-5 rounded-xl border animate-scale-in transition-all duration-500 shadow-sm
              ${classification.imcZone.includes("Saud") || classification.imcZone === "ZSAF"
                ? "bg-success-50/50 dark:bg-success-900/10 border-success-200 dark:border-success-800/30"
                : "bg-warning-50/50 dark:bg-warning-900/10 border-warning-200 dark:border-warning-800/30"
              }
            `}
          >
            {/* Dynamic background pulse */}
            <div
              className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 animate-pulse-ring
                ${classification.imcZone.includes("Saud") || classification.imcZone === "ZSAF" ? "bg-success-400" : "bg-warning-400"}
              `}
            />

            <div className="flex flex-col relative z-10">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{t("bmi")}</span>
              <strong className="text-3xl font-bold tracking-tighter tabular-nums text-foreground">{classification.imc}</strong>
            </div>

            <div className="w-px h-10 bg-border mx-1 hidden sm:block relative z-10" />

            <div className="flex flex-col gap-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground w-12">IMC:</span>
                <ZoneBadge zone={classification.imcZone} />
              </div>

              {classification.waistZone && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-12">{t("waistClassLabel")}:</span>
                  <ZoneBadge zone={classification.waistZone} />
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          type="submit"
          loading={saving}
          icon={<Ruler className="size-4" />}
          className="self-start"
        >
          {t("save")}
        </Button>
      </form>
    </div>
  );
}
