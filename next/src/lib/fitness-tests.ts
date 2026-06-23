import type { Sex } from "@prisma/client";
import type { AgeKey, ZoneResult } from "@/lib/zaf";
import { getAgeKey } from "@/lib/zaf";

// ── Test Metadata ────────────────────────────────────────────────────────────

interface TestOption {
  id: string;
  label: string;
  unit: string;
  better: "high" | "low";
  category: string;
}

export const TEST_OPTIONS: TestOption[] = [
  {
    id: "vai",
    label: "Vai e Vem",
    unit: "percursos",
    better: "high",
    category: "Capacidade Aeróbia",
  },
  {
    id: "cooper",
    label: "Cooper",
    unit: "voltas",
    better: "high",
    category: "Capacidade Aeróbia",
  },
  {
    id: "milha",
    label: "Milha 1609m",
    unit: "mm:ss",
    better: "low",
    category: "Capacidade Aeróbia",
  },
  {
    id: "velocidade",
    label: "Velocidade 40m",
    unit: "s",
    better: "low",
    category: "Velocidade e Agilidade",
  },
  {
    id: "agilidade",
    label: "Agilidade 4×10m",
    unit: "s",
    better: "low",
    category: "Velocidade e Agilidade",
  },
  {
    id: "abd",
    label: "Abdominais",
    unit: "reps",
    better: "high",
    category: "Força Muscular",
  },
  {
    id: "bracos",
    label: "Extensões de braços",
    unit: "reps",
    better: "high",
    category: "Força Muscular",
  },
  {
    id: "senta",
    label: "Senta e alcança",
    unit: "cm",
    better: "high",
    category: "Flexibilidade",
  },
];

// ── Time Helpers ─────────────────────────────────────────────────────────────

