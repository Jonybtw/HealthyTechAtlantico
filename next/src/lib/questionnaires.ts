export const QUESTIONNAIRE_TYPES = [
  "AUTOCONCEITO",
  "AUTOESTIMA",
  "KIDMED",
] as const;

export type QuestionnaireTypeValue = (typeof QUESTIONNAIRE_TYPES)[number];

export const KIDMED_INSTRUMENT_VERSION = "KIDMED_2019" as const;

export const KIDMED_CLASSIFICATIONS = [
  "OPTIMAL",
  "AVERAGE",
  "VERY_LOW",
] as const;

export type KidmedClassification = (typeof KIDMED_CLASSIFICATIONS)[number];
export type SchoolPeriod = "P1" | "P2" | "P3";

export interface NumericQuestionDefinition {
  key: string;
  labelKey: string;
  min: number;
  max: number;
  step: number;
  unitKey?: string;
  slider?: boolean;
}

export interface BinaryQuestionDefinition {
  key: string;
  labelKey: string;
  type: "yesno";
}

export interface KidmedQuestionDefinition {
  key: KidmedQuestionKey;
  labelKey: string;
  positive: boolean;
}

export interface QuestionnaireInstrumentDefinition {
  type: QuestionnaireTypeValue;
  formKind: "routine" | "initial" | "kidmed";
  labelKey: string;
  descriptionKey: string;
  goalKey: string;
  cadenceKey: string;
  guidanceKey: string;
  historyDescriptionKey: string;
  supportsDeferral: boolean;
  requiresConsent: boolean;
  instrumentVersion?: string;
}

export interface SchoolPeriodInfo {
  schoolYear: string;
  period: SchoolPeriod;
  periodKey: string;
  startsAt: Date;
  endsAt: Date;
  nextPeriodStartsAt: Date;
}

export interface KidmedResult {
  score: number;
  classification: KidmedClassification;
}

export interface QuestionnairePresentationRecord {
  type: QuestionnaireTypeValue;
  payload: Record<string, unknown>;
  score: number | null;
  classification: KidmedClassification | null;
  instrumentVersion?: string | null;
  schoolYear?: string | null;
  periodKey?: string | null;
}

export interface QuestionnairePreviewItemDefinition {
  key: string;
  labelKey: string;
  unitKey?: string;
  scaleMax?: number;
}

export type KidmedQuestionKey =
  | "fruitDaily"
  | "secondFruitDaily"
  | "vegetablesDaily"
  | "vegetablesMoreThanOnceDaily"
  | "fishRegularly"
  | "fastFoodWeekly"
  | "pulsesMoreThanOnceWeekly"
  | "wholeGrainPastaOrRice"
  | "wholeGrainsBreakfast"
  | "nutsRegularly"
  | "oliveOilAtHome"
  | "skipsBreakfast"
  | "dairyBreakfast"
  | "pastriesBreakfast"
  | "yogurtOrCheeseDaily"
  | "sweetsSeveralTimesDaily";

export type KidmedAnswers = Record<KidmedQuestionKey, boolean>;

export const ROUTINE_QUESTIONS: NumericQuestionDefinition[] = [
  {
    key: "sleepHours",
    labelKey: "sleepHoursLabel",
    min: 0,
    max: 12,
    step: 0.5,
    unitKey: "unitHours",
  },
  {
    key: "screenHours",
    labelKey: "screenHoursLabel",
    min: 0,
    max: 16,
    step: 0.5,
    unitKey: "unitHours",
  },
  {
    key: "waterGlasses",
    labelKey: "waterGlassesLabel",
    min: 0,
    max: 15,
    step: 1,
    unitKey: "unitGlasses",
  },
  {
    key: "mealsCount",
    labelKey: "mealsCountLabel",
    min: 0,
    max: 8,
    step: 1,
    unitKey: "unitMeals",
  },
  {
    key: "energyLevel",
    labelKey: "energyLevelLabel",
    min: 0,
    max: 10,
    step: 1,
    slider: true,
  },
  {
    key: "stressLevel",
    labelKey: "stressLevelLabel",
    min: 0,
    max: 10,
    step: 1,
    slider: true,
  },
  {
    key: "wellnessLevel",
    labelKey: "wellnessLevelLabel",
    min: 0,
    max: 10,
    step: 1,
    slider: true,
  },
];

