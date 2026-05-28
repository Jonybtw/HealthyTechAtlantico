import { z } from "zod";
import {
  getEmailRuleMessage,
  isAllowedEmailForRole,
  isInternalEmail,
} from "@/lib/email-rules";
import {
  getPasswordPolicyIssues,
  PASSWORD_POLICY_MESSAGES,
} from "@/lib/password-policy";
import { QUESTIONNAIRE_TYPES } from "@/lib/questionnaires";

const emailSchema = z.string().trim().toLowerCase().email("E-mail inválido");

const nameSchema = z.string().trim().min(2, "Nome obrigatório").max(100);

function applyPasswordPolicy(
  password: string,
  ctx: z.RefinementCtx,
  path: (string | number)[] = ["password"],
) {
  const issues = getPasswordPolicyIssues(password);

  for (const message of issues) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path,
      message,
    });
  }
}

function validateRoleEmailRule(
  data: { email: string; role: string },
  ctx: z.RefinementCtx,
) {
  if (!isAllowedEmailForRole(data.role, data.email)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["email"],
      message: getEmailRuleMessage(),
    });
  }
}

function validateRegisterRule(
  data: { email: string; role: string; consentRgpd: boolean },
  ctx: z.RefinementCtx,
) {
  // Always trigger the email rule validation
  validateRoleEmailRule(data, ctx);

  if (!data.consentRgpd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["consentRgpd"],
      message: "Consentimento RGPD obrigatório",
    });
  }
}

const registerBaseSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema,
  password: z.string().min(1, "A palavra-passe é obrigatória"),
  role: z.enum(["ALUNO", "PAIS"]),
  consentRgpd: z.boolean(),
});

const createStaffBaseSchema = z.object({
  name: z.string().min(2, "Nome obrigatório").max(100),
  email: emailSchema,
  password: z.string().min(1, "Palavra-passe obrigatória"),
  role: z.enum(["PROFESSOR", "PSICOLOGO"]),
});

const optionalInternalEmailSchema = z
  .union([emailSchema, z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => !value || isInternalEmail(value), {
    message: getEmailRuleMessage(),
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "A palavra-passe é obrigatória"),
});

export const registerSchema =
  registerBaseSchema.superRefine((data, ctx) => {
    validateRegisterRule(data, ctx);
    applyPasswordPolicy(data.password, ctx);
  });

export const registerFormSchema = registerBaseSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirmação obrigatória"),
  })
  .superRefine((data, ctx) => {
    validateRegisterRule(data, ctx);
    applyPasswordPolicy(data.password, ctx);
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As palavras-passe não coincidem",
    path: ["confirmPassword"],
  });

export const createStaffSchema = createStaffBaseSchema.superRefine(
  validateRoleEmailRule,
);

export const updateConsentSchema = z.object({
  consentRgpd: z.boolean().optional(),
  consentShare: z.boolean().optional(),
});

const changePasswordBaseSchema = z.object({
  currentPassword: z.string().min(1, "Palavra-passe atual obrigatória"),
  newPassword: z.string().min(1, "A nova palavra-passe é obrigatória"),
});

export const changePasswordSchema = changePasswordBaseSchema.superRefine(
  (data, ctx) => {
    applyPasswordPolicy(data.newPassword, ctx, ["newPassword"]);

    if (data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: PASSWORD_POLICY_MESSAGES.sameAsCurrent,
      });
    }
  },
);

export const changePasswordFormSchema = changePasswordBaseSchema
  .extend({ confirmPassword: z.string().min(1, "Confirmação obrigatória") })
  .superRefine((data, ctx) => {
    applyPasswordPolicy(data.newPassword, ctx, ["newPassword"]);

    if (data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: PASSWORD_POLICY_MESSAGES.sameAsCurrent,
      });
    }
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As palavras-passe não coincidem",
    path: ["confirmPassword"],
  });

export const createStudentSchema = z.object({
  name: z.string().min(2, "Nome obrigatório").max(100),
  sex: z.enum(["M", "F"]),
  birthDate: z.string().optional(),
  age: z.number().int().min(5).max(25).optional(),
  schoolYear: z.string().optional(),
  className: z.string().optional(),
  processNumber: z.string().optional(),
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
  notes: z.string().max(1000).optional().nullable(),
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
  psych: z.string().trim().min(1, "Psicólogo obrigatório").max(120),
  teacher: z.string().trim().min(1, "Professor obrigatório").max(120),
  psychEmail: optionalInternalEmailSchema,
  teacherEmail: optionalInternalEmailSchema,
});

