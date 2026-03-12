import { z } from "zod";
import { getEmailRuleMessage, isAllowedEmailForRole, isInternalEmail } from "@/lib/email-rules";

const emailSchema = z.string().trim().toLowerCase().email("Email invalido");

function validateRoleEmailRule(
  data: { email: string; role: string },
  ctx: z.RefinementCtx
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
  ctx: z.RefinementCtx
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
  password: z.string().min(6, "Minimo 6 caracteres"),
});

export const registerSchema = registerBaseSchema.superRefine(validateRegisterRule);

export const registerFormSchema = registerBaseSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirmacao obrigatoria"),
  })
  .superRefine(validateRegisterRule)
  .refine((data) => data.password === data.confirmPassword, {
    message: "As palavras-passe nao coincidem",
    path: ["confirmPassword"],
  });

export const createStaffSchema = createStaffBaseSchema.superRefine(validateRoleEmailRule);

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

export const testItemSchema = z.object({
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

export const questionnaireSchema = z.object({
  type: z.enum(["AUTOCONCEITO", "AUTOESTIMA"]),
  payload: z.record(z.string(), z.unknown()),
  deferredCount: z.number().int().min(0).max(3).default(0),
});

export const sosSchema = z.object({
  psych: z.string().trim().min(1, "Psicologo obrigatorio").max(120),
  teacher: z.string().trim().min(1, "Professor obrigatorio").max(120),
  psychEmail: optionalInternalEmailSchema,
  teacherEmail: optionalInternalEmailSchema,
});

export const dispensaSchema = z.object({
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
