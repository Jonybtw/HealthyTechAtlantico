"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  History,
  Link2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { RangeSlider } from "@/components/ui/range-slider";
import { NumericStepper } from "@/components/ui/numeric-stepper";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Button,
  buttonVariants,
  interactiveControlClasses,
} from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useUser } from "@/components/user-context";
import { readApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  getKidmedClassificationFeedbackKey,
  getKidmedClassificationLabelKey,
  getKidmedPeriodLabelKey,
  getQuestionnairePreviewItems,
  getQuestionnaireTypeLabelKey,
  getSchoolPeriodInfo,
  INITIAL_QUESTIONS,
  KIDMED_QUESTIONS,
  QUESTIONNAIRE_FIELD_META,
  QUESTIONNAIRE_INSTRUMENTS,
  QUESTIONNAIRE_TYPES,
  ROUTINE_QUESTIONS,
  type KidmedAnswers,
  type KidmedClassification,
  type QuestionnaireTypeValue,
} from "@/lib/questionnaires";

const MAX_DEFERRALS = 3;
const HISTORY_LIMIT = 5;
const STRESS_COLORS = [
  "bg-green-500",
  "bg-lime-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-red-500",
];
const ROUTINE_PRESETS = {
  sleepHours: [
    { labelKey: "presetSleepShort", value: 6 },
    { labelKey: "presetSleepIdeal", value: 8 },
    { labelKey: "presetSleepLong", value: 10 },
  ],
  screenHours: [
    { labelKey: "presetScreenLow", value: 1 },
    { labelKey: "presetScreenBalanced", value: 2 },
    { labelKey: "presetScreenHigh", value: 4 },
  ],
  waterGlasses: [
    { labelKey: "presetWaterLow", value: 4 },
    { labelKey: "presetWaterBalanced", value: 6 },
    { labelKey: "presetWaterHigh", value: 8 },
  ],
  mealsCount: [
    { labelKey: "presetMealsLight", value: 3 },
    { labelKey: "presetMealsBalanced", value: 4 },
    { labelKey: "presetMealsHigh", value: 5 },
  ],
} as const;
const ROUTINE_HELPERS = {
  sleepHours: "sleepHoursHelper",
  screenHours: "screenHoursHelper",
  waterGlasses: "waterGlassesHelper",
  mealsCount: "mealsCountHelper",
} as const;
const ROUTINE_ACCENTS = {
  sleepHours: "navy",
  screenHours: "gold",
  waterGlasses: "success",
  mealsCount: "gold",
} as const;
const ROUTINE_QUICK_CHOICES = {
  energyLevel: [
    { labelKey: "quickEnergyLow", value: 3 },
    { labelKey: "quickEnergyMid", value: 6 },
    { labelKey: "quickEnergyHigh", value: 9 },
  ],
  stressLevel: [
    { labelKey: "quickStressLow", value: 2 },
    { labelKey: "quickStressMid", value: 5 },
    { labelKey: "quickStressHigh", value: 8 },
  ],
  wellnessLevel: [
    { labelKey: "quickWellnessLow", value: 3 },
    { labelKey: "quickWellnessMid", value: 6 },
    { labelKey: "quickWellnessHigh", value: 9 },
  ],
} as const;
const INITIAL_PRESETS = {
  physicalActivityFreq: [
    { labelKey: "presetActivityLow", value: 2 },
    { labelKey: "presetActivityMid", value: 3 },
    { labelKey: "presetActivityHigh", value: 5 },
  ],
} as const;

type StudentOption = {
  id: string;
  name: string;
  className?: string | null;
  schoolYear?: string | null;
  birthDate?: string | null;
  kidmedConsentAt?: string | null;
};

type QuestionnaireRecord = {
  id: string;
  type: QuestionnaireTypeValue;
  payload: Record<string, unknown>;
  deferredCount: number;
  submittedAt: string;
  instrumentVersion: string | null;
  schoolYear: string | null;
  periodKey: string | null;
  score: number | null;
  classification: KidmedClassification | null;
};

type WizardStep = "choose" | "answer" | "review";
type RoutineStage = "habits" | "perception";

function formatStudentAge(birthDate: string | null | undefined) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() >= birth.getDate());
  if (!hasBirthdayPassed) age -= 1;
  return age >= 0 ? age : null;
}

function formatBadgeValue(
  t: (key: string, values?: Record<string, string | number>) => string,
  value: unknown,
  meta: { unitKey?: string; scaleMax?: number },
) {
  if (typeof value === "boolean") return value ? t("yes") : t("no");
  if (typeof value === "number") {
    if (meta.scaleMax) return `${value}/${meta.scaleMax}`;
    if (meta.unitKey) return `${value} ${t(meta.unitKey)}`;
    return String(value);
  }
  if (typeof value === "string" && value.length > 0) return value;
  return "-";
}

function formatKidmedPeriodLabel(
  t: (key: string, values?: Record<string, string | number>) => string,
  questionnaire: Pick<QuestionnaireRecord, "periodKey" | "schoolYear">,
) {
  const period = questionnaire.periodKey?.split(":")[1];
  if (
    (period === "P1" || period === "P2" || period === "P3") &&
    questionnaire.schoolYear
  ) {
    return `${t(getKidmedPeriodLabelKey(period))} - ${questionnaire.schoolYear}`;
  }
  return questionnaire.periodKey ?? questionnaire.schoolYear ?? "-";
}

function getInstrumentEstimatedTime(type: QuestionnaireTypeValue) {
  switch (type) {
    case "AUTOCONCEITO":
      return "2-3 min";
    case "AUTOESTIMA":
      return "3-4 min";
    case "KIDMED":
      return "4-5 min";
  }
}

