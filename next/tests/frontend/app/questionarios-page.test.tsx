import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QuestionariosPage from "@/app/(app)/questionarios/questionarios-client";
import { getSchoolPeriodInfo } from "@/lib/questionnaires";

vi.mock("next-intl", () => ({
  useLocale: () => "pt",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/user-context", () => ({
  useUser: () => ({
    id: "student-user",
    email: "student@example.com",
    role: "ALUNO",
  }),
}));

function createJsonResponse(data: unknown) {
  return {
    ok: true,
    json: async () => ({ data }),
  } as Response;
}

describe("QuestionariosPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("guides the student through the flow and reaches the review action bar", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation((input) => {
      const url = String(input);

      if (url.endsWith("/api/students?limit=500")) {
        return Promise.resolve(
          createJsonResponse({
            students: [
              {
                id: "student-1",
                name: "Maria",
                className: "6A",
                schoolYear: "2025/2026",
                birthDate: "2014-05-10T00:00:00.000Z",
                kidmedConsentAt: null,
              },
            ],
          }),
        );
      }

      if (url.includes("/api/students/student-1/questionnaires?type=AUTOCONCEITO")) {
        return Promise.resolve(
          createJsonResponse([
            {
              id: "routine-1",
              type: "AUTOCONCEITO",
              payload: {
                sleepHours: 8,
                screenHours: 2,
                waterGlasses: 6,
                mealsCount: 4,
                energyLevel: 7,
                stressLevel: 3,
                wellnessLevel: 7,
              },
              deferredCount: 1,
              submittedAt: "2026-03-24T10:00:00.000Z",
              instrumentVersion: null,
              schoolYear: null,
              periodKey: null,
              score: null,
              classification: null,
            },
          ]),
        );
      }

      throw new Error(`Unexpected fetch url: ${url}`);
    });

    const user = userEvent.setup();
    render(<QuestionariosPage />);

    await waitFor(() => {
      expect(screen.getByText("step1Title")).toBeInTheDocument();
    });

    expect(screen.queryByText("Maria")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continueToQuestions/i }));

    await waitFor(() => {
      expect(screen.getByText("routineHabitsTitle")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /continueToWellbeing/i }));

    await waitFor(() => {
      expect(screen.getByText("wellbeingPerceptionTitle")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /continueToReview/i }));

    await waitFor(() => {
      expect(screen.getByText("step3Title")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /defer/i })).toBeInTheDocument();
    expect(screen.getByText("historySectionDescription")).toBeInTheDocument();
  });

  it("keeps KIDMED gated on step 1 when parental consent is missing", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation((input) => {
      const url = String(input);

      if (url.endsWith("/api/students?limit=500")) {
        return Promise.resolve(
          createJsonResponse({
            students: [
              {
                id: "student-1",
                name: "Maria",
                className: "6A",
                schoolYear: "2025/2026",
                birthDate: "2018-05-10T00:00:00.000Z",
                kidmedConsentAt: null,
              },
            ],
          }),
        );
      }

      if (url.includes("/api/students/student-1/questionnaires?type=AUTOCONCEITO")) {
        return Promise.resolve(createJsonResponse([]));
      }

      if (url.includes("/api/students/student-1/questionnaires?type=KIDMED")) {
        return Promise.resolve(createJsonResponse([]));
      }

      throw new Error(`Unexpected fetch url: ${url}`);
    });

    const user = userEvent.setup();
    render(<QuestionariosPage />);

    await waitFor(() => {
      expect(screen.getByRole("radio", { name: /kidmed/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("radio", { name: /kidmed/i }));

    await waitFor(() => {
      expect(screen.getByText("kidmedConsentMissingTitle")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /continueToQuestions/i })).toBeDisabled();
    expect(screen.queryByText("step2KidmedTitle")).not.toBeInTheDocument();
  });

  it("shows the locked KIDMED result on the review gate for the current period", async () => {
    const fetchMock = vi.mocked(fetch);
    const currentPeriod = getSchoolPeriodInfo();

    fetchMock.mockImplementation((input) => {
      const url = String(input);

      if (url.endsWith("/api/students?limit=500")) {
        return Promise.resolve(
          createJsonResponse({
            students: [
              {
                id: "student-1",
                name: "Miguel",
                className: "9B",
                schoolYear: currentPeriod.schoolYear,
                birthDate: "2010-01-10T00:00:00.000Z",
                kidmedConsentAt: "2026-03-01T09:00:00.000Z",
              },
            ],
          }),
        );
      }

      if (url.includes("/api/students/student-1/questionnaires?type=AUTOCONCEITO")) {
        return Promise.resolve(createJsonResponse([]));
      }

      if (url.includes("/api/students/student-1/questionnaires?type=KIDMED")) {
        return Promise.resolve(
          createJsonResponse([
            {
              id: "kidmed-1",
              type: "KIDMED",
              payload: {},
              deferredCount: 0,
              submittedAt: "2026-03-24T10:00:00.000Z",
              instrumentVersion: "KIDMED_2019",
              schoolYear: currentPeriod.schoolYear,
              periodKey: currentPeriod.periodKey,
              score: 7,
              classification: "AVERAGE",
            },
          ]),
        );
      }

      throw new Error(`Unexpected fetch url: ${url}`);
    });

    const user = userEvent.setup();
    render(<QuestionariosPage />);

    await waitFor(() => {
      expect(screen.getByRole("radio", { name: /kidmed/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("radio", { name: /kidmed/i }));

    await waitFor(() => {
      expect(screen.getByText("kidmedCurrentPeriodLocked")).toBeInTheDocument();
    });

    expect(screen.getByText("7/12")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continueToQuestions/i })).toBeDisabled();
  });

  it("keeps yes and no answers accessible as large choice cards in AUTOESTIMA", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation((input) => {
      const url = String(input);

      if (url.endsWith("/api/students?limit=500")) {
        return Promise.resolve(
          createJsonResponse({
            students: [
              {
                id: "student-1",
                name: "Maria",
                className: "6A",
                schoolYear: "2025/2026",
                birthDate: "2014-05-10T00:00:00.000Z",
                kidmedConsentAt: null,
              },
            ],
          }),
        );
      }

      if (url.includes("/api/students/student-1/questionnaires?type=AUTOCONCEITO")) {
        return Promise.resolve(createJsonResponse([]));
      }

      if (url.includes("/api/students/student-1/questionnaires?type=AUTOESTIMA")) {
        return Promise.resolve(createJsonResponse([]));
      }

      throw new Error(`Unexpected fetch url: ${url}`);
    });

    const user = userEvent.setup();
    render(<QuestionariosPage />);

    await waitFor(() => {
      expect(screen.getByRole("radio", { name: /autoestima/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("radio", { name: /autoestima/i }));
    await user.click(screen.getByRole("button", { name: /continueToQuestions/i }));

    await waitFor(() => {
      expect(screen.getByText("baselineProfileTitle")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /sportsPracticeLabel - yes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sportsPracticeLabel - no/i })).toBeInTheDocument();
  });
});