export const INITIAL_QUESTIONS: Array<
  NumericQuestionDefinition | BinaryQuestionDefinition
> = [
  {
    key: "physicalActivityFreq",
    labelKey: "physicalActivityLabel",
    min: 0,
    max: 7,
    step: 1,
    unitKey: "unitDays",
  },
  { key: "sportsPractice", labelKey: "sportsPracticeLabel", type: "yesno" },
  { key: "hasAllergies", labelKey: "hasAllergiesLabel", type: "yesno" },
  { key: "hasMedication", labelKey: "hasMedicationLabel", type: "yesno" },
  { key: "hasInjuries", labelKey: "hasInjuriesLabel", type: "yesno" },
  { key: "eatsBreakfast", labelKey: "eatsBreakfastLabel", type: "yesno" },
  {
    key: "eatsFruitsVegetables",
    labelKey: "eatsFruitsVegetablesLabel",
    type: "yesno",
  },
  {
    key: "drinksWaterEnough",
    labelKey: "drinksWaterEnoughLabel",
    type: "yesno",
  },
];

export const KIDMED_QUESTIONS: KidmedQuestionDefinition[] = [
  { key: "fruitDaily", labelKey: "kidmedFruitDaily", positive: true },
  {
    key: "secondFruitDaily",
    labelKey: "kidmedSecondFruitDaily",
    positive: true,
  },
  { key: "vegetablesDaily", labelKey: "kidmedVegetablesDaily", positive: true },
  {
    key: "vegetablesMoreThanOnceDaily",
    labelKey: "kidmedVegetablesMoreThanOnceDaily",
    positive: true,
  },
  { key: "fishRegularly", labelKey: "kidmedFishRegularly", positive: true },
  { key: "fastFoodWeekly", labelKey: "kidmedFastFoodWeekly", positive: false },
  {
    key: "pulsesMoreThanOnceWeekly",
    labelKey: "kidmedPulsesMoreThanOnceWeekly",
    positive: true,
  },
  {
    key: "wholeGrainPastaOrRice",
    labelKey: "kidmedWholeGrainPastaOrRice",
    positive: true,
  },
  {
    key: "wholeGrainsBreakfast",
    labelKey: "kidmedWholeGrainsBreakfast",
    positive: true,
  },
  { key: "nutsRegularly", labelKey: "kidmedNutsRegularly", positive: true },
  { key: "oliveOilAtHome", labelKey: "kidmedOliveOilAtHome", positive: true },
  { key: "skipsBreakfast", labelKey: "kidmedSkipsBreakfast", positive: false },
  { key: "dairyBreakfast", labelKey: "kidmedDairyBreakfast", positive: true },
  {
    key: "pastriesBreakfast",
    labelKey: "kidmedPastriesBreakfast",
    positive: false,
  },
  {
    key: "yogurtOrCheeseDaily",
    labelKey: "kidmedYogurtOrCheeseDaily",
    positive: true,
  },
  {
    key: "sweetsSeveralTimesDaily",
    labelKey: "kidmedSweetsSeveralTimesDaily",
    positive: false,
  },
];

export const QUESTIONNAIRE_INSTRUMENTS: Record<
  QuestionnaireTypeValue,
  QuestionnaireInstrumentDefinition
> = {
  AUTOCONCEITO: {
    type: "AUTOCONCEITO",
    formKind: "routine",
    labelKey: "autoconceito",
    descriptionKey: "autoconceitoDesc",
    goalKey: "autoconceitoGoal",
    cadenceKey: "autoconceitoCadence",
    guidanceKey: "autoconceitoGuidance",
    historyDescriptionKey: "autoconceitoHistoryDescription",
    supportsDeferral: true,
    requiresConsent: false,
  },
  AUTOESTIMA: {
    type: "AUTOESTIMA",
    formKind: "initial",
    labelKey: "autoestima",
    descriptionKey: "autoestimaDesc",
    goalKey: "autoestimaGoal",
    cadenceKey: "autoestimaCadence",
    guidanceKey: "autoestimaGuidance",
    historyDescriptionKey: "autoestimaHistoryDescription",
    supportsDeferral: true,
    requiresConsent: false,
  },
  KIDMED: {
    type: "KIDMED",
    formKind: "kidmed",
    labelKey: "kidmed",
    descriptionKey: "kidmedDesc",
    goalKey: "kidmedGoal",
    cadenceKey: "kidmedCadence",
    guidanceKey: "kidmedGuidance",
    historyDescriptionKey: "kidmedHistoryDescription",
    supportsDeferral: false,
    requiresConsent: true,
    instrumentVersion: KIDMED_INSTRUMENT_VERSION,
  },
};

