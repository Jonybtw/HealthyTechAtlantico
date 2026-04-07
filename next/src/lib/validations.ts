import { z } from "zod";
import {
  getEmailRuleMessage,
  isAllowedEmailForRole,
  isInternalEmail,
} from "@/lib/email-rules";
import { QUESTIONNAIRE_TYPES } from "@/lib/questionnaires";

const emailSchema = z.string().trim().toLowerCase().email("Email invalido");

function validateRoleEmailRule(
  data: { email: string; role: string },
  ctx: z.RefinementCtx,
) {
  if (!isAllowedEmailForRole(data.role, data.email)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["email"],
      message: getEmailRuleMessage(data.role),
    });
  }
}

function validateRegisterRule(
  data: { email: string; role: string; consentRgpd: boolean },
  ctx: z.RefinementCtx,
) {
  validateRoleEmailRule(data, ctx);

  if (!data.consentRgpd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["consentRgpd"],
      message: "Consentimento RGPD obrigatorio",
    });
  }
}

const registerBaseSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio").max(100).optional(),
  email: emailSchema,
  password: z.string().min(6, "Minimo 6 caracteres"),
  role: z.enum(["ALUNO", "PAIS"]),
  consentRgpd: z.boolean(),
});

const createStaffBaseSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio").max(100),
  email: emailSchema,
  password: z.string().min(6, "Minimo 6 caracteres"),
  role: z.enum(["PROFESSOR", "PSICOLOGO"]),
});

const optionalInternalEmailSchema = z
  .union([emailSchema, z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => !value || isInternalEmail(value), {
    message: getEmailRuleMessage("PROFESSOR"),
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "A palavra-passe é obrigatória"),
});

export const registerSchema =
  registerBaseSchema.superRefine(validateRegisterRule);

export const registerFormSchema = registerBaseSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirmacao obrigatoria"),
  })
  .superRefine(validateRegisterRule)
  .refine((data) => data.password === data.confirmPassword, {
    message: "As palavras-passe nao coincidem",
    path: ["confirmPassword"],
  });

export const createStaffSchema = createStaffBaseSchema.superRefine(
  validateRoleEmailRule,
);

export const updateConsentSchema = z.object({
  consentRgpd: z.boolean().optional(),
  consentShare: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Palavra-passe atual obrigatoria"),
  newPassword: z.string().min(6, "Minimo 6 caracteres"),
});

export const changePasswordFormSchema = changePasswordSchema
  .extend({ confirmPassword: z.string().min(1, "Confirmacao obrigatoria") })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As palavras-passe nao coincidem",
    path: ["confirmPassword"],
  });

export const createStudentSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio").max(100),
  sex: z.enum(["M", "F"]),
  birthDate: z.string().optional(),
  age: z.number().int().min(5).max(25).optional(),
  schoolYear: z.string().optional(),
  className: z.string().optional(),
});

export const updateStudentSchema = createStudentSchema.partial().extend({
  kidmedConsentGranted: z.boolean().optional(),
});

export const biometricsSchema = z.object({
  heightM: z.number().min(0.5).max(2.5),
  weightKg: z.number().min(5).max(300),
  fatPct: z.number().min(0).max(70).optional().nullable(),
  waistCm: z.number().min(30).max(200).optional().nullable(),
  imc: z.number().min(5).max(70),
  imcZone: z.string(),
  fatZone: z.string().optional().nullable(),
  waistZone: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
});

const testItemSchema = z.object({
  testId: z.string(),
  valueNum: z.number().optional().nullable(),
  valueText: z.string(),
  unit: z.string(),
  zone: z.string(),
});

export const testsSchema = z.object({
  tests: z.array(testItemSchema).min(1),
  sessionId: z.string().optional().nullable(),
});

export const routineQuestionnairePayloadSchema = z.object({
  sleepHours: z.number().min(0).max(12),
  screenHours: z.number().min(0).max(16),
  waterGlasses: z.number().int().min(0).max(15),
  mealsCount: z.number().int().min(0).max(8),
  energyLevel: z.number().int().min(0).max(10),
  stressLevel: z.number().int().min(0).max(10),
  wellnessLevel: z.number().int().min(0).max(10),
});

export const initialQuestionnairePayloadSchema = z.object({
  physicalActivityFreq: z.number().int().min(0).max(7),
  sportsPractice: z.boolean(),
  hasAllergies: z.boolean(),
  hasMedication: z.boolean(),
  hasInjuries: z.boolean(),
  eatsBreakfast: z.boolean(),
  eatsFruitsVegetables: z.boolean(),
  drinksWaterEnough: z.boolean(),
});