function getStepOrder(currentStep: WizardStep) {
  switch (currentStep) {
    case "choose":
      return 1;
    case "answer":
      return 2;
    case "review":
      return 3;
  }
}

export default function QuestionariosPage() {
  const t = useTranslations("questionarios");
  const common = useTranslations("common");
  const { role } = useUser();
  const locale = useLocale();

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [qType, setQType] = useState<QuestionnaireTypeValue>("AUTOCONCEITO");
  const [saving, setSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deferredCount, setDeferredCount] = useState(0);
  const [questionnaireHistory, setQuestionnaireHistory] = useState<
    QuestionnaireRecord[]
  >([]);
  const [currentStep, setCurrentStep] = useState<WizardStep>("choose");
  const [reviewUnlocked, setReviewUnlocked] = useState(false);
  const [routineStage, setRoutineStage] = useState<RoutineStage>("habits");
  const [routineData, setRoutineData] = useState({
    sleepHours: 8,
    screenHours: 2,
    waterGlasses: 6,
    mealsCount: 4,
    energyLevel: 7,
    stressLevel: 3,
    wellnessLevel: 7,
  });
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
  const [kidmedData, setKidmedData] = useState<KidmedAnswers>({
    fruitDaily: false,
    secondFruitDaily: false,
    vegetablesDaily: false,
    vegetablesMoreThanOnceDaily: false,
    fishRegularly: false,
    fastFoodWeekly: false,
    pulsesMoreThanOnceWeekly: false,
    wholeGrainPastaOrRice: false,
    wholeGrainsBreakfast: false,
    nutsRegularly: false,
    oliveOilAtHome: false,
    skipsBreakfast: false,
    dairyBreakfast: false,
    pastriesBreakfast: false,
    yogurtOrCheeseDaily: false,
    sweetsSeveralTimesDaily: false,
  });

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === studentId) ?? null,
    [studentId, students],
  );
  const selectedInstrument = QUESTIONNAIRE_INSTRUMENTS[qType];
  const currentPeriod = useMemo(() => getSchoolPeriodInfo(), []);
  const latestQuestionnaire = questionnaireHistory[0] ?? null;
  const studentAge = formatStudentAge(selectedStudent?.birthDate);
  const deferralsLeft = MAX_DEFERRALS - deferredCount;
  const isKidmed = qType === "KIDMED";
  const hasKidmedConsent = Boolean(selectedStudent?.kidmedConsentAt);
  const requiresAssistedMode =
    isKidmed && studentAge !== null && studentAge < 12;
  const kidmedCompletedThisPeriod =
    latestQuestionnaire?.type === "KIDMED" &&
    latestQuestionnaire.periodKey === currentPeriod.periodKey;
  const kidmedResult =
    latestQuestionnaire?.type === "KIDMED" ? latestQuestionnaire : null;
  const canOpenQuestions =
    Boolean(studentId) &&
    (!isKidmed || (hasKidmedConsent && !kidmedCompletedThisPeriod));
  const currentStepOrder = getStepOrder(currentStep);

  const formatDate = useCallback(
    (value: string | Date | null | undefined) => {
      if (!value) return "-";
      const date = value instanceof Date ? value : new Date(value);
      return date.toLocaleDateString(locale === "en" ? "en-GB" : "pt-PT", {
        dateStyle: "medium",
      });
    },
    [locale],
  );

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch("/api/students?limit=500");
      const body = await readApiResponse<{ students: StudentOption[] }>(res);
      const nextStudents = body.students.map((student) => ({
        id: student.id,
        name: student.name,
        className: student.className ?? null,
        schoolYear: student.schoolYear ?? null,
        birthDate: student.birthDate ?? null,
        kidmedConsentAt: student.kidmedConsentAt ?? null,
      }));
      setStudents(nextStudents);
      if (role === "ALUNO" && nextStudents.length === 1)
        setStudentId(nextStudents[0].id);
    } catch {
      setStudents([]);
      toast.error(common("studentListLoadError"));
    } finally {
      setLoadingStudents(false);
    }
  }, [common, role]);

  const loadQuestionnaireHistory = useCallback(
    async (sid: string, type: QuestionnaireTypeValue) => {
      setLoadingHistory(true);
      try {
        const res = await fetch(
          `/api/students/${sid}/questionnaires?type=${type}&limit=${HISTORY_LIMIT}`,
        );
        const questionnaires =
          await readApiResponse<QuestionnaireRecord[]>(res);
        setQuestionnaireHistory(questionnaires);
        setDeferredCount(
          QUESTIONNAIRE_INSTRUMENTS[type].supportsDeferral
            ? (questionnaires[0]?.deferredCount ?? 0)
            : 0,
        );
      } catch {
        setQuestionnaireHistory([]);
        setDeferredCount(0);
      } finally {
        setLoadingHistory(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!studentId) {
      setQuestionnaireHistory([]);
      setDeferredCount(0);
      return;
    }
    void loadQuestionnaireHistory(studentId, qType);
  }, [loadQuestionnaireHistory, qType, studentId]);

  useEffect(() => {
    setCurrentStep("choose");
    setReviewUnlocked(false);
    setRoutineStage("habits");
  }, [qType, studentId]);

  if (role && role !== "ALUNO") {
    return (
      <PageScaffold
        headerProps={{
          title: t("title"),
          description: t("description"),
          eyebrow: "ALUNOS · QUESTIONÁRIOS",
        }}
      >
        <EmptyState
          icon={ShieldAlert}
          title={t("studentOnlyTitle")}
          description={t("studentOnlyDescription")}
          action={
            <Link
              href="/dashboard"
              className={buttonVariants({ size: "sm", variant: "ghost" })}
            >
              {t("openDashboard")}
            </Link>
          }
        />
      </PageScaffold>
    );
  }

  if (role === "ALUNO" && loadingStudents) {
    return (
      <PageScaffold
        headerProps={{
          title: t("title"),
          description: t("description"),
          eyebrow: "ALUNOS · QUESTIONÁRIOS",
        }}
      >
        <div className="mx-auto grid w-full max-w-4xl gap-5">
          <Skeleton className="h-[220px] rounded-2xl" />
          <Skeleton className="h-[420px] rounded-2xl" />
          <Skeleton className="h-[220px] rounded-2xl" />
        </div>
      </PageScaffold>
    );
  }

  if (role === "ALUNO" && !loadingStudents && students.length === 0) {
    return (
      <PageScaffold
        headerProps={{
          title: t("title"),
          description: t("description"),
          eyebrow: "ALUNOS · QUESTIONÁRIOS",
        }}
      >
        <EmptyState
          icon={Link2}
          title={t("unlinkedTitle")}
          description={t("unlinkedDescription")}
        />
      </PageScaffold>
    );
  }

  const submitQuestionnaire = async (deferred: boolean) => {
    if (!studentId) {
      toast.error(t("selectStudentError"));
      return;
    }
    if (selectedInstrument.supportsDeferral && deferred && deferralsLeft <= 0) {
      toast.error(t("maxDeferred"));
      return;
    }
    if (isKidmed && !hasKidmedConsent) {
      toast.error(t("kidmedConsentMissingDescription"));
      return;
    }
    if (isKidmed && kidmedCompletedThisPeriod) {
      toast.error(t("kidmedCurrentPeriodLocked"));
      return;
    }

    setSaving(true);
    try {
      const payload =
        qType === "AUTOCONCEITO"
          ? {
              type: qType,
              payload: routineData,
              deferredCount: deferred ? deferredCount + 1 : 0,
            }
          : qType === "AUTOESTIMA"
            ? {
                type: qType,
                payload: initialData,
                deferredCount: deferred ? deferredCount + 1 : 0,
              }
            : { type: qType, payload: kidmedData };

      const res = await fetch(`/api/students/${studentId}/questionnaires`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const questionnaire = await readApiResponse<QuestionnaireRecord>(res);

      setQuestionnaireHistory((current) =>
        [
          questionnaire,
          ...current.filter((item) => item.id !== questionnaire.id),
        ].slice(0, HISTORY_LIMIT),
      );

      if (selectedInstrument.supportsDeferral && deferred) {
        setDeferredCount((count) => count + 1);
        toast.info(
          `${t("deferSuccess")}. ${t("remaining", { count: deferralsLeft - 1 })}.`,
        );
      } else {
        setDeferredCount(0);
        toast.success(t("success"));
      }

      setReviewUnlocked(true);
      setCurrentStep("review");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("connectionError"),
      );
    } finally {
      setSaving(false);
    }
  };

  const openQuestions = () => {
    if (!canOpenQuestions) return;
    setCurrentStep("answer");
  };

  const openReview = () => {
    if (!canOpenQuestions) return;
    setReviewUnlocked(true);
    setCurrentStep("review");
  };

  const handleAnswerPrimaryAction = () => {
    if (qType === "AUTOCONCEITO" && routineStage === "habits") {
      setRoutineStage("perception");
      return;
    }
    openReview();
  };

  const instrumentStateLabel = isKidmed
    ? `${t(getKidmedPeriodLabelKey(currentPeriod.period))} - ${currentPeriod.schoolYear}`
    : selectedInstrument.supportsDeferral
      ? t("flexibleWindowShort")
      : t("scheduledWindowShort");

  const statusConfig = isKidmed
    ? !hasKidmedConsent
      ? {
          icon: <ShieldAlert className="size-4 text-danger-600" />,
          title: t("kidmedConsentMissingTitle"),
          description: t("kidmedConsentMissingDescription"),
        }
      : kidmedCompletedThisPeriod
        ? {
            icon: <ShieldCheck className="size-4 text-success-600" />,
            title: t("kidmedCurrentPeriodLocked"),
            description: t("kidmedCurrentPeriodLockedDescription", {
              date: formatDate(currentPeriod.nextPeriodStartsAt),
            }),
          }
        : {
            icon: <ShieldCheck className="size-4 text-success-600" />,
            title: t("statusKidmedOpenTitle"),
            description: t("statusKidmedOpenDescription"),
          }
    : latestQuestionnaire
      ? deferredCount > 0
        ? {
            icon: <Clock3 className="size-4 text-warning-600" />,
            title: t("statusDeferredTitle"),
            description: t("statusDeferredDescription", {
              count: deferralsLeft,
            }),
          }
        : {
            icon: <ShieldCheck className="size-4 text-success-600" />,
            title: t("statusReadyTitle"),
            description: t("statusReadyDescription"),
          }
      : {
          icon: <Sparkles className="size-4 text-navy-600" />,
          title: t("statusFirstSubmissionTitle"),
          description: t("statusFirstSubmissionDescription"),
        };

  const summaryCards =
    qType === "AUTOCONCEITO"
      ? [
          {
            label: t("sleepHoursLabel"),
            value: `${routineData.sleepHours} ${t("unitHours")}`,
            detail: t("autoconceitoRestSummary"),
          },
          {
            label: t("waterGlassesLabel"),
            value: `${routineData.waterGlasses} ${t("unitGlasses")}`,
            detail: t("autoconceitoHydrationSummary"),
          },
          {
            label: t("mealsCountLabel"),
            value: `${routineData.mealsCount} ${t("unitMeals")}`,
            detail: t("autoconceitoMealsSummary"),
          },
        ]
      : qType === "AUTOESTIMA"
        ? [
            {
              label: t("physicalActivityLabel"),
              value: t("autoestimaActivitySummary", {
                days: initialData.physicalActivityFreq,
              }),
              detail: t("reviewActivityDetail"),
            },
            {
              label: t("autoestimaPositiveHabitsLabel"),
              value: t("autoestimaHabitsSummary", {
                count: [
                  initialData.sportsPractice,
                  initialData.eatsBreakfast,
                  initialData.eatsFruitsVegetables,
                  initialData.drinksWaterEnough,
                ].filter(Boolean).length,
              }),
              detail: t("reviewHabitsDetail"),
            },
            {
              label: t("autoestimaHealthSignalsLabel"),
              value: t("autoestimaFlagsSummary", {
                count: [
                  initialData.hasAllergies,
                  initialData.hasMedication,
                  initialData.hasInjuries,
                ].filter(Boolean).length,
              }),
              detail: t("reviewSignalsDetail"),
            },
          ]
        : [
            {
              label: t("kidmedCurrentWindow"),
              value: `${t(getKidmedPeriodLabelKey(currentPeriod.period))} - ${currentPeriod.schoolYear}`,
              detail: t("reviewPeriodDetail"),
            },
            {
              label: t("kidmedConsentStatusLabel"),
              value: hasKidmedConsent
                ? t("kidmedConsentRecorded")
                : t("kidmedConsentMissingShort"),
              detail: t("reviewConsentDetail"),
            },
            {
              label: t("kidmedModeLabel"),
              value: requiresAssistedMode
                ? t("kidmedAssistedModeTitle")
                : t("kidmedSupervisedModeTitle"),
              detail: t("reviewModeDetail"),
            },
          ];

  return (
    <PageScaffold
      headerProps={{
        title: t("title"),
        description: t("description"),
        eyebrow: "ALUNOS · QUESTIONÁRIOS",
      }}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pb-28">
        <PageSection tone="primary" layout="form" className="overflow-hidden">
          <div className="grid gap-6">
            <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_36%),linear-gradient(180deg,rgba(15,23,42,0.02),rgba(15,23,42,0.06))] p-5 sm:p-6">
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold-300/70 to-transparent" />
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2 text-tiny font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  <span>{t("flowEyebrow")}</span>
                  <span className="text-border">/</span>
                  <span>{t(`step${currentStepOrder}`)}</span>
                </div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-[2rem]">
                      {t("heroTitle", {
                        instrument: t(selectedInstrument.labelKey),
                      })}
                    </h2>
                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {t("heroDescription", {
                        instrument: t(selectedInstrument.labelKey),
                      })}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/20 dark:border-white/10/70 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-foreground shadow-sm">
                    <Clock3 className="size-3.5 text-gold-600" />
                    <span>{t("estimatedTimeLabel")}</span>
                    <span className="text-muted-foreground">
                      {getInstrumentEstimatedTime(qType)}
                    </span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetaChip
                    label={t("studentAcademicContextLabel")}
                    value={
                      [selectedStudent?.className, selectedStudent?.schoolYear]
                        .filter(Boolean)
                        .join(" - ") || "-"
                    }
                  />
                  <MetaChip
                    label={t("instrumentStateLabel")}
                    value={instrumentStateLabel}
                  />
                  <MetaChip
                    label={t("cadenceLabel")}
                    value={
                      selectedInstrument.supportsDeferral
                        ? t("deferralRuleShort", { count: MAX_DEFERRALS })
                        : t("kidmedPeriodRuleShort")
                    }
                  />
                  <MetaChip
                    label={t("guidanceLabel")}
                    value={
                      isKidmed
                        ? requiresAssistedMode
                          ? t("kidmedAssistedModeTitle")
                          : t("kidmedSupervisedModeTitle")
                        : t("guidedFlowShort")
                    }
                  />
                </div>
                <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 size-4 text-gold-600" />
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-foreground">
                        {t("objectiveLabel")}
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {t(selectedInstrument.goalKey)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <WizardStepper
              t={t}
              currentStep={currentStep}
              reviewUnlocked={reviewUnlocked}
              canOpenQuestions={canOpenQuestions}
              onChoose={() => setCurrentStep("choose")}
              onAnswer={() => canOpenQuestions && setCurrentStep("answer")}
              onReview={() => reviewUnlocked && setCurrentStep("review")}
            />

            <div
              role="radiogroup"
              aria-label={t("instrumentSelectorLabel")}
              className="grid gap-3 lg:grid-cols-3"
            >
              {QUESTIONNAIRE_TYPES.map((type) => {
                const instrument = QUESTIONNAIRE_INSTRUMENTS[type];
                const active = qType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setQType(type)}
                    className={cn(
                      interactiveControlClasses.choiceBase,
                      "rounded-2xl p-4",
                      active
                        ? cn(
                            interactiveControlClasses.choiceActive,
                            "bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_48%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.92))] shadow-[0_22px_44px_rgba(15,23,42,0.26)]",
                          )
                        : interactiveControlClasses.choiceInactive,
                    )}
                  >
                    <div className="flex h-full flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-micro font-semibold uppercase tracking-[0.18em]",
                              active
                                ? "border border-white/12 bg-white/12 text-gold-200"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {active
                              ? t("instrumentSelectedBadge")
                              : t("instrumentTapBadge")}
                          </span>
                          <p
                            className={cn(
                              "mt-3 text-base font-semibold tracking-tight",
                              active ? "text-white" : "text-foreground",
                            )}
                          >
                            {t(instrument.labelKey)}
                          </p>
                          <p
                            className={cn(
                              "mt-2 text-sm leading-relaxed",
                              active
                                ? "text-white/78"
                                : "text-muted-foreground",
                            )}
                          >
                            {t(instrument.descriptionKey)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-tiny font-semibold uppercase tracking-[0.18em]",
                            active
                              ? "border border-white/12 bg-white/12 text-gold-200"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {getInstrumentEstimatedTime(type)}
                        </span>
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-3">
                        <span
                          className={cn(
                            "text-xs font-semibold uppercase tracking-[0.16em]",
                            active ? "text-white/78" : "text-muted-foreground",
                          )}
                        >
                          {type === "KIDMED"
                            ? t("kidmedPeriodRuleShort")
                            : t("deferralRuleShort", { count: MAX_DEFERRALS })}
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-semibold",
                            active
                              ? "border-white/20 bg-white/10 text-white"
                              : "border-white/20 dark:border-white/10/70 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm text-foreground",
                          )}
                        >
                          {active ? t("ctaSelected") : t("ctaChoose")}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </PageSection>

        {currentStep === "choose" ? (
          <PageSection
            tone="secondary"
            layout="form"
            title={t("step1Title")}
            description={t("step1Description")}
          >
            <div className="grid gap-4">
              <StatusPanel
                icon={statusConfig.icon}
                title={statusConfig.title}
                description={statusConfig.description}
                footer={
                  isKidmed && kidmedResult ? (
                    <KidmedResultSummary
                      t={t}
                      result={kidmedResult}
                      currentPeriodLabel={formatKidmedPeriodLabel(
                        t,
                        kidmedResult,
                      )}
                    />
                  ) : null
                }
              />
              <div className="rounded-2xl border border-dashed border-white/20 dark:border-white/10/70 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t("step1CalloutTitle")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(selectedInstrument.guidanceKey)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="progress"
                    size="xl"
                    onClick={openQuestions}
                    disabled={!canOpenQuestions}
                    icon={<ArrowRight className="size-4" />}
                  >
                    {t("continueToQuestions")}
                  </Button>
                </div>
              </div>
            </div>
          </PageSection>
        ) : null}

        {currentStep === "answer" ? (
          <PageSection
            tone="secondary"
            layout="form"
            title={t("step2Title")}
            description={t("step2Description")}
          >
            {qType === "AUTOCONCEITO" ? (
              <div className="grid gap-4">
                {routineStage === "habits" ? (
                  <QuestionBlock
                    title={t("routineHabitsTitle")}
                    description={t("routineHabitsDescription")}
                  >
                    <div className="grid gap-4">
                      {ROUTINE_QUESTIONS.filter(
                        (question) => !question.slider,
                      ).map((question) => (
                        <NumericStepper
                          key={question.key}
                          label={t(question.labelKey)}
                          min={question.min}
                          max={question.max}
                          step={question.step}
                          value={
                            routineData[
                              question.key as keyof typeof routineData
                            ] as number
                          }
                          onChange={(value) =>
                            setRoutineData((current) => ({
                              ...current,
                              [question.key]: value,
                            }))
                          }
                          unit={
                            question.unitKey ? t(question.unitKey) : undefined
                          }
                          helperText={t(
                            ROUTINE_HELPERS[
                              question.key as keyof typeof ROUTINE_HELPERS
                            ],
                          )}
                          presets={ROUTINE_PRESETS[
                            question.key as keyof typeof ROUTINE_PRESETS
                          ]?.map((preset) => ({
                            label: t(preset.labelKey),
                            value: preset.value,
                          }))}
                          accent={
                            ROUTINE_ACCENTS[
                              question.key as keyof typeof ROUTINE_ACCENTS
                            ]
                          }
                          decreaseLabel={t("decreaseValue")}
                          increaseLabel={t("increaseValue")}
                          stateLabels={{
                            min: t("valueStateMin"),
                            max: t("valueStateMax"),
                            active: t("valueStateFineTune"),
                          }}
                        />
                      ))}
                    </div>
                  </QuestionBlock>
                ) : (
                  <QuestionBlock
                    title={t("wellbeingPerceptionTitle")}
                    description={t("wellbeingPerceptionDescription")}
                  >
                    <div className="grid gap-5">
                      {ROUTINE_QUESTIONS.filter(
                        (question) => question.slider,
                      ).map((question) => (
                        <RangeSlider
                          key={question.key}
                          label={t(question.labelKey)}
                          min={question.min}
                          max={question.max}
                          step={question.step}
                          value={
                            routineData[
                              question.key as keyof typeof routineData
                            ] as number
                          }
                          onChange={(value) =>
                            setRoutineData((current) => ({
                              ...current,
                              [question.key]: value,
                            }))
                          }
                          labels={
                            question.key === "stressLevel"
                              ? [
                                  t("stressNone"),
                                  t("stressLow"),
                                  t("stressModerate"),
                                  t("stressHigh"),
                                  t("stressExtreme"),
                                ]
                              : undefined
                          }
                          colorStops={
                            question.key === "stressLevel"
                              ? STRESS_COLORS
                              : undefined
                          }
                          helperText={t(`${question.key}Helper`)}
                          quickChoices={ROUTINE_QUICK_CHOICES[
                            question.key as keyof typeof ROUTINE_QUICK_CHOICES
                          ]?.map((choice) => ({
                            label: t(choice.labelKey),
                            value: choice.value,
                          }))}
                          minLabel={
                            question.key === "stressLevel"
                              ? t("stressNone")
                              : t("scaleLow")
                          }
                          maxLabel={
                            question.key === "stressLevel"
                              ? t("stressExtreme")
                              : t("scaleHigh")
                          }
                        />
                      ))}
                    </div>
                  </QuestionBlock>
                )}
              </div>
            ) : null}

            {qType === "AUTOESTIMA" ? (
              <QuestionBlock
                title={t("baselineProfileTitle")}
                description={t("baselineProfileDescription")}
              >
                <div className="grid gap-3">
                  {INITIAL_QUESTIONS.map((question) =>
                    "type" in question ? (
                      <BinaryRow
                        key={question.key}
                        label={t(question.labelKey)}
                        value={Boolean(
                          initialData[question.key as keyof typeof initialData],
                        )}
                        onChange={(value) =>
                          setInitialData((current) => ({
                            ...current,
                            [question.key]: value,
                          }))
                        }
                        yesLabel={t("yes")}
                        noLabel={t("no")}
                      />
                    ) : (
                      <NumericStepper
                        key={question.key}
                        label={t(question.labelKey)}
                        min={question.min}
                        max={question.max}
                        step={question.step}
                        value={
                          initialData[
                            question.key as keyof typeof initialData
                          ] as number
                        }
                        onChange={(value) =>
                          setInitialData((current) => ({
                            ...current,
                            [question.key]: value,
                          }))
                        }
                        unit={
                          question.unitKey ? t(question.unitKey) : undefined
                        }
                        helperText={t("physicalActivityHelper")}
                        presets={INITIAL_PRESETS[
                          question.key as keyof typeof INITIAL_PRESETS
                        ]?.map((preset) => ({
                          label: t(preset.labelKey),
                          value: preset.value,
                        }))}
                        accent="gold"
                        decreaseLabel={t("decreaseValue")}
                        increaseLabel={t("increaseValue")}
                        stateLabels={{
                          min: t("valueStateMin"),
                          max: t("valueStateMax"),
                          active: t("valueStateFineTune"),
                        }}
                      />
                    ),
                  )}
                </div>
              </QuestionBlock>
            ) : null}

            {isKidmed ? (
              canOpenQuestions ? (
                <div className="grid gap-4">
                  <StatusPanel
                    icon={<ShieldCheck className="size-4 text-success-600" />}
                    title={
                      requiresAssistedMode
                        ? t("kidmedAssistedModeTitle")
                        : t("kidmedSupervisedModeTitle")
                    }
                    description={
                      requiresAssistedMode
                        ? t("kidmedAssistedModeDescription")
                        : t("kidmedSupervisedModeDescription")
                    }
                  />
                  <QuestionBlock
                    title={t("step2KidmedTitle")}
                    description={t("step2KidmedDescription")}
                  >
                    <div className="grid gap-3">
                      {KIDMED_QUESTIONS.map((question) => (
                        <BinaryRow
                          key={question.key}
                          label={t(question.labelKey)}
                          value={kidmedData[question.key]}
                          onChange={(value) =>
                            setKidmedData((current) => ({
                              ...current,
                              [question.key]: value,
                            }))
                          }
                          yesLabel={t("yes")}
                          noLabel={t("no")}
                        />
                      ))}
                    </div>
                  </QuestionBlock>
                </div>
              ) : (
                <StatusPanel
                  icon={statusConfig.icon}
                  title={statusConfig.title}
                  description={statusConfig.description}
                />
              )
            ) : null}

            <div className="flex flex-wrap justify-between gap-3 border-t border-white/20 dark:border-white/10 pt-2">
              <Button
                type="button"
                variant="ghost"
                icon={<ArrowLeft className="size-4" />}
                onClick={() => {
                  if (
                    qType === "AUTOCONCEITO" &&
                    routineStage === "perception"
                  ) {
                    setRoutineStage("habits");
                    return;
                  }
                  setCurrentStep("choose");
                }}
              >
                {qType === "AUTOCONCEITO" && routineStage === "perception"
                  ? t("backToHabits")
                  : t("backToInstrument")}
              </Button>
              <Button
                type="button"
                variant="progress"
                size="xl"
                onClick={handleAnswerPrimaryAction}
                icon={<ArrowRight className="size-4" />}
              >
                {qType === "AUTOCONCEITO" && routineStage === "habits"
                  ? t("continueToWellbeing")
                  : t("continueToReview")}
              </Button>
            </div>
          </PageSection>
        ) : null}

        {currentStep === "review" ? (
          <>
            <PageSection
              tone="secondary"
              layout="form"
              title={t("step3Title")}
              description={t("step3Description")}
            >
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                  {summaryCards.map((card) => (
                    <ReviewCard
                      key={card.label}
                      label={card.label}
                      value={card.value}
                      detail={card.detail}
                    />
                  ))}
                </div>

                {qType === "AUTOCONCEITO" ? (
                  <div className="grid gap-3 rounded-2xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm p-4 sm:grid-cols-3">
                    {[
                      {
                        key: "energyLevel",
                        labelKey: "energyLevelLabel",
                        invert: false,
                      },
                      {
                        key: "stressLevel",
                        labelKey: "stressLevelLabel",
                        invert: true,
                      },
                      {
                        key: "wellnessLevel",
                        labelKey: "wellnessLevelLabel",
                        invert: false,
                      },
                    ].map(({ key, labelKey, invert }) => {
                      const value = routineData[
                        key as keyof typeof routineData
                      ] as number;
                      const colorClass = invert
                        ? value >= 7
                          ? "bg-danger-500"
                          : value >= 4
                            ? "bg-warning-500"
                            : "bg-success-500"
                        : value >= 7
                          ? "bg-success-500"
                          : value >= 4
                            ? "bg-warning-500"
                            : "bg-danger-400";
                      return (
                        <ProgressReviewCard
                          key={key}
                          label={t(labelKey)}
                          value={value}
                          colorClass={colorClass}
                        />
                      );
                    })}
                  </div>
                ) : null}

                <StatusPanel
                  icon={statusConfig.icon}
                  title={statusConfig.title}
                  description={statusConfig.description}
                  footer={
                    isKidmed && kidmedResult ? (
                      <KidmedResultSummary
                        t={t}
                        result={kidmedResult}
                        currentPeriodLabel={formatKidmedPeriodLabel(
                          t,
                          kidmedResult,
                        )}
                      />
                    ) : null
                  }
                />
              </div>
            </PageSection>

            <div className="sticky bottom-4 z-10">
              <div className="overflow-hidden rounded-2xl border border-white/20 dark:border-white/10/70 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm shadow-[0_18px_55px_rgba(15,23,42,0.2)] backdrop-blur">
                <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <span>{t("reviewReadyEyebrow")}</span>
                      <span className="text-border">/</span>
                      <span>{t(selectedInstrument.labelKey)}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {statusConfig.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {statusConfig.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      icon={<ArrowLeft className="size-4" />}
                      onClick={() => setCurrentStep("answer")}
                    >
                      {t("backToQuestions")}
                    </Button>
                    {selectedInstrument.supportsDeferral ? (
                      <Button
                        type="button"
                        variant="secondary"
                        loading={saving}
                        icon={<Clock3 className="size-4" />}
                        onClick={() => void submitQuestionnaire(true)}
                        disabled={deferralsLeft <= 0 || !studentId}
                      >
                        {t("defer")} ({deferralsLeft})
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="progress"
                      size="xl"
                      loading={saving}
                      icon={<ClipboardList className="size-4" />}
                      onClick={() => void submitQuestionnaire(false)}
                      disabled={
                        !studentId ||
                        (isKidmed &&
                          (!hasKidmedConsent || kidmedCompletedThisPeriod))
                      }
                    >
                      {t("submit")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}

        <PageSection
          tone="utility"
          layout="list"
          title={t("questionnaireHistoryTitle")}
          description={t("historySectionDescription")}
        >
          {loadingHistory ? (
            <HistorySkeletonList />
          ) : questionnaireHistory.length === 0 ? (
            <EmptyState
              icon={History}
              title={t("historyEmptyTitle")}
              description={t("historyEmptyDescription")}
            />
          ) : (
            <div className="grid gap-3">
              {questionnaireHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t(getQuestionnaireTypeLabelKey(item.type))}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("historySubmittedAt", {
                          date: formatDate(item.submittedAt),
                        })}
                      </p>
                    </div>
                    {item.type !== "KIDMED" ? (
                      <span className="rounded-full border border-white/20 dark:border-white/10 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm px-2.5 py-1 text-xs text-muted-foreground">
                        {t("deferralsUsedCompact", {
                          count: item.deferredCount,
                        })}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {getQuestionnairePreviewItems(item).map((badge) => {
                      let value = "";
                      if (
                        badge.key === "classification" &&
                        typeof badge.value === "string"
                      )
                        value = t(
                          getKidmedClassificationLabelKey(
                            badge.value as KidmedClassification,
                          ),
                        );
                      else if (badge.key === "period")
                        value = formatKidmedPeriodLabel(t, item);
                      else if (
                        badge.key === "score" &&
                        typeof badge.value === "number"
                      )
                        value = `${badge.value}/12`;
                      else
                        value = formatBadgeValue(
                          t,
                          badge.value,
                          QUESTIONNAIRE_FIELD_META[badge.key] ?? badge,
                        );
                      return (
                        <span
                          key={badge.key}
                          className="rounded-full border border-white/20 dark:border-white/10 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm px-2.5 py-1"
                        >
                          {t(badge.labelKey)}: {value}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PageSection>
      </div>
    </PageScaffold>
  );
}

function WizardStepper({
  t,
  currentStep,
  reviewUnlocked,
  canOpenQuestions,
  onChoose,
  onAnswer,
  onReview,
}: {
  t: (key: string, values?: Record<string, string | number>) => string;
  currentStep: WizardStep;
  reviewUnlocked: boolean;
  canOpenQuestions: boolean;
  onChoose: () => void;
  onAnswer: () => void;
  onReview: () => void;
}) {
  const steps: Array<{
    id: WizardStep;
    order: number;
    label: string;
    description: string;
    disabled?: boolean;
    action: () => void;
  }> = [
    {
      id: "choose",
      order: 1,
      label: t("step1"),
      description: t("step1Short"),
      action: onChoose,
    },
    {
      id: "answer",
      order: 2,
      label: t("step2"),
      description: t("step2Short"),
      disabled: !canOpenQuestions,
      action: onAnswer,
    },
    {
      id: "review",
      order: 3,
      label: t("step3"),
      description: t("step3Short"),
      disabled: !reviewUnlocked,
      action: onReview,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {steps.map((step) => {
        const active = currentStep === step.id;
        const completed = getStepOrder(currentStep) > step.order;

        return (
          <button
            key={step.id}
            type="button"
            disabled={step.disabled}
            onClick={step.action}
            className={cn(
              "rounded-2xl border px-4 py-4 text-left transition-all duration-300",
              active
                ? "border-navy-900/70 bg-navy-950 text-white shadow-card"
                : completed
                  ? "border-success-300/60 bg-success-50/70 hover:shadow-card-hover dark:bg-success-950/20"
                  : "border-white/20 dark:border-white/10/70 bg-white/60 dark:bg-navy-950/40 backdrop-blur-md/60 hover:-translate-y-0.5 hover:shadow-card-hover",
              step.disabled && "cursor-not-allowed opacity-55",
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  active
                    ? "border-white/20 bg-white/10 text-white"
                    : completed
                      ? "border-success-300/60 bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300"
                      : "border-white/20 dark:border-white/10 bg-background text-foreground",
                )}
              >
                {completed ? <CheckCircle2 className="size-4" /> : step.order}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-sm font-semibold",
                    active ? "text-white" : "text-foreground",
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    "mt-1 block text-sm",
                    active ? "text-white/74" : "text-muted-foreground",
                  )}
                >
                  {step.description}
                </span>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm px-3.5 py-3">
      <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium leading-relaxed text-foreground">
        {value}
      </p>
    </div>
  );
}

function BinaryRow({
  label,
  value,
  onChange,
  yesLabel,
  noLabel,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  yesLabel: string;
  noLabel: string;
}) {
  const options = [
    {
      selected: value,
      label: yesLabel,
      icon: <CheckCircle2 className="size-5" />,
      onSelect: () => onChange(true),
      activeClass: cn(
        interactiveControlClasses.choiceActive,
        "shadow-[0_18px_38px_rgba(16,185,129,0.2)] before:absolute before:inset-x-5 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-emerald-300/70 before:to-transparent before:content-['']",
      ),
      inactiveClass: cn(
        interactiveControlClasses.choiceInactive,
        "hover:border-emerald-300/55",
      ),
      iconClass: value
        ? "border-white/15 bg-white/12 text-emerald-100"
        : "border-emerald-200/60 bg-emerald-100 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/12 dark:text-emerald-200",
    },
    {
      selected: !value,
      label: noLabel,
      icon: <XCircle className="size-5" />,
      onSelect: () => onChange(false),
      activeClass: cn(
        interactiveControlClasses.choiceActive,
        "shadow-[0_18px_38px_rgba(15,23,42,0.28)] before:absolute before:inset-x-5 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-slate-200/65 before:to-transparent before:content-['']",
      ),
      inactiveClass: cn(
        interactiveControlClasses.choiceInactive,
        "hover:border-navy-300/50",
      ),
      iconClass: !value
        ? "border-white/15 bg-white/12 text-slate-100"
        : "border-slate-200/70 bg-slate-100 text-slate-700 dark:border-slate-300/20 dark:bg-slate-400/12 dark:text-slate-200",
    },
  ] as const;

  return (
    <fieldset className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <legend className="px-1 text-sm font-semibold leading-relaxed text-foreground">
        {label}
      </legend>
      <div
        role="radiogroup"
        aria-label={label}
        className="mt-3 grid gap-3 sm:grid-cols-2"
      >
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={option.selected}
            aria-label={`${label} - ${option.label}`}
            onClick={option.onSelect}
            className={cn(
              interactiveControlClasses.choiceBase,
              "relative min-h-[92px] rounded-2xl p-4",
              option.selected ? option.activeClass : option.inactiveClass,
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-2xl border transition-all duration-300",
                  option.iconClass,
                )}
              >
                {option.icon}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1 size-3 rounded-full border transition-all duration-300",
                  option.selected
                    ? "border-white bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.12)]"
                    : "border-white/25 dark:border-white/10 bg-transparent",
                )}
              />
            </div>
            <div className="mt-4">
              <p className="text-base font-semibold tracking-tight">
                {option.label}
              </p>
              <p
                className={cn(
                  "mt-1 text-tiny font-semibold uppercase tracking-[0.18em]",
                  option.selected ? "text-white/72" : "text-muted-foreground",
                )}
              >
                {label}
              </p>
            </div>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function StatusPanel({
  icon,
  title,
  description,
  footer,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5">{icon}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          {footer ? <div className="mt-4">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

function QuestionBlock({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5">
      <div className="mb-4">
        <p className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

function ReviewCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm p-4">
      <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}

function ProgressReviewCard({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <span className="text-sm font-bold tabular-nums text-foreground">
          {value}/10
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/60">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            colorClass,
          )}
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
}

function HistorySkeletonList() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-3.5 w-40 rounded-full" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function KidmedResultSummary({
  t,
  result,
  currentPeriodLabel,
}: {
  t: (key: string, values?: Record<string, string | number>) => string;
  result: QuestionnaireRecord;
  currentPeriodLabel: string;
}) {
  if (result.score === null || result.classification === null) return null;

  return (
    <div className="rounded-2xl border border-success-300/50 bg-success-50/60 p-4 dark:border-success-900/30 dark:bg-success-950/20">
      <p className="text-xs uppercase tracking-[0.18em] text-success-700 dark:text-success-300">
        {t("kidmedLatestResultLabel")}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-tiny uppercase tracking-[0.18em] text-muted-foreground">
            {t("kidmedScoreLabel")}
          </p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
            {result.score}/12
          </p>
        </div>
        <div>
          <p className="text-tiny uppercase tracking-[0.18em] text-muted-foreground">
            {t("kidmedClassificationLabel")}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {t(getKidmedClassificationLabelKey(result.classification))}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {t(getKidmedClassificationFeedbackKey(result.classification))}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-white/20 dark:border-white/10 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm px-2.5 py-1">
          {currentPeriodLabel}
        </span>
        {result.instrumentVersion ? (
          <span className="rounded-full border border-white/20 dark:border-white/10 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm px-2.5 py-1">
            {result.instrumentVersion}
          </span>
        ) : null}
        <span className="rounded-full border border-white/20 dark:border-white/10 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm px-2.5 py-1">
          {t("kidmedSubmittedAt", {
            date: new Date(result.submittedAt).toLocaleDateString(),
          })}
        </span>
      </div>
    </div>
  );
}
