// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  authMock,
  auditLogMock,
  getStudentAccessContextMock,
  questionnaireCreateMock,
  questionnaireFindFirstMock,
  questionnaireFindManyMock,
  studentFindUniqueMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  auditLogMock: vi.fn(),
  getStudentAccessContextMock: vi.fn(),
  questionnaireCreateMock: vi.fn(),
  questionnaireFindFirstMock: vi.fn(),
  questionnaireFindManyMock: vi.fn(),
  studentFindUniqueMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/audit", () => ({
  auditLog: auditLogMock,
}));

vi.mock("@/lib/student-access", () => ({
  getStudentAccessContext: getStudentAccessContextMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    questionnaire: {
      create: questionnaireCreateMock,
      findFirst: questionnaireFindFirstMock,
      findMany: questionnaireFindManyMock,
    },
    student: {
      findUnique: studentFindUniqueMock,
    },
  },
}));

import { GET, POST } from "@/app/api/students/[id]/questionnaires/route";

describe("student questionnaires route", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T10:00:00.000Z"));

    authMock.mockReset();
    auditLogMock.mockReset();
    getStudentAccessContextMock.mockReset();
    questionnaireCreateMock.mockReset();
    questionnaireFindFirstMock.mockReset();
    questionnaireFindManyMock.mockReset();
    studentFindUniqueMock.mockReset();

    auditLogMock.mockResolvedValue(undefined);
    authMock.mockResolvedValue({
      user: { id: "student-user", role: "ALUNO" },
    });
    getStudentAccessContextMock.mockResolvedValue({
      ok: true,
      student: {
        id: "student-1",
        linkedUserId: "student-user",
        guardians: [],
      },
      isOwner: true,
      isGuardian: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("filters questionnaire history by type and limit", async () => {
    questionnaireFindManyMock.mockResolvedValue([]);

    const response = await GET(
      new NextRequest("http://localhost/api/students/student-1/questionnaires?type=KIDMED&limit=1"),
      { params: Promise.resolve({ id: "student-1" }) },
    );

    expect(response.status).toBe(200);
    expect(questionnaireFindManyMock).toHaveBeenCalledWith({
      where: {
        studentId: "student-1",
        type: "KIDMED",
      },
      orderBy: { submittedAt: "desc" },
      take: 1,
    });
    await expect(response.json()).resolves.toEqual({ data: [] });
  });

  it("blocks KIDMED submission when parental consent is missing", async () => {
    studentFindUniqueMock.mockResolvedValue({
      id: "student-1",
      kidmedConsentAt: null,
    });

    const response = await POST(
      new NextRequest("http://localhost/api/students/student-1/questionnaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "KIDMED",
          payload: {
            fruitDaily: true,
            secondFruitDaily: false,
            vegetablesDaily: true,
            vegetablesMoreThanOnceDaily: false,
            fishRegularly: true,
            fastFoodWeekly: false,
            pulsesMoreThanOnceWeekly: true,
            wholeGrainPastaOrRice: false,
            wholeGrainsBreakfast: true,
            nutsRegularly: false,
            oliveOilAtHome: true,
            skipsBreakfast: false,
            dairyBreakfast: true,
            pastriesBreakfast: false,
            yogurtOrCheeseDaily: true,
            sweetsSeveralTimesDaily: false,
          },
        }),
      }),
      { params: Promise.resolve({ id: "student-1" }) },
    );

    expect(response.status).toBe(403);
    expect(questionnaireCreateMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: "Consentimento parental obrigatorio para o KIDMED",
    });
  });

  it("creates a scored KIDMED questionnaire for the current school period", async () => {
    studentFindUniqueMock.mockResolvedValue({
      id: "student-1",
      kidmedConsentAt: new Date("2026-03-01T09:00:00.000Z"),
    });
    questionnaireFindFirstMock.mockResolvedValue(null);
    questionnaireCreateMock.mockImplementation(async ({ data }) => ({
      id: "questionnaire-1",
      ...data,
      submittedAt: new Date("2026-03-24T10:00:00.000Z").toISOString(),
    }));

    const response = await POST(
      new NextRequest("http://localhost/api/students/student-1/questionnaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "KIDMED",
          payload: {
            fruitDaily: true,
            secondFruitDaily: false,
            vegetablesDaily: true,
            vegetablesMoreThanOnceDaily: false,
            fishRegularly: true,
            fastFoodWeekly: false,
            pulsesMoreThanOnceWeekly: true,
            wholeGrainPastaOrRice: false,
            wholeGrainsBreakfast: true,
            nutsRegularly: false,
            oliveOilAtHome: true,
            skipsBreakfast: false,
            dairyBreakfast: true,
            pastriesBreakfast: false,
            yogurtOrCheeseDaily: false,
            sweetsSeveralTimesDaily: false,
          },
        }),
      }),
      { params: Promise.resolve({ id: "student-1" }) },
    );

    expect(response.status).toBe(201);
    expect(questionnaireCreateMock).toHaveBeenCalledWith({
      data: {
        studentId: "student-1",
        type: "KIDMED",
        instrumentVersion: "KIDMED_2019",
        schoolYear: "2025/2026",
        periodKey: "2025/2026:P2",
        score: 7,
        classification: "AVERAGE",
        payload: {
          fruitDaily: true,
          secondFruitDaily: false,
          vegetablesDaily: true,
          vegetablesMoreThanOnceDaily: false,
          fishRegularly: true,
          fastFoodWeekly: false,
          pulsesMoreThanOnceWeekly: true,
          wholeGrainPastaOrRice: false,
          wholeGrainsBreakfast: true,
          nutsRegularly: false,
          oliveOilAtHome: true,
          skipsBreakfast: false,
          dairyBreakfast: true,
          pastriesBreakfast: false,
          yogurtOrCheeseDaily: false,
          sweetsSeveralTimesDaily: false,
        },
        deferredCount: 0,
      },
    });
    expect(auditLogMock).toHaveBeenCalledWith({
      userId: "student-user",
      action: "submit_questionnaire",
      targetId: "student-1",
    });

    await expect(response.json()).resolves.toEqual({
      data: expect.objectContaining({
        id: "questionnaire-1",
        type: "KIDMED",
        schoolYear: "2025/2026",
        periodKey: "2025/2026:P2",
        score: 7,
        classification: "AVERAGE",
      }),
    });
  });

  it("rejects duplicate KIDMED submissions in the same school period", async () => {
    studentFindUniqueMock.mockResolvedValue({
      id: "student-1",
      kidmedConsentAt: new Date("2026-03-01T09:00:00.000Z"),
    });
    questionnaireFindFirstMock.mockResolvedValue({ id: "questionnaire-existing" });

    const response = await POST(
      new NextRequest("http://localhost/api/students/student-1/questionnaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "KIDMED",
          payload: {
            fruitDaily: true,
            secondFruitDaily: false,
            vegetablesDaily: true,
            vegetablesMoreThanOnceDaily: false,
            fishRegularly: true,
            fastFoodWeekly: false,
            pulsesMoreThanOnceWeekly: true,
            wholeGrainPastaOrRice: false,
            wholeGrainsBreakfast: true,
            nutsRegularly: false,
            oliveOilAtHome: true,
            skipsBreakfast: false,
            dairyBreakfast: true,
            pastriesBreakfast: false,
            yogurtOrCheeseDaily: false,
            sweetsSeveralTimesDaily: false,
          },
        }),
      }),
      { params: Promise.resolve({ id: "student-1" }) },
    );

    expect(response.status).toBe(409);
    expect(questionnaireCreateMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: "O KIDMED ja foi submetido neste periodo letivo",
    });
  });

  it("returns validation errors for incomplete KIDMED payloads", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/students/student-1/questionnaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "KIDMED",
          payload: {
            fruitDaily: true,
          },
        }),
      }),
      { params: Promise.resolve({ id: "student-1" }) },
    );

    expect(response.status).toBe(400);
    expect(studentFindUniqueMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: "Dados inválidos",
      }),
    );
  });
});