export const exemptionSchema = z.object({
  reason: z.string().min(1, "Motivo obrigatório"),
  startDate: z.string(),
  endDate: z.string(),
  medicalCertificate: z.boolean().default(false),
});

export const reportEmailSchema = z.object({
  guardianUserId: z.string().min(1),
  title: z.string().default("Relatório HealthyTechAtlantico"),
  schoolYear: z.string().optional(),
});

export const guardianSchema = z.object({
  guardianEmail: emailSchema,
  relationship: z.string().default("encarregado"),
});

const consentRequiredMessage = "Consentimento RGPD obrigatório";
const studentDomainMessage = `O e-mail deve terminar exatamente em @colegioatlantico.pt`;

function validateSelfRegistrationConsent(
  data: { consentRgpd: boolean },
  ctx: z.RefinementCtx,
) {
  if (!data.consentRgpd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["consentRgpd"],
      message: consentRequiredMessage,
    });
  }
}

const studentSelfRegisterBaseSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: z.string().min(1, "A palavra-passe é obrigatória"),
  studentProcessNumber: z
    .string()
    .trim()
    .min(1, "Número de processo obrigatório")
    .max(50, "Número de processo inválido"),
  consentRgpd: z.boolean(),
});

export const studentSelfRegisterSchema = studentSelfRegisterBaseSchema.superRefine(
  (data, ctx) => {
    validateSelfRegistrationConsent(data, ctx);
    applyPasswordPolicy(data.password, ctx);

    if (!isInternalEmail(data.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: studentDomainMessage,
      });
    }
  },
);

export const studentSelfRegisterFormSchema = studentSelfRegisterBaseSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirmação obrigatória"),
  })
  .superRefine((data, ctx) => {
    validateSelfRegistrationConsent(data, ctx);
    applyPasswordPolicy(data.password, ctx);

    if (!isInternalEmail(data.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: studentDomainMessage,
      });
    }
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As palavras-passe não coincidem",
    path: ["confirmPassword"],
  });

const guardianSelfRegisterBaseSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: z.string().min(1, "A palavra-passe é obrigatória"),
  studentProcessNumber: z
    .string()
    .trim()
    .min(1, "Número de processo obrigatório")
    .max(50, "Número de processo inválido"),
  consentRgpd: z.boolean(),
});

export const guardianSelfRegisterSchema = guardianSelfRegisterBaseSchema.superRefine(
  (data, ctx) => {
    validateSelfRegistrationConsent(data, ctx);
    applyPasswordPolicy(data.password, ctx);
  },
);

export const guardianSelfRegisterFormSchema = guardianSelfRegisterBaseSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirmação obrigatória"),
  })
  .superRefine((data, ctx) => {
    validateSelfRegistrationConsent(data, ctx);
    applyPasswordPolicy(data.password, ctx);
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As palavras-passe não coincidem",
    path: ["confirmPassword"],
  });

export const publicChangePasswordSchema = changePasswordBaseSchema
  .extend({
    email: emailSchema.optional(),
    token: z.string().trim().min(1, "Token obrigatório").optional(),
  })
  .superRefine((data, ctx) => {
    applyPasswordPolicy(data.newPassword, ctx, ["newPassword"]);

    if (data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: PASSWORD_POLICY_MESSAGES.sameAsCurrent,
      });
    }
  });

export const publicChangePasswordFormSchema = changePasswordBaseSchema
  .extend({
    email: emailSchema.optional(),
    token: z.string().trim().min(1, "Token obrigatório").optional(),
    confirmPassword: z.string().min(1, "Confirmação obrigatória"),
  })
  .superRefine((data, ctx) => {
    applyPasswordPolicy(data.newPassword, ctx, ["newPassword"]);

    if (data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: PASSWORD_POLICY_MESSAGES.sameAsCurrent,
      });
    }
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As palavras-passe não coincidem",
    path: ["confirmPassword"],
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
