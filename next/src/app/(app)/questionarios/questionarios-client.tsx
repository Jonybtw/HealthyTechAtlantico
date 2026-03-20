"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ClipboardList, Clock, Link2, ShieldAlert } from "lucide-react";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { StudentPicker } from "@/components/ui/student-picker";
import { PillSelect } from "@/components/ui/pill-select";
import { RangeSlider } from "@/components/ui/range-slider";
import { NumericStepper } from "@/components/ui/numeric-stepper";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useUser } from "@/components/user-context";
import { readApiResponse } from "@/lib/api-client";

const MAX_DEFERRALS = 3;
const STRESS_COLORS = ["bg-green-500", "bg-lime-500", "bg-yellow-500", "bg-orange-500", "bg-red-500"];

const ROUTINE_QUESTIONS = [
  { key: "sleepHours", labelKey: "sleepHoursLabel", min: 0, max: 12, step: 0.5, unitKey: "unitHours" },
  { key: "screenHours", labelKey: "screenHoursLabel", min: 0, max: 16, step: 0.5, unitKey: "unitHours" },
  { key: "waterGlasses", labelKey: "waterGlassesLabel", min: 0, max: 15, step: 1, unitKey: "unitGlasses" },
  { key: "mealsCount", labelKey: "mealsCountLabel", min: 0, max: 8, step: 1, unitKey: "unitMeals" },
  { key: "energyLevel", labelKey: "energyLevelLabel", min: 0, max: 10, step: 1, slider: true },
  { key: "stressLevel", labelKey: "stressLevelLabel", min: 0, max: 10, step: 1, slider: true },
  { key: "wellnessLevel", labelKey: "wellnessLevelLabel", min: 0, max: 10, step: 1, slider: true },
];

const INITIAL_QUESTIONS = [
  { key: "physicalActivityFreq", labelKey: "physicalActivityLabel", min: 0, max: 7, step: 1, unitKey: "unitDays" },
  { key: "sportsPractice", labelKey: "sportsPracticeLabel", type: "yesno" as const },
  { key: "hasAllergies", labelKey: "hasAllergiesLabel", type: "yesno" as const },
  { key: "hasMedication", labelKey: "hasMedicationLabel", type: "yesno" as const },
  { key: "hasInjuries", labelKey: "hasInjuriesLabel", type: "yesno" as const },
  { key: "eatsBreakfast", labelKey: "eatsBreakfastLabel", type: "yesno" as const },
  { key: "eatsFruitsVegetables", labelKey: "eatsFruitsVegetablesLabel", type: "yesno" as const },
  { key: "drinksWaterEnough", labelKey: "drinksWaterEnoughLabel", type: "yesno" as const },
];

type StudentOption = { id: string; name: string; className?: string | null };
type QuestionnaireSummary = { deferredCount: number };

