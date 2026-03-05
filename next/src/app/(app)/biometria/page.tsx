"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Ruler } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StudentPicker } from "@/components/ui/student-picker";
import { UnitInput } from "@/components/ui/unit-input";
import { Button } from "@/components/ui/button";
import { ZoneBadge } from "@/components/ui/zone-badge";

interface StudentOption {
  id: string;
  name: string;
  birthDate: string;
  sex: string;
}

interface Classification {
  imc: number;
  imcZone: string;
  waistZone: string | null;
}

export default function BiometriaPage() {
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
        body.students.map((s: Record<string, string>) => ({
          id: s.id,
          name: s.name,
          birthDate: s.birthDate,
          sex: s.sex,
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

  /* compute BMI on-the-fly */
  useEffect(() => {
    const h = parseFloat(form.heightM);
    const w = parseFloat(form.weightKg);
    if (h > 0 && w > 0) {
      const bmi = w / (h * h);
      const student = students.find((s) => s.id === studentId);
      if (student) {
        setClassification({
          imc: Math.round(bmi * 10) / 10,
          imcZone: bmi < 25 ? "healthy" : "risk",
          waistZone: form.waistCm ? (parseFloat(form.waistCm) < 80 ? "healthy" : "risk") : null,
        });
      }
    } else {
      setClassification(null);
    }
  }, [form.heightM, form.weightKg, form.waistCm, studentId, students]);

  const set = (key: string) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error("Selecione um aluno.");
      return;
    }
    setSaving(true);

    try {
      const h = parseFloat(form.heightM);
      const w = parseFloat(form.weightKg);
      const bmi = Math.round((w / (h * h)) * 10) / 10;
      const res = await fetch(`/api/students/${studentId}/biometrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heightM: h,
          weightKg: w,
          waistCm: form.waistCm ? parseFloat(form.waistCm) : undefined,
          fatPct: form.fatPct ? parseFloat(form.fatPct) : undefined,
          imc: bmi,
          imcZone: bmi < 25 ? "ZSAF" : "FZSAF",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Erro ao gravar biometria.");
        return;
      }

      toast.success("Biometria registada com sucesso!");
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
        title="Biometria"
        description="Registar medições antropométricas e classificação ZAF"
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
            label="Altura"
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
            label="Peso"
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
            label="Perímetro cintura"
            unit="cm"
            value={form.waistCm}
            onChange={set("waistCm")}
            placeholder="70"
            step="0.1"
          />
          <UnitInput
            label="Massa gorda"
            unit="%"
            value={form.fatPct}
            onChange={set("fatPct")}
            placeholder="18.0"
            step="0.1"
          />
        </div>

        {/* Live classification */}
        {classification && (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-navy-50 dark:bg-navy-900/30">
            <span className="text-sm font-medium">
              IMC: <strong className="text-lg">{classification.imc}</strong>
            </span>
            <ZoneBadge zone={classification.imcZone as "healthy" | "risk"} />
            {classification.waistZone && (
              <>
                <span className="text-muted-foreground">|</span>
                <span className="text-sm">Cintura:</span>
                <ZoneBadge zone={classification.waistZone as "healthy" | "risk"} />
              </>
            )}
          </div>
        )}

        <Button
          type="submit"
          loading={saving}
          icon={<Ruler className="size-4" />}
          className="self-start"
        >
          Gravar biometria
        </Button>
      </form>
    </div>
  );
}
