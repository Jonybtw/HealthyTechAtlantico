import "dotenv/config";
import {
  PrismaClient,
  Prisma,
  QuestionnaireType,
  Role,
  Sex,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import { getPgSslConfig } from "../src/lib/database-ssl";
import { INTERNAL_EMAIL_DOMAIN } from "../src/lib/email-rules";
import { AUDIT_ACTIONS } from "../src/lib/audit-actions";
import {
  KIDMED_INSTRUMENT_VERSION,
  evaluateKidmed,
  getSchoolPeriodInfo,
  type KidmedAnswers,
} from "../src/lib/questionnaires";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: getPgSslConfig(),
});

const adapter = new PrismaPg(pool as never);
const prisma = new PrismaClient({ adapter });

const PASSWORD = "Password1";
const CURRENT_YEAR = "2025/2026";
const PREVIOUS_YEAR = "2024/2025";
const CLASS_NAMES = ["7A", "7B", "8A", "8B", "9A"] as const;
const HEALTHY_ZONE = "ZSAF - Zona Saudável";
const IMPROVEMENT_ZONE = "ZMF - Zona de Melhoria";

const TERM_TEMPLATES = {
  [PREVIOUS_YEAR]: [
    { schoolYear: PREVIOUS_YEAR, label: "1o Periodo", date: new Date("2024-11-12T09:00:00Z") },
    { schoolYear: PREVIOUS_YEAR, label: "2o Periodo", date: new Date("2025-02-18T09:00:00Z") },
    { schoolYear: PREVIOUS_YEAR, label: "3o Periodo", date: new Date("2025-05-21T09:00:00Z") },
  ],
  [CURRENT_YEAR]: [
    { schoolYear: CURRENT_YEAR, label: "1o Periodo", date: new Date("2025-11-11T09:00:00Z") },
    { schoolYear: CURRENT_YEAR, label: "2o Periodo", date: new Date("2026-02-17T09:00:00Z") },
    { schoolYear: CURRENT_YEAR, label: "3o Periodo", date: new Date("2026-04-08T09:00:00Z") },
  ],
} as const;

const TEST_CATALOG = [
  { id: "vai", unit: "percursos" },
  { id: "cooper", unit: "m" },
  { id: "milha", unit: "mm:ss" },
  { id: "velocidade", unit: "s" },
  { id: "agilidade", unit: "s" },
  { id: "abd", unit: "reps" },
  { id: "bracos", unit: "reps" },
  { id: "senta", unit: "cm" },
] as const;

const GUARDIANS = {
  joaoFerreira: { email: "joao.ferreira@gmail.com", name: "Joao Ferreira" },
  martaFerreira: { email: "marta.ferreira@gmail.com", name: "Marta Ferreira" },
  pauloSantos: { email: "paulo.santos@gmail.com", name: "Paulo Santos" },
  susanaMartins: { email: "susana.martins@gmail.com", name: "Susana Martins" },
  claudiaSilva: { email: "claudia.silva@gmail.com", name: "Claudia Silva" },
  helenaRibeiro: { email: "helena.ribeiro@gmail.com", name: "Helena Ribeiro" },
  pedroCosta: { email: "pedro.costa@gmail.com", name: "Pedro Costa" },
  catarinaCosta: { email: "catarina.costa@gmail.com", name: "Catarina Costa" },
  sofiaSousa: { email: "sofia.sousa@gmail.com", name: "Sofia Sousa" },
  ricardoAlmeida: { email: "ricardo.almeida@gmail.com", name: "Ricardo Almeida" },
  teresaGomes: { email: "teresa.gomes@gmail.com", name: "Teresa Gomes" },
  miguelGomes: { email: "miguel.gomes@gmail.com", name: "Miguel Gomes" },
  danielLopes: { email: "daniel.lopes@gmail.com", name: "Daniel Lopes" },
  carlaLopes: { email: "carla.lopes@gmail.com", name: "Carla Lopes" },
  paulaPereira: { email: "paula.pereira@gmail.com", name: "Paula Pereira" },
  vitorFernandes: { email: "vitor.fernandes@gmail.com", name: "Vitor Fernandes" },
  anaOliveira: { email: "ana.oliveira@gmail.com", name: "Ana Oliveira" },
  luisaMarques: { email: "luisa.marques@gmail.com", name: "Luisa Marques" },
  andreNeves: { email: "andre.neves@gmail.com", name: "Andre Neves" },
  rosaBorges: { email: "rosa.borges@gmail.com", name: "Rosa Borges" },
  antonioPires: { email: "antonio.pires@gmail.com", name: "Antonio Pires" },
  carlaAntunes: { email: "carla.antunes@gmail.com", name: "Carla Antunes" },
  guardianEmpty: {
    email: "encarregado.sem.alunos@gmail.com",
    name: "Encarregado Sem Alunos",
  },
} as const;

type GuardianKey = keyof typeof GUARDIANS;
type FitnessProfile =
  | "athletic"
  | "balanced"
  | "mixed"
  | "improvementHigh"
  | "improvementLow";
type HistoryMode = "full" | "current" | "historic" | "none";
type DataMode = "full" | "biometrics" | "tests" | "questionnaires" | "none";
type QuestionnaireMode = "full" | "minimal" | "none";
type KidmedMode = "optimal" | "average" | "very_low" | "consent_only" | "none";
type ExemptionMode = "active" | "expired" | "future" | "none";
type SosMode = "open" | "resolved" | "none";

interface GuardianAssignment {
  guardianKey: GuardianKey;
  relationship: "PAI" | "MAE" | "EE" | "OUTRO";
}

interface StudentBlueprint {
  key: string;
  name: string;
  sex: Sex;
  birthDate: string;
  schoolYear: typeof CURRENT_YEAR | typeof PREVIOUS_YEAR;
  className: (typeof CLASS_NAMES)[number];
  profile: FitnessProfile;
  history: HistoryMode;
  dataMode: DataMode;
  questionnaires: QuestionnaireMode;
  kidmed: KidmedMode;
  guardians: GuardianAssignment[];
  linkedUserEmail?: string;
  reports?: number;
  exemption?: ExemptionMode;
  sos?: SosMode;
}