export const kidmedAnswersSchema = z.object({
  fruitDaily: z.boolean(),
  secondFruitDaily: z.boolean(),
  vegetablesDaily: z.boolean(),
  vegetablesMoreThanOnceDaily: z.boolean(),
  fishRegularly: z.boolean(),
  fastFoodWeekly: z.boolean(),
  pulsesMoreThanOnceWeekly: z.boolean(),
  wholeGrainPastaOrRice: z.boolean(),
  wholeGrainsBreakfast: z.boolean(),
  nutsRegularly: z.boolean(),
  oliveOilAtHome: z.boolean(),
  skipsBreakfast: z.boolean(),
  dairyBreakfast: z.boolean(),
  pastriesBreakfast: z.boolean(),
  yogurtOrCheeseDaily: z.boolean(),
  sweetsSeveralTimesDaily: z.boolean(),
});

export const questionnaireSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("AUTOCONCEITO"),
    payload: routineQuestionnairePayloadSchema,
    deferredCount: z.number().int().min(0).max(3).default(0),
  }),
  z.object({
    type: z.literal("AUTOESTIMA"),
    payload: initialQuestionnairePayloadSchema,
    deferredCount: z.number().int().min(0).max(3).default(0),
  }),
  z.object({
    type: z.literal("KIDMED"),
    payload: kidmedAnswersSchema,
  }),
]);

export const sosSchema = z.object({
  psych: z.string().trim().min(1, "Psicologo obrigatorio").max(120),
  teacher: z.string().trim().min(1, "Professor obrigatorio").max(120),
  psychEmail: optionalInternalEmailSchema,
  teacherEmail: optionalInternalEmailSchema,
});

export const exemptionSchema = z.object({
  reason: z.string().min(1, "Motivo obrigatorio"),
  startDate: z.string(),
  endDate: z.string(),
  medicalCertificate: z.boolean().default(false),
});

export const reportEmailSchema = z.object({
  guardianUserId: z.string().min(1),
  title: z.string().default("Relatorio HealthyTechAtlantico"),
  schoolYear: z.string().optional(),
});

export const guardianSchema = z.object({
  guardianEmail: emailSchema.refine((email) => !isInternalEmail(email), {
    message: getEmailRuleMessage("PAIS"),
  }),
  relationship: z.string().default("encarregado"),
});

function queryNumberSchema(schema: z.ZodNumber) {
  return z.preprocess(
    (value) =>
      value === undefined || value === null || value === "" ? undefined : value,
    z.coerce.number().int().pipe(schema),
  );
}

function queryTextSchema(schema: z.ZodString) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    schema,
  );
}

function queryIsoDateSchema() {
  return z.preprocess(
    (value) =>
      value === undefined || value === null || value === "" ? undefined : value,
    z.string().datetime({ offset: true }),
  );
}

export const listStudentsQuerySchema = z.object({
  page: queryNumberSchema(z.number().min(1)).default(1),
  limit: queryNumberSchema(z.number().min(1).max(2000)).default(50),
  search: queryTextSchema(z.string().max(100)).default(""),
  school_year: queryTextSchema(z.string().max(50)).default(""),
  class_name: queryTextSchema(z.string().max(50)).default(""),
});

export const listAuditQuerySchema = z
  .object({
    page: queryNumberSchema(z.number().min(1)).default(1),
    limit: queryNumberSchema(z.number().min(1).max(100)).default(100),
    action: queryTextSchema(z.string().max(80)).optional(),
    startDate: queryIsoDateSchema().optional(),
    endDate: queryIsoDateSchema().optional(),
    sortBy: z.enum(["createdAt", "action"]).default("createdAt"),
    sortDir: z.enum(["asc", "desc"]).default("desc"),
  })
  .superRefine((data, ctx) => {
    if (!data.startDate || !data.endDate) {
      return;
    }

    if (new Date(data.startDate) > new Date(data.endDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "startDate deve ser anterior ou igual a endDate",
      });
    }
  });

export const listQuestionnairesQuerySchema = z.object({
  type: z.preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    return typeof value === "string" ? value.trim() : value;
  }, z.enum(QUESTIONNAIRE_TYPES).optional()),
  limit: queryNumberSchema(z.number().min(1).max(100)).optional(),
});
