import { describe, expect, it } from "vitest";
import {
  classifyKidmedScore,
  computeKidmedScore,
  evaluateKidmed,
  getSchoolPeriodInfo,
  type KidmedAnswers,
} from "@/lib/questionnaires";

function createAnswers(overrides: Partial<KidmedAnswers> = {}): KidmedAnswers {
  return {
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
    ...overrides,
  };
}

describe("KIDMED scoring", () => {
  it("returns the maximum score when all positive items are true and negatives are false", () => {
    const answers = createAnswers({
      fruitDaily: true,
      secondFruitDaily: true,
      vegetablesDaily: true,
      vegetablesMoreThanOnceDaily: true,
      fishRegularly: true,
      pulsesMoreThanOnceWeekly: true,
      wholeGrainPastaOrRice: true,
      wholeGrainsBreakfast: true,
      nutsRegularly: true,
      oliveOilAtHome: true,
      dairyBreakfast: true,
      yogurtOrCheeseDaily: true,
    });

    expect(computeKidmedScore(answers)).toBe(12);
    expect(evaluateKidmed(answers)).toEqual({
      score: 12,
      classification: "OPTIMAL",
    });
  });

  it("clamps the score at zero when only negative items are true", () => {
    const answers = createAnswers({
      fastFoodWeekly: true,
      skipsBreakfast: true,
      pastriesBreakfast: true,
      sweetsSeveralTimesDaily: true,
    });

    expect(computeKidmedScore(answers)).toBe(0);
    expect(evaluateKidmed(answers)).toEqual({
      score: 0,
      classification: "VERY_LOW",
    });
  });

  it("classifies the threshold boundaries correctly", () => {
    expect(classifyKidmedScore(3)).toBe("VERY_LOW");
    expect(classifyKidmedScore(4)).toBe("AVERAGE");
    expect(classifyKidmedScore(7)).toBe("AVERAGE");
    expect(classifyKidmedScore(8)).toBe("OPTIMAL");
  });
});

describe("school periods", () => {
  it("maps March into P2 of the current academic year", () => {
    expect(getSchoolPeriodInfo(new Date("2026-03-24T10:00:00.000Z"))).toMatchObject({
      schoolYear: "2025/2026",
      period: "P2",
      periodKey: "2025/2026:P2",
    });
  });

  it("maps October into P1 of the starting academic year", () => {
    expect(getSchoolPeriodInfo(new Date("2026-10-10T10:00:00.000Z"))).toMatchObject({
      schoolYear: "2026/2027",
      period: "P1",
      periodKey: "2026/2027:P1",
    });
  });

  it("maps July into P3 and reopens in September", () => {
    const period = getSchoolPeriodInfo(new Date("2026-07-01T10:00:00.000Z"));

    expect(period).toMatchObject({
      schoolYear: "2025/2026",
      period: "P3",
      periodKey: "2025/2026:P3",
    });
    expect(period.nextPeriodStartsAt.getFullYear()).toBe(2026);
    expect(period.nextPeriodStartsAt.getMonth()).toBe(8);
    expect(period.nextPeriodStartsAt.getDate()).toBe(1);
  });
});