const STUDENTS: StudentBlueprint[] = [
  {
    key: "afonso-martins",
    name: "Afonso Martins",
    sex: Sex.M,
    birthDate: "2013-02-14",
    schoolYear: CURRENT_YEAR,
    className: "7A",
    profile: "balanced",
    history: "full",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "optimal",
    guardians: [{ guardianKey: "susanaMartins", relationship: "MAE" }],
    linkedUserEmail: `afonso.martins@${INTERNAL_EMAIL_DOMAIN}`,
    reports: 2,
  },
  {
    key: "afonso-santos",
    name: "Afonso Santos",
    sex: Sex.M,
    birthDate: "2013-06-09",
    schoolYear: CURRENT_YEAR,
    className: "7A",
    profile: "improvementHigh",
    history: "current",
    dataMode: "full",
    questionnaires: "minimal",
    kidmed: "none",
    guardians: [{ guardianKey: "pauloSantos", relationship: "EE" }],
    sos: "open",
  },
  {
    key: "ana-ferreira",
    name: "Ana Ferreira",
    sex: Sex.F,
    birthDate: "2013-01-20",
    schoolYear: CURRENT_YEAR,
    className: "7A",
    profile: "athletic",
    history: "full",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "optimal",
    guardians: [
      { guardianKey: "joaoFerreira", relationship: "PAI" },
      { guardianKey: "martaFerreira", relationship: "MAE" },
    ],
    reports: 1,
  },
  {
    key: "ana-marques",
    name: "Ana Marques",
    sex: Sex.F,
    birthDate: "2013-04-12",
    schoolYear: CURRENT_YEAR,
    className: "7A",
    profile: "balanced",
    history: "current",
    dataMode: "biometrics",
    questionnaires: "minimal",
    kidmed: "none",
    guardians: [],
  },
  {
    key: "ana-silva",
    name: "Ana Silva",
    sex: Sex.F,
    birthDate: "2013-09-01",
    schoolYear: CURRENT_YEAR,
    className: "7A",
    profile: "mixed",
    history: "none",
    dataMode: "questionnaires",
    questionnaires: "full",
    kidmed: "consent_only",
    guardians: [{ guardianKey: "claudiaSilva", relationship: "EE" }],
  },
  {
    key: "beatriz-ribeiro",
    name: "Beatriz Ribeiro",
    sex: Sex.F,
    birthDate: "2012-11-11",
    schoolYear: CURRENT_YEAR,
    className: "7B",
    profile: "balanced",
    history: "full",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "average",
    guardians: [{ guardianKey: "helenaRibeiro", relationship: "MAE" }],
    linkedUserEmail: `beatriz.ribeiro@${INTERNAL_EMAIL_DOMAIN}`,
    reports: 1,
    exemption: "active",
  },
  {
    key: "bruno-costa",
    name: "Bruno Costa",
    sex: Sex.M,
    birthDate: "2012-08-24",
    schoolYear: CURRENT_YEAR,
    className: "7B",
    profile: "mixed",
    history: "current",
    dataMode: "tests",
    questionnaires: "minimal",
    kidmed: "average",
    guardians: [
      { guardianKey: "pedroCosta", relationship: "PAI" },
      { guardianKey: "catarinaCosta", relationship: "MAE" },
    ],
  },
  {
    key: "carolina-sousa",
    name: "Carolina Sousa",
    sex: Sex.F,
    birthDate: "2013-03-18",
    schoolYear: CURRENT_YEAR,
    className: "7B",
    profile: "balanced",
    history: "full",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "optimal",
    guardians: [{ guardianKey: "sofiaSousa", relationship: "EE" }],
    sos: "resolved",
  },
  {
    key: "diogo-almeida",
    name: "Diogo Almeida",
    sex: Sex.M,
    birthDate: "2012-12-02",
    schoolYear: CURRENT_YEAR,
    className: "7B",
    profile: "balanced",
    history: "none",
    dataMode: "none",
    questionnaires: "none",
    kidmed: "none",
    guardians: [{ guardianKey: "ricardoAlmeida", relationship: "PAI" }],
  },
  {
    key: "eva-martins",
    name: "Eva Martins",
    sex: Sex.F,
    birthDate: "2013-07-07",
    schoolYear: CURRENT_YEAR,
    className: "7B",
    profile: "athletic",
    history: "historic",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "optimal",
    guardians: [{ guardianKey: "susanaMartins", relationship: "MAE" }],
  },
  {
    key: "francisco-gomes",
    name: "Francisco Gomes",
    sex: Sex.M,
    birthDate: "2012-02-25",
    schoolYear: CURRENT_YEAR,
    className: "8A",
    profile: "athletic",
    history: "full",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "average",
    guardians: [
      { guardianKey: "teresaGomes", relationship: "MAE" },
      { guardianKey: "miguelGomes", relationship: "PAI" },
    ],
    linkedUserEmail: `francisco.gomes@${INTERNAL_EMAIL_DOMAIN}`,
  },
  {
    key: "ines-ferreira",
    name: "Ines Ferreira",
    sex: Sex.F,
    birthDate: "2011-10-10",
    schoolYear: CURRENT_YEAR,
    className: "8A",
    profile: "balanced",
    history: "full",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "optimal",
    guardians: [
      { guardianKey: "joaoFerreira", relationship: "PAI" },
      { guardianKey: "martaFerreira", relationship: "MAE" },
    ],
  },
  {
    key: "joao-costa",
    name: "Joao Costa",
    sex: Sex.M,
    birthDate: "2012-05-30",
    schoolYear: CURRENT_YEAR,
    className: "8A",
    profile: "mixed",
    history: "none",
    dataMode: "questionnaires",
    questionnaires: "full",
    kidmed: "consent_only",
    guardians: [{ guardianKey: "pedroCosta", relationship: "PAI" }],
  },
  {
    key: "leonor-ribeiro",
    name: "Leonor Ribeiro",
    sex: Sex.F,
    birthDate: "2011-11-22",
    schoolYear: CURRENT_YEAR,
    className: "8A",
    profile: "mixed",
    history: "current",
    dataMode: "full",
    questionnaires: "minimal",
    kidmed: "average",
    guardians: [{ guardianKey: "helenaRibeiro", relationship: "MAE" }],
    exemption: "expired",
  },
  {
    key: "martim-sousa",
    name: "Martim Sousa",
    sex: Sex.M,
    birthDate: "2012-01-15",
    schoolYear: CURRENT_YEAR,
    className: "8A",
    profile: "improvementHigh",
    history: "current",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "very_low",
    guardians: [{ guardianKey: "sofiaSousa", relationship: "EE" }],
    sos: "open",
  },
  {
    key: "mariana-lopes",
    name: "Mariana Lopes",
    sex: Sex.F,
    birthDate: "2011-09-14",
    schoolYear: CURRENT_YEAR,
    className: "8B",
    profile: "balanced",
    history: "full",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "optimal",
    guardians: [
      { guardianKey: "danielLopes", relationship: "PAI" },
      { guardianKey: "carlaLopes", relationship: "MAE" },
    ],
    reports: 2,
  },
  {
    key: "miguel-pereira",
    name: "Miguel Pereira",
    sex: Sex.M,
    birthDate: "2011-04-03",
    schoolYear: CURRENT_YEAR,
    className: "8B",
    profile: "balanced",
    history: "current",
    dataMode: "biometrics",
    questionnaires: "minimal",
    kidmed: "average",
    guardians: [{ guardianKey: "paulaPereira", relationship: "MAE" }],
  },
  {
    key: "rita-fernandes",
    name: "Rita Fernandes",
    sex: Sex.F,
    birthDate: "2011-12-27",
    schoolYear: CURRENT_YEAR,
    className: "8B",
    profile: "mixed",
    history: "full",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "average",
    guardians: [{ guardianKey: "vitorFernandes", relationship: "PAI" }],
  },
  {
    key: "rodrigo-ferreira",
    name: "Rodrigo Ferreira",
    sex: Sex.M,
    birthDate: "2011-06-06",
    schoolYear: CURRENT_YEAR,
    className: "8B",
    profile: "improvementLow",
    history: "full",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "very_low",
    guardians: [
      { guardianKey: "joaoFerreira", relationship: "PAI" },
      { guardianKey: "martaFerreira", relationship: "MAE" },
    ],
    reports: 1,
  },
  {
    key: "sofia-martins",
    name: "Sofia Martins",
    sex: Sex.F,
    birthDate: "2011-08-19",
    schoolYear: CURRENT_YEAR,
    className: "8B",
    profile: "athletic",
    history: "current",
    dataMode: "tests",
    questionnaires: "minimal",
    kidmed: "average",
    guardians: [{ guardianKey: "susanaMartins", relationship: "MAE" }],
    linkedUserEmail: `sofia.martins@${INTERNAL_EMAIL_DOMAIN}`,
  },
  {
    key: "tomas-santos",
    name: "Tomas Santos",
    sex: Sex.M,
    birthDate: "2010-10-08",
    schoolYear: CURRENT_YEAR,
    className: "9A",
    profile: "balanced",
    history: "full",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "average",
    guardians: [{ guardianKey: "pauloSantos", relationship: "PAI" }],
  },
  {
    key: "matilde-costa",
    name: "Matilde Costa",
    sex: Sex.F,
    birthDate: "2010-09-16",
    schoolYear: CURRENT_YEAR,
    className: "9A",
    profile: "athletic",
    history: "current",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "optimal",
    guardians: [
      { guardianKey: "pedroCosta", relationship: "PAI" },
      { guardianKey: "catarinaCosta", relationship: "MAE" },
    ],
    exemption: "future",
  },
  {
    key: "guilherme-oliveira",
    name: "Guilherme Oliveira",
    sex: Sex.M,
    birthDate: "2010-02-02",
    schoolYear: CURRENT_YEAR,
    className: "9A",
    profile: "mixed",
    history: "historic",
    dataMode: "full",
    questionnaires: "minimal",
    kidmed: "none",
    guardians: [{ guardianKey: "anaOliveira", relationship: "EE" }],
  },
  {
    key: "laura-marques",
    name: "Laura Marques",
    sex: Sex.F,
    birthDate: "2010-12-12",
    schoolYear: CURRENT_YEAR,
    className: "9A",
    profile: "balanced",
    history: "full",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "optimal",
    guardians: [{ guardianKey: "luisaMarques", relationship: "MAE" }],
    linkedUserEmail: `laura.marques@${INTERNAL_EMAIL_DOMAIN}`,
    reports: 2,
    sos: "resolved",
  },
  {
    key: "pedro-silva",
    name: "Pedro Silva",
    sex: Sex.M,
    birthDate: "2010-03-28",
    schoolYear: CURRENT_YEAR,
    className: "9A",
    profile: "balanced",
    history: "none",
    dataMode: "none",
    questionnaires: "none",
    kidmed: "none",
    guardians: [],
    linkedUserEmail: `pedro.silva@${INTERNAL_EMAIL_DOMAIN}`,
  },
  {
    key: "bianca-neves",
    name: "Bianca Neves",
    sex: Sex.F,
    birthDate: "2012-02-17",
    schoolYear: PREVIOUS_YEAR,
    className: "7A",
    profile: "balanced",
    history: "full",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "average",
    guardians: [{ guardianKey: "andreNeves", relationship: "PAI" }],
    reports: 1,
  },
  {
    key: "duarte-campos",
    name: "Duarte Campos",
    sex: Sex.M,
    birthDate: "2012-05-05",
    schoolYear: PREVIOUS_YEAR,
    className: "7B",
    profile: "mixed",
    history: "full",
    dataMode: "full",
    questionnaires: "minimal",
    kidmed: "none",
    guardians: [],
  },
  {
    key: "helena-borges",
    name: "Helena Borges",
    sex: Sex.F,
    birthDate: "2011-01-31",
    schoolYear: PREVIOUS_YEAR,
    className: "8A",
    profile: "athletic",
    history: "full",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "optimal",
    guardians: [{ guardianKey: "rosaBorges", relationship: "MAE" }],
  },
  {
    key: "nuno-pires",
    name: "Nuno Pires",
    sex: Sex.M,
    birthDate: "2011-07-21",
    schoolYear: PREVIOUS_YEAR,
    className: "8B",
    profile: "improvementHigh",
    history: "full",
    dataMode: "full",
    questionnaires: "minimal",
    kidmed: "very_low",
    guardians: [{ guardianKey: "antonioPires", relationship: "PAI" }],
    exemption: "expired",
  },
  {
    key: "sara-antunes",
    name: "Sara Antunes",
    sex: Sex.F,
    birthDate: "2010-11-03",
    schoolYear: PREVIOUS_YEAR,
    className: "9A",
    profile: "balanced",
    history: "full",
    dataMode: "full",
    questionnaires: "full",
    kidmed: "average",
    guardians: [{ guardianKey: "carlaAntunes", relationship: "MAE" }],
  },
];

