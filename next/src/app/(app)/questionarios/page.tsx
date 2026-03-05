"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StudentPicker } from "@/components/ui/student-picker";
import { PillSelect } from "@/components/ui/pill-select";
import { RangeSlider } from "@/components/ui/range-slider";
import { Button } from "@/components/ui/button";

const STRESS_LABELS = ["Nenhum", "Baixo", "Moderado", "Elevado", "Extremo"];
const STRESS_COLORS = ["bg-green-500", "bg-lime-500", "bg-yellow-500", "bg-orange-500", "bg-red-500"];

const ROUTINE_QUESTIONS = [
  { key: "sleepHours", label: "Horas de sono (noite anterior)", min: 0, max: 12, step: 0.5, unit: "h" },
  { key: "screenHours", label: "Horas de ecrã (dia anterior)", min: 0, max: 16, step: 0.5, unit: "h" },
  { key: "stressLevel", label: "Nível de stress", min: 0, max: 10, step: 1, slider: true },
  { key: "wellnessLevel", label: "Nível de bem-estar", min: 0, max: 10, step: 1, slider: true },
];

const INITIAL_QUESTIONS = [
  { key: "physicalActivityFreq", label: "Frequência de atividade física semanal", min: 0, max: 7, step: 1, unit: "dias" },
  { key: "sportsPractice", label: "Pratica desporto organizado?", type: "yesno" as const },
  { key: "hasAllergies", label: "Tem alergias?", type: "yesno" as const },
  { key: "hasMedication", label: "Toma medicação?", type: "yesno" as const },
  { key: "hasInjuries", label: "Tem lesões?", type: "yesno" as const },
];

export default function QuestionariosPage() {
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown>)?.role as string;

  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [qType, setQType] = useState<"AUTOCONCEITO" | "AUTOESTIMA">("AUTOCONCEITO");
  const [saving, setSaving] = useState(false);

  // Routine answers
  const [routineData, setRoutineData] = useState({
    sleepHours: 8,
    screenHours: 2,
    stressLevel: 3,
    wellnessLevel: 7,
  });

  // Initial answers
  const [initialData, setInitialData] = useState({
    physicalActivityFreq: 3,
    sportsPractice: false,
    hasAllergies: false,
    hasMedication: false,
    hasInjuries: false,
  });

  const loadStudents = useCallback(async () => {
    const res = await fetch("/api/students?limit=500");
    if (res.ok) {
      const body = await res.json();
      setStudents(body.students.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
      if (role === "ALUNO" && body.students.length === 1) {
        setStudentId(body.students[0].id);
      }
    }
  }, [role]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error("Selecione um aluno.");
      return;
    }
    setSaving(true);

    try {
      const payload = {
        type: qType,
        payload: qType === "AUTOCONCEITO" ? routineData : initialData,
        deferredCount: 0,
      };

      const res = await fetch(`/api/students/${studentId}/questionnaires`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Erro ao submeter questionário.");
        return;
      }

      toast.success("Questionário submetido com sucesso!");
    } catch {
      toast.error("Erro de ligação.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Questionários"
        description="Questionário inicial e de rotina para cada sessão"
      />

      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-xl border border-border p-6 flex flex-col gap-5 max-w-lg"
      >
        {role !== "ALUNO" && (
          <StudentPicker students={students} value={studentId} onChange={setStudentId} />
        )}

        <PillSelect
          options={[
            { value: "AUTOCONCEITO", label: "Autoconceito" },
            { value: "AUTOESTIMA", label: "Autoestima" },
          ]}
          value={qType}
          onChange={(v) => setQType(v as "AUTOCONCEITO" | "AUTOESTIMA")}
        />

        {/* ── Autoconceito questions ── */}
        {qType === "AUTOCONCEITO" && (
          <div className="flex flex-col gap-5">
            {ROUTINE_QUESTIONS.map((q) =>
              q.slider ? (
                <RangeSlider
                  key={q.key}
                  label={q.label}
                  min={q.min}
                  max={q.max}
                  step={q.step}
                  value={routineData[q.key as keyof typeof routineData] as number}
                  onChange={(v) => setRoutineData((d) => ({ ...d, [q.key]: v }))}
                  labels={q.key === "stressLevel" ? STRESS_LABELS : undefined}
                  colorStops={q.key === "stressLevel" ? STRESS_COLORS : undefined}
                />
              ) : (
                <div key={q.key} className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">{q.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={q.min}
                      max={q.max}
                      step={q.step}
                      value={routineData[q.key as keyof typeof routineData]}
                      onChange={(e) =>
                        setRoutineData((d) => ({
                          ...d,
                          [q.key]: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-20 rounded-lg border border-border px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                    />
                    {q.unit && <span className="text-sm text-muted-foreground">{q.unit}</span>}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* ── Autoestima questions ── */}
        {qType === "AUTOESTIMA" && (
          <div className="flex flex-col gap-4">
            {INITIAL_QUESTIONS.map((q) =>
              q.type === "yesno" ? (
                <div key={q.key} className="flex items-center justify-between">
                  <label className="text-sm font-medium">{q.label}</label>
                  <PillSelect
                    options={[
                      { value: "true", label: "Sim" },
                      { value: "false", label: "Não" },
                    ]}
                    value={String(initialData[q.key as keyof typeof initialData])}
                    onChange={(v) =>
                      setInitialData((d) => ({ ...d, [q.key]: v === "true" }))
                    }
                  />
                </div>
              ) : (
                <div key={q.key} className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">{q.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={q.min}
                      max={q.max}
                      step={q.step}
                      value={initialData[q.key as keyof typeof initialData] as number}
                      onChange={(e) =>
                        setInitialData((d) => ({
                          ...d,
                          [q.key]: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-20 rounded-lg border border-border px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                    />
                    {q.unit && <span className="text-sm text-muted-foreground">{q.unit}</span>}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        <Button
          type="submit"
          loading={saving}
          icon={<ClipboardList className="size-4" />}
          className="self-start"
        >
          Submeter questionário
        </Button>
      </form>
    </div>
  );
}