export const QUESTIONNAIRE_FIELD_META: Record<
  string,
  { labelKey: string; unitKey?: string; scaleMax?: number }
> = {
  sleepHours: { labelKey: "sleepHoursLabel", unitKey: "unitHours" },
  screenHours: { labelKey: "screenHoursLabel", unitKey: "unitHours" },
  waterGlasses: { labelKey: "waterGlassesLabel", unitKey: "unitGlasses" },
  mealsCount: { labelKey: "mealsCountLabel", unitKey: "unitMeals" },
  energyLevel: { labelKey: "energyLevelLabel", scaleMax: 10 },
  stressLevel: { labelKey: "stressLevelLabel", scaleMax: 10 },
  wellnessLevel: { labelKey: "wellnessLevelLabel", scaleMax: 10 },
  physicalActivityFreq: {
    labelKey: "physicalActivityLabel",
    unitKey: "unitDays",
  },
  sportsPractice: { labelKey: "sportsPracticeLabel" },
  hasAllergies: { labelKey: "hasAllergiesLabel" },
  hasMedication: { labelKey: "hasMedicationLabel" },
  hasInjuries: { labelKey: "hasInjuriesLabel" },
  eatsBreakfast: { labelKey: "eatsBreakfastLabel" },
  eatsFruitsVegetables: { labelKey: "eatsFruitsVegetablesLabel" },
  drinksWaterEnough: { labelKey: "drinksWaterEnoughLabel" },
};

export const QUESTIONNAIRE_PREVIEW_FIELDS: Record<
  Exclude<QuestionnaireTypeValue, "KIDMED">,
  QuestionnairePreviewItemDefinition[]
> = {
  AUTOCONCEITO: [
    { key: "energyLevel", labelKey: "energyLevelLabel", scaleMax: 10 },
    { key: "stressLevel", labelKey: "stressLevelLabel", scaleMax: 10 },
    { key: "wellnessLevel", labelKey: "wellnessLevelLabel", scaleMax: 10 },
    { key: "sleepHours", labelKey: "sleepHoursLabel", unitKey: "unitHours" },
  ],
  AUTOESTIMA: [
    {
      key: "physicalActivityFreq",
      labelKey: "physicalActivityLabel",
      unitKey: "unitDays",
    },
    { key: "sportsPractice", labelKey: "sportsPracticeLabel" },
    { key: "eatsBreakfast", labelKey: "eatsBreakfastLabel" },
    { key: "drinksWaterEnough", labelKey: "drinksWaterEnoughLabel" },
  ],
};

export function isQuestionnaireType(
  value: string,
): value is QuestionnaireTypeValue {
  return QUESTIONNAIRE_TYPES.includes(value as QuestionnaireTypeValue);
}

export function isKidmedClassification(
  value: string,
): value is KidmedClassification {
  return KIDMED_CLASSIFICATIONS.includes(value as KidmedClassification);
}

export function getQuestionnaireTypeLabelKey(type: QuestionnaireTypeValue) {
  return QUESTIONNAIRE_INSTRUMENTS[type].labelKey;
}