const PROFILE_SETTINGS: Record<
  FitnessProfile,
  {
    bmiStart: number;
    bmiStep: number;
    waistStart: number;
    waistStep: number;
    fatStart: number;
    fatStep: number;
    tests: Record<(typeof TEST_CATALOG)[number]["id"], number>;
    weakTests: Array<(typeof TEST_CATALOG)[number]["id"]>;
  }
> = {
  athletic: {
    bmiStart: 18.2,
    bmiStep: 0.1,
    waistStart: 61,
    waistStep: 0.6,
    fatStart: 15.5,
    fatStep: 0.2,
    tests: { vai: 56, cooper: 2450, milha: 7.25, velocidade: 7.2, agilidade: 10.1, abd: 43, bracos: 20, senta: 30 },
    weakTests: [],
  },
  balanced: {
    bmiStart: 19.5,
    bmiStep: 0.08,
    waistStart: 64,
    waistStep: 0.5,
    fatStart: 19.2,
    fatStep: 0.2,
    tests: { vai: 48, cooper: 2175, milha: 8.0, velocidade: 7.8, agilidade: 10.8, abd: 35, bracos: 14, senta: 24 },
    weakTests: [],
  },
  mixed: {
    bmiStart: 22.1,
    bmiStep: 0.03,
    waistStart: 69,
    waistStep: 0.4,
    fatStart: 22.3,
    fatStep: 0.2,
    tests: { vai: 40, cooper: 1875, milha: 8.9, velocidade: 8.45, agilidade: 11.5, abd: 27, bracos: 10, senta: 18 },
    weakTests: ["cooper", "milha", "velocidade", "bracos"],
  },
  improvementHigh: {
    bmiStart: 26.4,
    bmiStep: -0.18,
    waistStart: 81,
    waistStep: -0.9,
    fatStart: 28.5,
    fatStep: -0.4,
    tests: { vai: 29, cooper: 1580, milha: 10.4, velocidade: 9.2, agilidade: 12.4, abd: 18, bracos: 6, senta: 13 },
    weakTests: ["vai", "cooper", "milha", "velocidade", "agilidade", "abd", "bracos", "senta"],
  },
  improvementLow: {
    bmiStart: 17.0,
    bmiStep: 0.15,
    waistStart: 60,
    waistStep: 0.3,
    fatStart: 14.2,
    fatStep: 0.2,
    tests: { vai: 31, cooper: 1660, milha: 10.0, velocidade: 8.9, agilidade: 12.0, abd: 17, bracos: 5, senta: 15 },
    weakTests: ["vai", "cooper", "milha", "bracos"],
  },
};

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function round(value: number, decimals = 1) {
  return Number(value.toFixed(decimals));
}