function toSeconds(value: string | number): number | null {
  if (typeof value === "number") return isNaN(value) ? null : value;
  const parts = value.split(":");
  if (parts.length === 2) {
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    if (isNaN(minutes) || isNaN(seconds)) return null;
    return minutes * 60 + seconds;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
}

// ── Fitness Test Zone Table ──────────────────────────────────────────────────
// Each entry: [threshold, ceiling]
// For "high" tests: value >= threshold[0] → Zona Saudável
// For "low" tests: toSeconds(value) <= toSeconds(threshold[0]) → Zona Saudável

type TestThresholds = Record<string, [number | string, number | string]>;

const TEST_TABLE: Record<Sex, Record<AgeKey, TestThresholds>> = {
  F: {
    9: {
      vai: [17, 35],
      cooper: [11, 21],
      velocidade: [8.3, 7.2],
      milha: ["13:30", "9:00"],
      agilidade: [14.37, 12.15],
      abd: [3, 30],
      bracos: [1, 12],
      senta: [23.0, 31.4],
    },
    10: {
      vai: [17, 35],
      cooper: [11, 21],
      velocidade: [8.3, 7.2],
      milha: ["13:30", "9:00"],
      agilidade: [14.37, 12.15],
      abd: [3, 30],
      bracos: [1, 12],
      senta: [23.0, 31.4],
    },
    11: {
      vai: [17, 35],
      cooper: [11, 21],
      velocidade: [8.3, 7.2],
      milha: ["13:30", "9:00"],
      agilidade: [14.37, 12.15],
      abd: [3, 30],
      bracos: [1, 12],
      senta: [23.0, 31.4],
    },
    12: {
      vai: [22, 41],
      cooper: [13, 23],
      velocidade: [8.0, 7.1],
      milha: ["13:00", "8:30"],
      agilidade: [14.05, 12.0],
      abd: [4, 40],
      bracos: [2, 12],
      senta: [23.0, 33.3],
    },
    13: {
      vai: [22, 41],
      cooper: [13, 23],
      velocidade: [8.0, 7.1],
      milha: ["13:00", "8:30"],
      agilidade: [14.05, 12.0],
      abd: [4, 40],
      bracos: [2, 12],
      senta: [23.0, 33.3],
    },
    14: {
      vai: [27, 44],
      cooper: [15, 25],
      velocidade: [7.9, 6.4],
      milha: ["12:30", "8:00"],
      agilidade: [13.84, 11.83],
      abd: [5, 45],
      bracos: [2, 13],
      senta: [28.0, 35.3],
    },
    15: {
      vai: [27, 44],
      cooper: [15, 25],
      velocidade: [7.9, 6.4],
      milha: ["12:30", "8:00"],
      agilidade: [13.84, 11.83],
      abd: [5, 45],
      bracos: [2, 13],
      senta: [28.0, 35.3],
    },
    16: {
      vai: [27, 55],
      cooper: [13, 29],
      velocidade: [8.6, 6.4],
      milha: ["12:00", "7:30"],
      agilidade: [14.2, 11.2],
      abd: [3, 65],
      bracos: [1, 19],
      senta: [25.5, 36.0],
    },
    17: {
      vai: [27, 55],
      cooper: [13, 29],
      velocidade: [8.6, 6.4],
      milha: ["12:00", "7:30"],
      agilidade: [14.2, 11.2],
      abd: [3, 65],
      bracos: [1, 19],
      senta: [25.5, 36.0],
    },
    18: {
      vai: [27, 55],
      cooper: [13, 29],
      velocidade: [8.6, 6.4],
      milha: ["12:00", "7:30"],
      agilidade: [14.2, 11.2],
      abd: [3, 65],
      bracos: [1, 19],
      senta: [25.5, 36.0],
    },
  },
  M: {
    9: {
      vai: [17, 47],
      cooper: [13, 18],
      velocidade: [7.9, 7.1],
      milha: ["13:00", "8:20"],
      agilidade: [13.55, 12.03],
      abd: [5, 34],
      bracos: [3, 16],
      senta: [20.3, 28.9],
    },
    10: {
      vai: [28, 59],
      cooper: [15, 19],
      velocidade: [7.3, 6.6],
      milha: ["12:00", "8:00"],
      agilidade: [12.92, 11.47],
      abd: [6, 46],
      bracos: [6, 17],
      senta: [20.3, 29.2],
    },
    11: {
      vai: [42, 76],
      cooper: [17, 21],
      velocidade: [6.9, 6.1],
      milha: ["11:00", "7:00"],
      agilidade: [12.43, 10.96],
      abd: [8, 55],
      bracos: [8, 20],
      senta: [20.3, 31.9],
    },
    12: {
      vai: [47, 82],
      cooper: [18, 22],
      velocidade: [6.7, 5.9],
      milha: ["10:30", "6:30"],
      agilidade: [11.5, 10.25],
      abd: [10, 55],
      bracos: [10, 27],
      senta: [18.5, 33.0],
    },
    13: {
      vai: [47, 82],
      cooper: [19, 23],
      velocidade: [6.5, 5.7],
      milha: ["10:00", "6:15"],
      agilidade: [11.2, 10.0],
      abd: [12, 55],
      bracos: [12, 27],
      senta: [18.5, 33.0],
    },
    14: {
      vai: [47, 82],
      cooper: [20, 24],
      velocidade: [6.4, 5.6],
      milha: ["9:30", "6:00"],
      agilidade: [11.0, 9.8],
      abd: [14, 55],
      bracos: [14, 30],
      senta: [16.5, 33.0],
    },
    15: {
      vai: [47, 82],
      cooper: [20, 25],
      velocidade: [6.3, 5.5],
      milha: ["9:00", "5:45"],
      agilidade: [10.9, 9.7],
      abd: [16, 55],
      bracos: [16, 35],
      senta: [16.5, 33.0],
    },
    16: {
      vai: [47, 82],
      cooper: [21, 25],
      velocidade: [6.2, 5.4],
      milha: ["9:00", "5:30"],
      agilidade: [10.8, 9.6],
      abd: [18, 55],
      bracos: [18, 35],
      senta: [15.0, 33.0],
    },
    17: {
      vai: [47, 82],
      cooper: [21, 25],
      velocidade: [6.1, 5.4],
      milha: ["8:30", "5:30"],
      agilidade: [10.7, 9.5],
      abd: [18, 55],
      bracos: [18, 35],
      senta: [15.0, 33.0],
    },
    18: {
      vai: [47, 82],
      cooper: [21, 25],
      velocidade: [6.0, 5.3],
      milha: ["8:30", "5:15"],
      agilidade: [10.6, 9.4],
      abd: [18, 55],
      bracos: [18, 35],
      senta: [14.0, 33.0],
    },
  },
};

// ── Classification ───────────────────────────────────────────────────────────

const TEST_OPTIONS_MAP = new Map(TEST_OPTIONS.map((t) => [t.id, t]));

export function classifyTest(
  testId: string,
  value: string | number,
  sex: Sex,
  age: number,
): ZoneResult | null {
  const ageKey = getAgeKey(age);
  if (!ageKey) return null;

  const testData = TEST_TABLE[sex]?.[ageKey]?.[testId];
  if (!testData) return null;

  const testOpt = TEST_OPTIONS_MAP.get(testId);
  if (!testOpt) return null;

  if (testOpt.better === "high") {
    return Number(value) >= Number(testData[0])
      ? "Zona Saudável"
      : "Zona de Melhoria";
  } else {
    const v = toSeconds(value);
    const maxSec = toSeconds(testData[0]);
    if (v === null || maxSec === null) return null;
    return v <= maxSec ? "Zona Saudável" : "Zona de Melhoria";
  }
}

// ── Export table for protocols page ──────────────────────────────────────────
