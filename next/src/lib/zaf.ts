import type { Sex } from "@prisma/client";

// ── BMI Lookup Table (Zona Saudável range by age + sex) ──────────────────────

type AgeKey = 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18;

const BMI_TABLE: Record<Sex, Record<AgeKey, [min: number, max: number]>> = {
  F: {
    9: [13.3, 18.7],
    10: [13.7, 19.4],
    11: [14.1, 20.3],
    12: [14.7, 21.3],
    13: [15.2, 22.3],
    14: [15.7, 23.1],
    15: [16.0, 23.8],
    16: [16.3, 24.3],
    17: [16.4, 24.6],
    18: [18.5, 25.0],
  },
  M: {
    9: [13.6, 18.2],
    10: [13.9, 18.8],
    11: [14.2, 19.5],
    12: [14.7, 20.4],
    13: [15.2, 21.3],
    14: [15.7, 22.2],
    15: [16.3, 23.1],
    16: [16.7, 23.9],
    17: [17.1, 24.6],
    18: [18.5, 25.0],
  },
};

// ── Waist Circumference Max (Zona Saudável ceiling by age + sex) ─────────────

const WAIST_TABLE: Record<Sex, Record<AgeKey, number>> = {
  F: {
    9: 66.8,
    10: 68.9,
    11: 70.8,
    12: 72.5,
    13: 74.2,
    14: 75.7,
    15: 76.8,
    16: 77.7,
    17: 78.5,
    18: 79.2,
  },
  M: {
    9: 77.1,
    10: 80.1,
    11: 82.6,
    12: 85.1,
    13: 87.0,
    14: 88.9,
    15: 90.5,
    16: 91.8,
    17: 92.7,
    18: 93.4,
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export type ZoneResult = "Zona Saudável" | "Zona de Melhoria";

export function getAgeKey(age: number | null | undefined): AgeKey | null {
  if (!age) return null;
  if (age >= 18) return 18;
  if (age < 9) return null;
  return age as AgeKey;
}

export function calcAgeFromBirthDate(birthDate: Date | string | null): number | null {
  if (!birthDate) return null;
  const birth = typeof birthDate === "string" ? new Date(birthDate + "T00:00:00") : birthDate;
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ── BMI Classification ───────────────────────────────────────────────────────


export function classifyBmi(
  imc: number,
  sex: Sex,
  age: number
): { zone: ZoneResult; min: number; max: number } | null {
  const ageKey = getAgeKey(age);
  if (!ageKey || !BMI_TABLE[sex]?.[ageKey]) return null;
  const [min, max] = BMI_TABLE[sex][ageKey];
  const zone: ZoneResult = imc >= min && imc <= max ? "Zona Saudável" : "Zona de Melhoria";
  return { zone, min, max };
}

// ── Waist Classification ─────────────────────────────────────────────────────

export function classifyWaist(
  waistCm: number,
  sex: Sex,
  age: number
): { zone: ZoneResult; maxWaist: number } | null {
  const ageKey = getAgeKey(age);
  if (!ageKey || !WAIST_TABLE[sex]?.[ageKey]) return null;
  const maxWaist = WAIST_TABLE[sex][ageKey];
  const zone: ZoneResult = waistCm <= maxWaist ? "Zona Saudável" : "Zona de Melhoria";
  return { zone, maxWaist };
}

// ── Export tables for reference/protocols page ───────────────────────────────


export type { AgeKey };