function computeAge(birthDate: string, schoolYear: string) {
  const birth = dateOnly(birthDate);
  const [schoolYearStart] = schoolYear.split("/").map(Number);
  const reference = new Date(Date.UTC(schoolYearStart + 1, 5, 30));
  let age = reference.getUTCFullYear() - birth.getUTCFullYear();
  const hasBirthdayPassed =
    reference.getUTCMonth() > birth.getUTCMonth() ||
    (reference.getUTCMonth() === birth.getUTCMonth() &&
      reference.getUTCDate() >= birth.getUTCDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age;
}

function gradeFromClassName(className: string) {
  const firstDigit = Number.parseInt(className[0] ?? "7", 10);
  return Number.isFinite(firstDigit) ? firstDigit : 7;
}

function getBaseHeight(sex: Sex, className: string) {
  const grade = gradeFromClassName(className);
  const baseByGrade = grade === 7 ? 1.5 : grade === 8 ? 1.58 : 1.64;
  return sex === Sex.F ? baseByGrade - 0.02 : baseByGrade;
}

function getHeightForSession(blueprint: StudentBlueprint, sessionIndex: number) {
  const baseHeight = getBaseHeight(blueprint.sex, blueprint.className);
  return round(baseHeight + sessionIndex * 0.015, 2);
}

function getBiometricForSession(
  blueprint: StudentBlueprint,
  sessionIndex: number,
) {
  const profile = PROFILE_SETTINGS[blueprint.profile];
  const heightM = getHeightForSession(blueprint, sessionIndex);
  const bmi = round(profile.bmiStart + profile.bmiStep * sessionIndex, 1);
  const weightKg = round(bmi * heightM * heightM, 2);
  const waistCm = round(profile.waistStart + profile.waistStep * sessionIndex, 1);
  const fatPct = round(profile.fatStart + profile.fatStep * sessionIndex, 1);
  const isImcHealthy = bmi >= 18 && bmi < 24;
  const isWaistHealthy = blueprint.profile !== "improvementHigh";
  const isFatHealthy = blueprint.profile !== "improvementHigh";

  return {
    heightM,
    weightKg,
    waistCm,
    fatPct,
    imc: bmi,
    imcZone: isImcHealthy ? HEALTHY_ZONE : IMPROVEMENT_ZONE,
    waistZone: isWaistHealthy ? HEALTHY_ZONE : IMPROVEMENT_ZONE,
    fatZone: isFatHealthy ? HEALTHY_ZONE : IMPROVEMENT_ZONE,
  };
}

function formatTime(minutesDecimal: number) {
  const minutes = Math.floor(minutesDecimal);
  const seconds = Math.round((minutesDecimal - minutes) * 60);
  const paddedSeconds = seconds.toString().padStart(2, "0");
  return `${minutes}:${paddedSeconds}`;
}

function getTestsForSession(
  blueprint: StudentBlueprint,
  sessionIndex: number,
) {
  const profile = PROFILE_SETTINGS[blueprint.profile];
  const weakTestSet = new Set(profile.weakTests);

  return TEST_CATALOG.map((test) => {
    const direction =
      test.id === "velocidade" ||
      test.id === "agilidade" ||
      test.id === "milha"
        ? -1
        : 1;
    const delta =
      test.id === "cooper"
        ? 40
        : test.id === "senta"
          ? 0.8
          : test.id === "velocidade" ||
              test.id === "agilidade" ||
              test.id === "milha"
            ? 0.08
            : 1;
    const rawValue = profile.tests[test.id] + direction * sessionIndex * delta;
    const roundedValue =
      test.id === "cooper" ||
      test.id === "abd" ||
      test.id === "bracos" ||
      test.id === "vai"
        ? Math.round(rawValue)
        : round(rawValue, 1);

    return {
      testId: test.id,
      unit: test.unit,
      valueNum: test.id === "milha" ? round(rawValue, 2) : roundedValue,
      valueText: test.id === "milha" ? formatTime(rawValue) : String(roundedValue),
      zone: weakTestSet.has(test.id) ? IMPROVEMENT_ZONE : HEALTHY_ZONE,
    };
  });
}

function getAssessmentTemplates(blueprint: StudentBlueprint) {
  if (blueprint.history === "none") {
    return [];
  }

  if (blueprint.schoolYear === PREVIOUS_YEAR) {
    return [...TERM_TEMPLATES[PREVIOUS_YEAR]];
  }

  if (blueprint.history === "current") {
    return [...TERM_TEMPLATES[CURRENT_YEAR]];
  }

  if (blueprint.history === "historic") {
    return [...TERM_TEMPLATES[PREVIOUS_YEAR]];
  }

  return [...TERM_TEMPLATES[PREVIOUS_YEAR], ...TERM_TEMPLATES[CURRENT_YEAR]];
}

function getRoutinePayload(profileName: FitnessProfile, variant = 0) {
  const payloadByProfile: Record<FitnessProfile, Record<string, boolean | number>> = {
    athletic: {
      sleepHours: 8.5 - variant * 0.2,
      screenHours: 2 + variant * 0.4,
      waterGlasses: 8 - variant,
      mealsCount: 5,
      energyLevel: 9 - variant,
      stressLevel: 2 + variant,
      wellnessLevel: 9 - variant,
    },
    balanced: {
      sleepHours: 8 - variant * 0.2,
      screenHours: 3 + variant * 0.5,
      waterGlasses: 7 - variant,
      mealsCount: 4,
      energyLevel: 8 - variant,
      stressLevel: 3 + variant,
      wellnessLevel: 8 - variant,
    },
    mixed: {
      sleepHours: 7.5 - variant * 0.2,
      screenHours: 4.5 + variant * 0.3,
      waterGlasses: 5,
      mealsCount: 4,
      energyLevel: 6,
      stressLevel: 5 + variant,
      wellnessLevel: 6 - variant,
    },
    improvementHigh: {
      sleepHours: 6.5,
      screenHours: 6.5 + variant * 0.5,
      waterGlasses: 4,
      mealsCount: 3,
      energyLevel: 4,
      stressLevel: 8,
      wellnessLevel: 4,
    },
    improvementLow: {
      sleepHours: 7.0,
      screenHours: 5.5,
      waterGlasses: 5,
      mealsCount: 4,
      energyLevel: 5,
      stressLevel: 6,
      wellnessLevel: 5,
    },
  };

  return payloadByProfile[profileName];
}

function getInitialPayload(profileName: FitnessProfile) {
  return {
    hasAllergies: false,
    hasMedication: false,
    hasInjuries: profileName === "improvementHigh",
    sportsPractice: profileName === "athletic" || profileName === "balanced",
    eatsBreakfast: profileName !== "improvementHigh",
    eatsFruitsVegetables: profileName !== "improvementHigh",
    drinksWaterEnough: profileName !== "improvementHigh",
    physicalActivityFreq:
      profileName === "athletic"
        ? 6
        : profileName === "balanced"
          ? 4
          : profileName === "mixed"
            ? 3
            : 2,
  };
}

function getKidmedAnswers(
  mode: Exclude<KidmedMode, "none" | "consent_only">,
): KidmedAnswers {
  if (mode === "optimal") {
    return {
      fruitDaily: true,
      secondFruitDaily: true,
      vegetablesDaily: true,
      vegetablesMoreThanOnceDaily: true,
      fishRegularly: true,
      fastFoodWeekly: false,
      pulsesMoreThanOnceWeekly: true,
      wholeGrainPastaOrRice: true,
      wholeGrainsBreakfast: true,
      nutsRegularly: true,
      oliveOilAtHome: true,
      skipsBreakfast: false,
      dairyBreakfast: true,
      pastriesBreakfast: false,
      yogurtOrCheeseDaily: true,
      sweetsSeveralTimesDaily: false,
    };
  }

  if (mode === "average") {
    return {
      fruitDaily: true,
      secondFruitDaily: false,
      vegetablesDaily: true,
      vegetablesMoreThanOnceDaily: false,
      fishRegularly: true,
      fastFoodWeekly: true,
      pulsesMoreThanOnceWeekly: true,
      wholeGrainPastaOrRice: false,
      wholeGrainsBreakfast: true,
      nutsRegularly: false,
      oliveOilAtHome: true,
      skipsBreakfast: false,
      dairyBreakfast: true,
      pastriesBreakfast: true,
      yogurtOrCheeseDaily: true,
      sweetsSeveralTimesDaily: false,
    };
  }

  return {
    fruitDaily: false,
    secondFruitDaily: false,
    vegetablesDaily: false,
    vegetablesMoreThanOnceDaily: false,
    fishRegularly: false,
    fastFoodWeekly: true,
    pulsesMoreThanOnceWeekly: false,
    wholeGrainPastaOrRice: false,
    wholeGrainsBreakfast: false,
    nutsRegularly: false,
    oliveOilAtHome: false,
    skipsBreakfast: true,
    dairyBreakfast: false,
    pastriesBreakfast: true,
    yogurtOrCheeseDaily: false,
    sweetsSeveralTimesDaily: true,
  };
}

function getQuestionnaireDates(blueprint: StudentBlueprint) {
  if (blueprint.schoolYear === PREVIOUS_YEAR || blueprint.history === "historic") {
    return [
      new Date("2025-02-18T11:00:00Z"),
      new Date("2025-05-21T11:00:00Z"),
    ];
  }

  return [new Date("2026-02-17T11:00:00Z"), new Date("2026-04-08T11:00:00Z")];
}

async function ensureUser(params: {
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  consentShare?: boolean;
}) {
  return prisma.user.upsert({
    where: { email: params.email },
    update: {
      name: params.name,
      role: params.role,
      passwordHash: params.passwordHash,
      consentRgpd: true,
      consentShare: params.consentShare ?? true,
    },
    create: {
      email: params.email,
      name: params.name,
      role: params.role,
      passwordHash: params.passwordHash,
      consentRgpd: true,
      consentShare: params.consentShare ?? true,
    },
  });
}

async function main() {
  console.log("Seeding deterministic demo data for full-app QA...");

  await prisma.auditLog.deleteMany();
  await prisma.studentGuardian.deleteMany();
  await prisma.exemption.deleteMany();
  await prisma.report.deleteMany();
  await prisma.sosAlert.deleteMany();
  await prisma.questionnaire.deleteMany();
  await prisma.test.deleteMany();
  await prisma.biometric.deleteMany();
  await prisma.evaluationSession.deleteMany();
  await prisma.student.deleteMany();
  await prisma.schoolClass.deleteMany();
  await prisma.academicYear.deleteMany();

  const coreStaffEmails = [
    `admin@${INTERNAL_EMAIL_DOMAIN}`,
    `professor@${INTERNAL_EMAIL_DOMAIN}`,
    `psicologo@${INTERNAL_EMAIL_DOMAIN}`,
  ];

  await prisma.user.deleteMany({
    where: {
      email: {
        notIn: coreStaffEmails,
      },
    },
  });

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const admin = await ensureUser({
    email: `admin@${INTERNAL_EMAIL_DOMAIN}`,
    name: "Admin Atlantico",
    role: Role.ADMIN,
    passwordHash,
    consentShare: true,
  });
  const professor = await ensureUser({
    email: `professor@${INTERNAL_EMAIL_DOMAIN}`,
    name: "Prof. Carlos Silva",
    role: Role.PROFESSOR,
    passwordHash,
    consentShare: true,
  });
  const psychologist = await ensureUser({
    email: `psicologo@${INTERNAL_EMAIL_DOMAIN}`,
    name: "Dra. Ana Rodrigues",
    role: Role.PSICOLOGO,
    passwordHash,
    consentShare: true,
  });
  const professorTwo = await ensureUser({
    email: `prof.sofia@${INTERNAL_EMAIL_DOMAIN}`,
    name: "Prof. Sofia Mendes",
    role: Role.PROFESSOR,
    passwordHash,
    consentShare: true,
  });
  const psychologistTwo = await ensureUser({
    email: `psic.marta@${INTERNAL_EMAIL_DOMAIN}`,
    name: "Dra. Marta Costa",
    role: Role.PSICOLOGO,
    passwordHash,
    consentShare: true,
  });

  await ensureUser({
    email: `aluno.sem.registo@${INTERNAL_EMAIL_DOMAIN}`,
    name: "Aluno Sem Registo",
    role: Role.ALUNO,
    passwordHash,
    consentShare: true,
  });

  const guardianUsers = new Map<GuardianKey, Awaited<ReturnType<typeof ensureUser>>>();
  for (const [guardianKey, guardian] of Object.entries(GUARDIANS) as Array<
    [GuardianKey, (typeof GUARDIANS)[GuardianKey]]
  >) {
    const user = await ensureUser({
      email: guardian.email,
      name: guardian.name,
      role: Role.PAIS,
      passwordHash,
      consentShare: true,
    });
    guardianUsers.set(guardianKey, user);
  }

  const academicYears = new Map<string, string>();
  for (const schoolYear of [PREVIOUS_YEAR, CURRENT_YEAR]) {
    const createdYear = await prisma.academicYear.create({
      data: { label: schoolYear },
    });
    academicYears.set(schoolYear, createdYear.id);
  }

  for (const schoolYear of [PREVIOUS_YEAR, CURRENT_YEAR]) {
    const academicYearId = academicYears.get(schoolYear);
    if (!academicYearId) {
      throw new Error(`Missing academic year id for ${schoolYear}`);
    }

    for (const className of CLASS_NAMES) {
      await prisma.schoolClass.create({
        data: { name: className, academicYearId },
      });
    }
  }

  const studentRecords = new Map<
    string,
    {
      blueprint: StudentBlueprint;
      student: Awaited<ReturnType<typeof prisma.student.create>>;
      primaryGuardianEmail: string | null;
    }
  >();

  let studentCounter = 1;
  for (const blueprint of STUDENTS) {
    const linkedUser = blueprint.linkedUserEmail
      ? await ensureUser({
          email: blueprint.linkedUserEmail,
          name: blueprint.name,
          role: Role.ALUNO,
          passwordHash,
          consentShare: true,
        })
      : null;

    const consentDate =
      blueprint.kidmed === "none"
        ? null
        : blueprint.schoolYear === CURRENT_YEAR
          ? new Date("2026-03-20T10:00:00Z")
          : new Date("2025-02-10T10:00:00Z");

    const student = await prisma.student.create({
      data: {
        linkedUserId: linkedUser?.id ?? null,
        createdById: admin.id,
        kidmedConsentRecordedById: consentDate ? professor.id : null,
        kidmedConsentAt: consentDate,
        name: blueprint.name,
        sex: blueprint.sex,
        birthDate: dateOnly(blueprint.birthDate),
        age: computeAge(blueprint.birthDate, blueprint.schoolYear),
        schoolYear: blueprint.schoolYear,
        className: blueprint.className,
        processNumber: `P${new Date().getFullYear()}${studentCounter.toString().padStart(4, '0')}`,
      },
    });

    studentCounter += 1;

    studentRecords.set(blueprint.key, {
      blueprint,
      student,
      primaryGuardianEmail:
        blueprint.guardians[0] == null
          ? null
          : GUARDIANS[blueprint.guardians[0].guardianKey].email,
    });
  }

  let guardianLinksCreated = 0;
  for (const { blueprint, student } of studentRecords.values()) {
    for (const assignment of blueprint.guardians) {
      const guardian = guardianUsers.get(assignment.guardianKey);
      if (!guardian) {
        throw new Error(`Missing guardian user for ${assignment.guardianKey}`);
      }

      await prisma.studentGuardian.create({
        data: {
          studentId: student.id,
          guardianUserId: guardian.id,
          relationship: assignment.relationship,
          createdById: admin.id,
          createdAt: daysAgo(90 - guardianLinksCreated),
        },
      });

      guardianLinksCreated += 1;
    }
  }

  let evaluationSessionCount = 0;
  let biometricCount = 0;
  let testCount = 0;
  let questionnaireCount = 0;
  let sosCount = 0;
  let reportCount = 0;
  let exemptionCount = 0;

  for (const { blueprint, student, primaryGuardianEmail } of studentRecords.values()) {
    const templates = getAssessmentTemplates(blueprint);

    for (const [sessionIndex, template] of templates.entries()) {
      const createdById =
        blueprint.className === "9A" || blueprint.className === "8B"
          ? professorTwo.id
          : professor.id;

      const session = await prisma.evaluationSession.create({
        data: {
          studentId: student.id,
          label: template.label,
          schoolYear: template.schoolYear,
          createdById,
          createdAt: template.date,
        },
      });

      evaluationSessionCount += 1;

      if (blueprint.dataMode === "full" || blueprint.dataMode === "biometrics") {
        await prisma.biometric.create({
          data: {
            studentId: student.id,
            sessionId: session.id,
            recordedAt: template.date,
            ...getBiometricForSession(blueprint, sessionIndex),
          },
        });
        biometricCount += 1;
      }

      if (blueprint.dataMode === "full" || blueprint.dataMode === "tests") {
        for (const test of getTestsForSession(blueprint, sessionIndex)) {
          await prisma.test.create({
            data: {
              studentId: student.id,
              sessionId: session.id,
              testId: test.testId,
              valueNum: test.valueNum,
              valueText: test.valueText,
              unit: test.unit,
              zone: test.zone,
              recordedAt: template.date,
            },
          });
          testCount += 1;
        }
      }
    }

    if (blueprint.questionnaires !== "none") {
      const questionnaireDates = getQuestionnaireDates(blueprint);
      const initialDate =
        blueprint.schoolYear === CURRENT_YEAR
          ? new Date("2025-09-18T11:00:00Z")
          : new Date("2024-09-16T11:00:00Z");

      await prisma.questionnaire.create({
        data: {
          studentId: student.id,
          type: QuestionnaireType.AUTOESTIMA,
          schoolYear: blueprint.schoolYear,
          periodKey: `INITIAL:${blueprint.schoolYear}`,
          payload: getInitialPayload(blueprint.profile),
          deferredCount: blueprint.questionnaires === "minimal" ? 1 : 0,
          submittedAt: initialDate,
        },
      });
      questionnaireCount += 1;

      const routineDates =
        blueprint.questionnaires === "full"
          ? questionnaireDates
          : questionnaireDates.slice(-1);

      for (const [variant, questionnaireDate] of routineDates.entries()) {
        const period = getSchoolPeriodInfo(questionnaireDate);
        await prisma.questionnaire.create({
          data: {
            studentId: student.id,
            type: QuestionnaireType.AUTOCONCEITO,
            schoolYear: period.schoolYear,
            periodKey: period.periodKey,
            payload: getRoutinePayload(blueprint.profile, variant),
            deferredCount:
              variant === 0 && blueprint.profile === "improvementHigh" ? 1 : 0,
            submittedAt: questionnaireDate,
          },
        });
        questionnaireCount += 1;
      }
    }

    if (blueprint.kidmed !== "none" && blueprint.kidmed !== "consent_only") {
      const kidmedDate =
        blueprint.schoolYear === CURRENT_YEAR
          ? new Date("2026-04-06T10:00:00Z")
          : new Date("2025-02-20T10:00:00Z");
      const period = getSchoolPeriodInfo(kidmedDate);
      const answers = getKidmedAnswers(blueprint.kidmed);
      const result = evaluateKidmed(answers);

      await prisma.questionnaire.create({
        data: {
          studentId: student.id,
          type: QuestionnaireType.KIDMED,
          instrumentVersion: KIDMED_INSTRUMENT_VERSION,
          schoolYear: period.schoolYear,
          periodKey: period.periodKey,
          score: result.score,
          classification: result.classification,
          payload: answers as Prisma.InputJsonValue,
          submittedAt: kidmedDate,
        },
      });
      questionnaireCount += 1;
    }

    if (blueprint.sos === "open" || blueprint.sos === "resolved") {
      const createdAt =
        blueprint.sos === "open"
          ? new Date("2026-04-03T09:00:00Z")
          : new Date("2026-02-10T09:00:00Z");

      await prisma.sosAlert.create({
        data: {
          studentId: student.id,
          psych: blueprint.className === "9A" ? "Dra. Marta Costa" : "Dra. Ana Rodrigues",
          teacher:
            blueprint.className === "9A" || blueprint.className === "8B"
              ? "Prof. Sofia Mendes"
              : "Prof. Carlos Silva",
          psychEmail:
            blueprint.className === "9A"
              ? `psic.marta@${INTERNAL_EMAIL_DOMAIN}`
              : `psicologo@${INTERNAL_EMAIL_DOMAIN}`,
          teacherEmail:
            blueprint.className === "9A" || blueprint.className === "8B"
              ? `prof.sofia@${INTERNAL_EMAIL_DOMAIN}`
              : `professor@${INTERNAL_EMAIL_DOMAIN}`,
          createdAt,
          resolved: blueprint.sos === "resolved",
          resolvedAt:
            blueprint.sos === "resolved"
              ? new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000)
              : null,
          resolvedById: blueprint.sos === "resolved" ? psychologist.id : null,
        },
      });
      sosCount += 1;
    }

    if (blueprint.exemption && blueprint.exemption !== "none") {
      const dateRange =
        blueprint.exemption === "active"
          ? {
              startDate: dateOnly("2026-04-01"),
              endDate: dateOnly("2026-05-31"),
              medicalCertificate: true,
              reason: "Entorse no tornozelo direito",
            }
          : blueprint.exemption === "future"
            ? {
                startDate: dateOnly("2026-05-10"),
                endDate: dateOnly("2026-06-20"),
                medicalCertificate: true,
                reason: "Recuperacao pos cirurgia",
              }
            : blueprint.schoolYear === PREVIOUS_YEAR
              ? {
                  startDate: dateOnly("2025-01-10"),
                  endDate: dateOnly("2025-02-14"),
                  medicalCertificate: false,
                  reason: "Recuperacao muscular",
                }
              : {
                  startDate: dateOnly("2026-01-10"),
                  endDate: dateOnly("2026-02-14"),
                  medicalCertificate: false,
                  reason: "Queixa lombar temporaria",
                };

      await prisma.exemption.create({
        data: {
          studentId: student.id,
          createdById: professor.id,
          reason: dateRange.reason,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          medicalCertificate: dateRange.medicalCertificate,
          createdAt: new Date(dateRange.startDate),
        },
      });
      exemptionCount += 1;
    }

    if ((blueprint.reports ?? 0) > 0 && primaryGuardianEmail) {
      for (let index = 0; index < (blueprint.reports ?? 0); index += 1) {
        const createdAt =
          blueprint.schoolYear === CURRENT_YEAR
            ? new Date(Date.UTC(2026, 1 + index, 10 + index, 8, 30, 0))
            : new Date(Date.UTC(2025, 1 + index, 12 + index, 8, 30, 0));
        await prisma.report.create({
          data: {
            studentId: student.id,
            title: `Relatorio de progresso ${index + 1}`,
            emailedTo: primaryGuardianEmail,
            schoolYear: blueprint.schoolYear,
            createdById: professor.id,
            createdAt,
          },
        });
        reportCount += 1;
      }
    }
  }

  const auditEntries: Prisma.AuditLogCreateManyInput[] = [
    { userId: admin.id, action: AUDIT_ACTIONS.LOGIN, ipAddress: "10.0.0.10", createdAt: daysAgo(2) },
    { userId: professor.id, action: AUDIT_ACTIONS.LOGIN, ipAddress: "10.0.0.21", createdAt: daysAgo(2) },
    { userId: psychologist.id, action: AUDIT_ACTIONS.LOGIN, ipAddress: "10.0.0.31", createdAt: daysAgo(1) },
    { userId: admin.id, action: AUDIT_ACTIONS.CREATE_STUDENT, targetId: studentRecords.get("afonso-martins")?.student.id, ipAddress: "10.0.0.10", createdAt: daysAgo(20) },
    { userId: professor.id, action: AUDIT_ACTIONS.RECORD_BIOMETRICS, targetId: studentRecords.get("beatriz-ribeiro")?.student.id, ipAddress: "10.0.0.21", createdAt: daysAgo(12) },
    { userId: professor.id, action: AUDIT_ACTIONS.RECORD_TESTS, targetId: studentRecords.get("francisco-gomes")?.student.id, ipAddress: "10.0.0.21", createdAt: daysAgo(12) },
    { userId: professor.id, action: AUDIT_ACTIONS.SUBMIT_QUESTIONNAIRE, targetId: studentRecords.get("ana-silva")?.student.id, ipAddress: "10.0.0.21", createdAt: daysAgo(10) },
    { userId: admin.id, action: AUDIT_ACTIONS.ADD_GUARDIAN, targetId: studentRecords.get("ana-ferreira")?.student.id, ipAddress: "10.0.0.10", createdAt: daysAgo(30) },
    { userId: professor.id, action: AUDIT_ACTIONS.CREATE_EXEMPTION, targetId: studentRecords.get("beatriz-ribeiro")?.student.id, ipAddress: "10.0.0.21", createdAt: daysAgo(8) },
    { userId: professor.id, action: AUDIT_ACTIONS.TRIGGER_SOS, targetId: studentRecords.get("martim-sousa")?.student.id, ipAddress: "10.0.0.21", createdAt: daysAgo(7) },
    { userId: psychologist.id, action: AUDIT_ACTIONS.RESOLVE_SOS, targetId: studentRecords.get("carolina-sousa")?.student.id, ipAddress: "10.0.0.31", createdAt: daysAgo(6) },
    { userId: professor.id, action: AUDIT_ACTIONS.SEND_REPORT, targetId: studentRecords.get("laura-marques")?.student.id, ipAddress: "10.0.0.21", createdAt: daysAgo(5) },
    { userId: admin.id, action: AUDIT_ACTIONS.EXPORT_REPORT, targetId: studentRecords.get("afonso-martins")?.student.id, ipAddress: "10.0.0.10", createdAt: daysAgo(4) },
    { userId: guardianUsers.get("joaoFerreira")?.id ?? null, action: AUDIT_ACTIONS.UPDATE_CONSENT, targetId: studentRecords.get("ana-ferreira")?.student.id, ipAddress: "82.154.10.20", createdAt: daysAgo(3) },
    { userId: studentRecords.get("beatriz-ribeiro")?.student.linkedUserId ?? null, action: AUDIT_ACTIONS.READ_BIOMETRICS, targetId: studentRecords.get("beatriz-ribeiro")?.student.id, ipAddress: "82.154.22.11", createdAt: daysAgo(1) },
  ].filter((entry) => entry.targetId !== undefined);

  await prisma.auditLog.createMany({ data: auditEntries });

  // --- Dynamic SOS Alerts injection (Merged from seed-sos.ts) ---
  for (const { student } of studentRecords.values()) {
    // Making random alerts to match seed-sos.ts logic!
    if (Math.random() < 0.5) {
      const isResolved = Math.random() > 0.5;
      await prisma.sosAlert.create({
        data: {
          studentId: student.id,
          psych: psychologist.name ?? "",
          teacher: professor.name ?? "",
          psychEmail: psychologist.email,
          teacherEmail: professor.email,
          createdAt: new Date(),
          resolved: isResolved,
          resolvedAt: isResolved ? new Date() : null,
          resolvedById: isResolved ? admin.id : null,
        },
      });
      sosCount += 1;

      // Add a historic resolved alert
      await prisma.sosAlert.create({
        data: {
          studentId: student.id,
          psych: psychologist.name ?? "",
          teacher: professor.name ?? "",
          psychEmail: psychologist.email,
          teacherEmail: professor.email,
          createdAt: new Date(Date.now() - 100000000),
          resolved: true,
          resolvedAt: new Date(Date.now() - 50000000),
          resolvedById: admin.id,
        },
      });
      sosCount += 1;
    }
  }

  console.log("Seed complete.");
  console.log(`Students: ${studentRecords.size}`);
  console.log(`Guardian links: ${guardianLinksCreated}`);
  console.log(`Evaluation sessions: ${evaluationSessionCount}`);
  console.log(`Biometrics: ${biometricCount}`);
  console.log(`Tests: ${testCount}`);
  console.log(`Questionnaires: ${questionnaireCount}`);
  console.log(`SOS alerts: ${sosCount}`);
  console.log(`Reports: ${reportCount}`);
  console.log(`Exemptions: ${exemptionCount}`);
  console.log("Demo passwords: Password1");
  console.log(
    `Core logins: admin@${INTERNAL_EMAIL_DOMAIN}, professor@${INTERNAL_EMAIL_DOMAIN}, psicologo@${INTERNAL_EMAIL_DOMAIN}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
