"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ClipboardList, Clock, Link2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StudentPicker } from "@/components/ui/student-picker";
import { PillSelect } from "@/components/ui/pill-select";
import { RangeSlider } from "@/components/ui/range-slider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useUser } from "@/components/user-context";

const MAX_DEFERRALS = 3;
const STRESS_LABELS = ["Nenhum", "Baixo", "Moderado", "Elevado", "Extremo"];
const STRESS_COLORS = ["bg-green-500", "bg-lime-500", "bg-yellow-500", "bg-orange-500", "bg-red-500"];

const ROUTINE_QUESTIONS = [
  { key: "sleepHours", label: "Horas de sono (noite anterior)", min: 0, max: 12, step: 0.5, unit: "h" },
  { key: "screenHours", label: "Horas de ecrã (dia anterior)", min: 0, max: 16, step: 0.5, unit: "h" },
  { key: "waterGlasses", label: "Copos de água (dia anterior)", min: 0, max: 15, step: 1, unit: "copos" },
  { key: "mealsCount", label: "Refeições no dia anterior", min: 0, max: 8, step: 1, unit: "refeições" },
  { key: "energyLevel", label: "Nível de energia", min: 0, max: 10, step: 1, slider: true },
  { key: "stressLevel", label: "Nível de stress", min: 0, max: 10, step: 1, slider: true },
  { key: "wellnessLevel", label: "Nível de bem-estar", min: 0, max: 10, step: 1, slider: true },
];

const INITIAL_QUESTIONS = [
  { key: "physicalActivityFreq", label: "Frequência de atividade física semanal", min: 0, max: 7, step: 1, unit: "dias" },
  { key: "sportsPractice", label: "Pratica desporto organizado?", type: "yesno" as const },
  { key: "hasAllergies", label: "Tem alergias?", type: "yesno" as const },
  { key: "hasMedication", label: "Toma medicação?", type: "yesno" as const },
  { key: "hasInjuries", label: "Tem lesões?", type: "yesno" as const },
  { key: "eatsBreakfast", label: "Toma pequeno-almoço habitualmente?", type: "yesno" as const },
  { key: "eatsFruitsVegetables", label: "Come fruta/vegetais diariamente?", type: "yesno" as const },
  { key: "drinksWaterEnough", label: "Bebe água suficiente?", type: "yesno" as const },
];

export default function QuestionariosPage() {
  const t = useTranslations("questionarios");
  const common = useTranslations("common");
  const { role } = useUser();

  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [qType, setQType] = useState<"AUTOCONCEITO" | "AUTOESTIMA">("AUTOCONCEITO");
  const [saving, setSaving] = useState(false);
  const [deferredCount, setDeferredCount] = useState(0);

  // Routine answers
  const [routineData, setRoutineData] = useState({
    sleepHours: 8,
    screenHours: 2,
    waterGlasses: 6,
    mealsCount: 4,
    energyLevel: 7,
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
    eatsBreakfast: true,
    eatsFruitsVegetables: false,
    drinksWaterEnough: false,
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

  // Load latest questionnaire to get deferredCount
  const loadLatestQ = useCallback(async (sid: string) => {
    const res = await fetch(`/api/students/${sid}/questionnaires?limit=1`);
    if (res.ok) {
      const body = await res.json();
      const latest = Array.isArray(body) ? body[0] : body?.questionnaires?.[0];
      setDeferredCount(latest?.deferredCount ?? 0);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (studentId) loadLatestQ(studentId);
    else setDeferredCount(0);
  }, [studentId, loadLatestQ]);

  const deferralsLeft = MAX_DEFERRALS - deferredCount;

  if (role && role !== "ALUNO") {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">{common("noPermission")}</p>
      </div>
    );
  }

  if (role === "ALUNO" && students.length === 0) {
    return (
      <div className="flex flex-col gap-5">
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
    await submitQuestionnaire(false);
  };

  const submitQuestionnaire = async (deferred: boolean) => {
    if (!studentId) {
      toast.error("Selecione um aluno.");
      return;
    }
    if (deferred && deferralsLeft <= 0) {
      toast.error(t("maxDeferred"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type: qType,
        payload: qType === "AUTOCONCEITO" ? routineData : initialData,
        deferredCount: deferred ? deferredCount + 1 : 0,
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
      if (deferred) {
        setDeferredCount((c) => c + 1);
        toast.info(`${t("defer")}. ${deferralsLeft - 1} ${t("deferCount")}.`);
      } else {
        setDeferredCount(0);
        toast.success(t("success"));
      }
    } catch {
      toast.error("Erro de ligação.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <form
        onSubmit={handleSubmit}
        className="animate-fade-in-up bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-5 flex flex-col gap-5 max-w-lg"
      >
        {role !== "ALUNO" && (
          <StudentPicker students={students} value={studentId} onChange={setStudentId} />
        )}

        {/* Deferral progress */}
        {studentId && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Adiamentos usados: {deferredCount} / {MAX_DEFERRALS}</span>
              <span className={deferralsLeft === 0 ? "text-red-500 font-medium" : ""}>
                {deferralsLeft === 0 ? "Limite atingido" : `${deferralsLeft} restantes`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out-expo ${deferredCount >= MAX_DEFERRALS
                    ? "bg-red-500"
                    : deferredCount >= 2
                      ? "bg-amber-500"
                      : "bg-green-500"
                  }`}
                style={{ width: `${Math.min((deferredCount / MAX_DEFERRALS) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        <PillSelect
          options={[
            { value: "AUTOCONCEITO", label: t("autoconceito") },
            { value: "AUTOESTIMA", label: t("autoestima") },
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
                      className="w-24 rounded-xl border border-border/50 px-4 py-2 text-sm bg-background/50 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:bg-background transition-all shadow-inner inset-shadow-sm text-center font-medium"
                    />
                    {q.unit && <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">{q.unit}</span>}
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
                      className="w-24 rounded-xl border border-border/50 px-4 py-2 text-sm bg-background/50 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:bg-background transition-all shadow-inner inset-shadow-sm text-center font-medium"
                    />
                    {q.unit && <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">{q.unit}</span>}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <Button
            type="button"
            variant="secondary"
            loading={saving}
            icon={<Clock className="size-4" />}
            onClick={() => submitQuestionnaire(true)}
            disabled={deferralsLeft <= 0 || !studentId}
            className="self-start"
          >
            {t("defer")} ({deferralsLeft})
          </Button>
          <Button
            type="submit"
            loading={saving}
            icon={<ClipboardList className="size-4" />}
            className="self-start"
          >
            {t("submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