export default function QuestionariosPage() {
  const t = useTranslations("questionarios");
  const common = useTranslations("common");
  const { role } = useUser();

  const [students, setStudents] = useState<{ id: string; name: string; className?: string | null }[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
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
    setLoadingStudents(true);
    try {
      const res = await fetch("/api/students?limit=500");
      const body = await readApiResponse<{ students: StudentOption[] }>(res);
      const nextStudents = body.students.map((student) => ({
        id: student.id,
        name: student.name,
        className: student.className ?? null,
      }));

      setStudents(nextStudents);
      if (role === "ALUNO" && nextStudents.length === 1) {
        setStudentId(nextStudents[0].id);
      }
    } catch {
      setStudents([]);
      toast.error(common("studentListLoadError"));
    } finally {
      setLoadingStudents(false);
    }
  }, [role, common]);

  // Load latest questionnaire to get deferredCount
  const loadLatestQ = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/students/${sid}/questionnaires?limit=1`);
      const questionnaires = await readApiResponse<QuestionnaireSummary[]>(res);
      const latest = questionnaires[0];
      setDeferredCount(latest?.deferredCount ?? 0);
    } catch {
      setDeferredCount(0);
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
      <PageScaffold headerProps={{ title: t("title"), description: t("description") }}>
        <EmptyState
          icon={ShieldAlert}
          title={t("studentOnlyTitle")}
          description={t("studentOnlyDescription")}
          action={
            <Link href="/dashboard" className={buttonVariants({ size: "sm", variant: "ghost" })}>
              {t("openDashboard")}
            </Link>
          }
        />
      </PageScaffold>
    );
  }

  if (role === "ALUNO" && !loadingStudents && students.length === 0) {
    return (
      <PageScaffold headerProps={{ title: t("title"), description: t("description") }}>
        <EmptyState
          icon={Link2}
          title={t("unlinkedTitle")}
          description={t("unlinkedDescription")}
        />
      </PageScaffold>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitQuestionnaire(false);
  };

  const submitQuestionnaire = async (deferred: boolean) => {
    if (!studentId) {
      toast.error(t("selectStudentError"));
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
      await readApiResponse(res);
      if (deferred) {
        setDeferredCount((c) => c + 1);
        toast.info(`${t("defer")}. ${deferralsLeft - 1} ${t("deferCount")}.`);
      } else {
        setDeferredCount(0);
        toast.success(t("success"));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("connectionError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageScaffold headerProps={{ title: t("title"), description: t("description") }}>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

        {/* LEFT — Form */}
        <PageSection tone="primary" layout="form" className="animate-fade-in-up">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {role !== "ALUNO" && (
              <StudentPicker
                students={students}
                value={studentId}
                onChange={setStudentId}
                loading={loadingStudents}
              />
            )}

            <PillSelect
              size="lg"
              options={[
                { value: "AUTOCONCEITO", label: t("autoconceito") },
                { value: "AUTOESTIMA", label: t("autoestima") },
              ]}
              value={qType}
              onChange={(v) => setQType(v as "AUTOCONCEITO" | "AUTOESTIMA")}
            />

            {/* Autoconceito questions */}
            {qType === "AUTOCONCEITO" && (
              <div className="flex flex-col gap-4">
                {ROUTINE_QUESTIONS.map((q) =>
                  q.slider ? (
                    <RangeSlider
                      key={q.key}
                      label={t(q.labelKey)}
                      min={q.min}
                      max={q.max}
                      step={q.step}
                      value={routineData[q.key as keyof typeof routineData] as number}
                      onChange={(v) => setRoutineData((d) => ({ ...d, [q.key]: v }))}
                      labels={q.key === "stressLevel" ? [t("stressNone"), t("stressLow"), t("stressModerate"), t("stressHigh"), t("stressExtreme")] : undefined}
                      colorStops={q.key === "stressLevel" ? STRESS_COLORS : undefined}
                    />
                  ) : (
                    <NumericStepper
                      key={q.key}
                      label={t(q.labelKey)}
                      min={q.min}
                      max={q.max}
                      step={q.step}
                      value={routineData[q.key as keyof typeof routineData] as number}
                      onChange={(v) => setRoutineData((d) => ({ ...d, [q.key]: v }))}
                      unit={q.unitKey ? t(q.unitKey) : undefined}
                    />
                  )
                )}
              </div>
            )}

            {/* Autoestima questions */}
            {qType === "AUTOESTIMA" && (
              <div className="flex flex-col gap-3">
                {INITIAL_QUESTIONS.map((q) =>
                  q.type === "yesno" ? (
                    <div key={q.key} className="flex items-center justify-between">
                      <label className="text-xs font-medium">{t(q.labelKey)}</label>
                      <PillSelect
                        options={[
                          { value: "true", label: t("yes") },
                          { value: "false", label: t("no") },
                        ]}
                        value={String(initialData[q.key as keyof typeof initialData])}
                        onChange={(v) =>
                          setInitialData((d) => ({ ...d, [q.key]: v === "true" }))
                        }
                      />
                    </div>
                  ) : (
                    <NumericStepper
                      key={q.key}
                      label={t(q.labelKey)}
                      min={q.min}
                      max={q.max}
                      step={q.step}
                      value={initialData[q.key as keyof typeof initialData] as number}
                      onChange={(v) => setInitialData((d) => ({ ...d, [q.key]: v }))}
                      unit={q.unitKey ? t(q.unitKey) : undefined}
                    />
                  )
                )}
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
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
        </PageSection>

        {/* RIGHT — Wellness Summary */}
        <div className="lg:sticky lg:top-6 flex flex-col gap-3">
          <PageSection
            tone="secondary"
            layout="list"
            title={
              <span className="flex items-center gap-2">
                <ClipboardList className="size-4 text-navy-600 dark:text-gold-400" />
                {t(qType === "AUTOCONCEITO" ? "autoconceito" : "autoestima")}
              </span>
            }
          >

            {qType === "AUTOCONCEITO" ? (
              <div className="flex flex-col gap-3">
                {[
                  { key: "energyLevel", labelKey: "energyLevelLabel", invert: false },
                  { key: "stressLevel", labelKey: "stressLevelLabel", invert: true },
                  { key: "wellnessLevel", labelKey: "wellnessLevelLabel", invert: false },
                ].map(({ key, labelKey, invert }) => {
                  const val = routineData[key as keyof typeof routineData] as number;
                  const color = invert
                    ? val >= 7 ? "bg-danger-500" : val >= 4 ? "bg-warning-500" : "bg-success-500"
                    : val >= 7 ? "bg-success-500" : val >= 4 ? "bg-warning-500" : "bg-danger-400";
                  return (
                    <div key={key} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{t(labelKey)}</span>
                        <span className="text-xs font-bold tabular-nums">{val}/10</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${val * 10}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-2.5">
                  {[
                    { key: "sleepHours", labelKey: "sleepHoursLabel", unitKey: "unitHours" },
                    { key: "screenHours", labelKey: "screenHoursLabel", unitKey: "unitHours" },
                    { key: "waterGlasses", labelKey: "waterGlassesLabel", unitKey: "unitGlasses" },
                    { key: "mealsCount", labelKey: "mealsCountLabel", unitKey: "unitMeals" },
                  ].map(({ key, labelKey, unitKey }) => (
                    <div key={key} className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground truncate">{t(labelKey)}</span>
                      <span className="text-sm font-bold tabular-nums">
                        {routineData[key as keyof typeof routineData]}
                        <span className="text-xs font-normal text-muted-foreground ml-1">{t(unitKey)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {INITIAL_QUESTIONS.filter((q) => q.type === "yesno").map((q) => {
                  const val = initialData[q.key as keyof typeof initialData] as boolean;
                  return (
                    <div key={q.key} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground truncate max-w-[160px]">{t(q.labelKey)}</span>
                      <span className={`text-xs font-semibold ${val ? "text-success-600 dark:text-success-400" : "text-muted-foreground"}`}>
                        {val ? t("yes") : t("no")}
                      </span>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-border/50 flex flex-col gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("physicalActivityLabel")}</span>
                  <div className="flex items-center gap-1">
                    {[0,1,2,3,4,5,6].map((day) => (
                      <div
                        key={day}
                        className={`flex-1 h-1.5 rounded-sm transition-colors ${day < initialData.physicalActivityFreq ? "bg-success-500" : "bg-muted/50"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold tabular-nums">{initialData.physicalActivityFreq} <span className="text-xs font-normal text-muted-foreground">{t("unitDays")}</span></span>
                </div>
              </div>
            )}
          </PageSection>

          {studentId && (
            <PageSection tone="utility" layout="list" className="gap-0" contentClassName="gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">{t("deferralsUsed", { used: deferredCount, max: MAX_DEFERRALS })}</span>
                <span className={deferralsLeft === 0 ? "text-danger-500 font-semibold" : "text-muted-foreground"}>
                  {deferralsLeft === 0 ? t("limitReached") : t("remaining", { count: deferralsLeft })}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out-expo ${
                    deferredCount >= MAX_DEFERRALS ? "bg-danger-500" : deferredCount >= 2 ? "bg-warning-500" : "bg-success-500"
                  }`}
                  style={{ width: `${Math.min((deferredCount / MAX_DEFERRALS) * 100, 100)}%` }}
                />
              </div>
            </PageSection>
          )}
        </div>

      </div>
    </PageScaffold>
  );
}