export function getQuestionnairePreviewItems(
  questionnaire: QuestionnairePresentationRecord,
): Array<QuestionnairePreviewItemDefinition & { value: unknown }> {
  if (questionnaire.type === "KIDMED") {
    if (questionnaire.score === null || questionnaire.classification === null) {
      return [];
    }

    return [
      {
        key: "score",
        labelKey: "kidmedScoreLabel",
        value: questionnaire.score,
        scaleMax: 12,
      },
      {
        key: "classification",
        labelKey: "kidmedClassificationLabel",
        value: questionnaire.classification,
      },
      {
        key: "period",
        labelKey: "kidmedPeriodLabel",
        value: questionnaire.periodKey ?? questionnaire.schoolYear ?? null,
      },
      {
        key: "version",
        labelKey: "kidmedVersionLabel",
        value: questionnaire.instrumentVersion ?? null,
      },
    ];
  }

  return QUESTIONNAIRE_PREVIEW_FIELDS[questionnaire.type]
    .map((item) => ({
      ...item,
      value: questionnaire.payload[item.key],
    }))
    .filter((item) => item.value !== undefined);
}

export function getKidmedClassificationLabelKey(
  classification: KidmedClassification,
) {
  switch (classification) {
    case "OPTIMAL":
      return "kidmedClassificationOptimal";
    case "AVERAGE":
      return "kidmedClassificationAverage";
    case "VERY_LOW":
      return "kidmedClassificationVeryLow";
  }
}

export function getKidmedClassificationFeedbackKey(
  classification: KidmedClassification,
) {
  switch (classification) {
    case "OPTIMAL":
      return "kidmedFeedbackOptimal";
    case "AVERAGE":
      return "kidmedFeedbackAverage";
    case "VERY_LOW":
      return "kidmedFeedbackVeryLow";
  }
}

export function getKidmedPeriodLabelKey(period: SchoolPeriod) {
  switch (period) {
    case "P1":
      return "kidmedPeriodP1";
    case "P2":
      return "kidmedPeriodP2";
    case "P3":
      return "kidmedPeriodP3";
  }
}

export function classifyKidmedScore(score: number): KidmedClassification {
  if (score >= 8) {
    return "OPTIMAL";
  }

  if (score >= 4) {
    return "AVERAGE";
  }

  return "VERY_LOW";
}

export function computeKidmedScore(answers: KidmedAnswers) {
  const score = KIDMED_QUESTIONS.reduce((total, question) => {
    if (!answers[question.key]) {
      return total;
    }

    return total + (question.positive ? 1 : -1);
  }, 0);

  return Math.max(0, score);
}

export function evaluateKidmed(answers: KidmedAnswers): KidmedResult {
  const score = computeKidmedScore(answers);

  return {
    score,
    classification: classifyKidmedScore(score),
  };
}

export function getSchoolPeriodInfo(
  dateInput: Date | string = new Date(),
): SchoolPeriodInfo {
  const date =
    dateInput instanceof Date ? new Date(dateInput) : new Date(dateInput);
  const month = date.getMonth();
  const year = date.getFullYear();
  const schoolYearStart = month >= 8 ? year : year - 1;
  const schoolYear = `${schoolYearStart}/${schoolYearStart + 1}`;

  if (month >= 8 && month <= 11) {
    const period = "P1";

    return {
      schoolYear,
      period,
      periodKey: `${schoolYear}:${period}`,
      startsAt: new Date(schoolYearStart, 8, 1, 0, 0, 0, 0),
      endsAt: new Date(schoolYearStart, 11, 31, 23, 59, 59, 999),
      nextPeriodStartsAt: new Date(schoolYearStart + 1, 0, 1, 0, 0, 0, 0),
    };
  }

  if (month <= 2) {
    const period = "P2";

    return {
      schoolYear,
      period,
      periodKey: `${schoolYear}:${period}`,
      startsAt: new Date(schoolYearStart + 1, 0, 1, 0, 0, 0, 0),
      endsAt: new Date(schoolYearStart + 1, 2, 31, 23, 59, 59, 999),
      nextPeriodStartsAt: new Date(schoolYearStart + 1, 3, 1, 0, 0, 0, 0),
    };
  }

  const period = "P3";

  return {
    schoolYear,
    period,
    periodKey: `${schoolYear}:${period}`,
    startsAt: new Date(schoolYearStart + 1, 3, 1, 0, 0, 0, 0),
    endsAt: new Date(schoolYearStart + 1, 7, 31, 23, 59, 59, 999),
    nextPeriodStartsAt: new Date(schoolYearStart + 1, 8, 1, 0, 0, 0, 0),
  };
}
