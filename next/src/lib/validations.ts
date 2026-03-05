import { z } from "zod";

// ── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  role: z.enum(["ALUNO", "PAIS"]),
  consentRgpd: z.literal(true, { message: "Consentimento RGPD obrigatório" }),
});

export const createStaffSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  role: z.enum(["PROFESSOR", "PSICOLOGO"]),
});

// ── User ─────────────────────────────────────────────────────────────────────

export const updateConsentSchema = z.object({
  consentRgpd: z.boolean().optional(),
  consentShare: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "Mínimo 6 caracteres"),
});

// ── Student ──────────────────────────────────────────────────────────────────

export const createStudentSchema = z.object({
  name: z.string().min(2, "Nome obrigatório").max(100),
  sex: z.enum(["M", "F"]),
  birthDate: z.string().optional(),
  age: z.number().int().min(5).max(25).optional(),
  schoolYear: z.string().optional(),
  className: z.string().optional(),
});

// ── Biometrics ───────────────────────────────────────────────────────────────

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

// ── Tests ────────────────────────────────────────────────────────────────────

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

// ── Questionnaire ────────────────────────────────────────────────────────────

export const questionnaireSchema = z.object({
  type: z.enum(["AUTOCONCEITO", "AUTOESTIMA"]),
  payload: z.record(z.string(), z.unknown()),
  deferredCount: z.number().int().min(0).max(3).default(0),
});

// ── SOS ──────────────────────────────────────────────────────────────────────

export const sosSchema = z.object({
  psych: z.string().min(1),
  teacher: z.string().min(1),
  psychEmail: z.string().email().optional(),
  teacherEmail: z.string().email().optional(),
});

// ── Dispensa ─────────────────────────────────────────────────────────────────

export const dispensaSchema = z.object({
  reason: z.string().min(1, "Motivo obrigatório"),
  startDate: z.string(),
  endDate: z.string(),
  medicalCertificate: z.boolean().default(false),
});

// ── Report Email ─────────────────────────────────────────────────────────────

export const reportEmailSchema = z.object({
  title: z.string().default("Relatório AtlanticoFit"),
  emailedTo: z.string().email(),
  schoolYear: z.string().optional(),
  htmlContent: z.string().optional(),
});

// ── Guardian ─────────────────────────────────────────────────────────────────

export const guardianSchema = z.object({
  guardianEmail: z.string().email(),
  relationship: z.string().default("encarregado"),
});
