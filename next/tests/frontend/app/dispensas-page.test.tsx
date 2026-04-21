import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DispensasClient from "@/app/(app)/dispensas/dispensas-client";

const refetchStudents = vi.fn();
const refetchDispensas = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => "pt-PT",
  useTranslations:
    (namespace?: string) =>
    (key: string, values?: Record<string, string | number>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const dictionary: Record<string, string> = {
        "common.refresh": "Atualizar",
        "exemptions.title": "Dispensas",
        "exemptions.description": "Gerir dispensas por aluno",
        "exemptions.studentPickerLabel": "Aluno",
        "exemptions.studentContextTitle": "Contexto do aluno",
        "exemptions.studentContextEmpty":
          "Escolhe um aluno para consultar ou registar dispensas.",
        "exemptions.studentContextSummary":
          "{active} ativas e {expired} expiradas",
        "exemptions.historyTitle": "Histórico de dispensas",
        "exemptions.noExemptionsTitle": "Sem dispensas",
        "exemptions.noExemptions": "Sem dispensas registadas.",
        "exemptions.newBtn": "Nova dispensa",
        "exemptions.cancelBtn": "Cancelar",
        "exemptions.createBtn": "Criar dispensa",
        "exemptions.formTitle": "Nova dispensa",
        "exemptions.formDescription":
          "Regista o motivo e o intervalo da dispensa.",
        "exemptions.reason": "Motivo",
        "exemptions.reasonPlaceholder": "Atestado médico",
        "exemptions.startDateShort": "Início",
        "exemptions.endDateShort": "Fim",
        "exemptions.activeCountLabel": "ativas",
        "exemptions.expiredCountLabel": "expiradas",
        "exemptions.activeBadge": "Ativa",
        "exemptions.expiredBadge": "Expirada",
        "exemptions.createdAtLabel": "Criada em",
        "exemptions.deleteBtn": "Eliminar dispensa",
        "exemptions.deleteTitle": "Eliminar dispensa",
        "exemptions.deleteDesc":
          "Tens a certeza de que queres eliminar esta dispensa?",
      };

      let value = dictionary[fullKey] ?? key;

      if (values) {
        for (const [token, replacement] of Object.entries(values)) {
          value = value.replaceAll(`{${token}}`, String(replacement));
        }
      }

      return value;
    },
}));

vi.mock("@/components/user-context", () => ({
  useUser: () => ({
    id: "teacher-1",
    email: "teacher@example.com",
    role: "PROFESSOR",
  }),
}));

vi.mock("@/hooks/use-queries", () => ({
  useStudents: () => ({
    data: [
      {
        id: "student-1",
        name: "Maria Silva",
        className: "8A",
      },
    ],
    isLoading: false,
    isError: false,
    refetch: refetchStudents,
  }),
  useDispensas: () => ({
    data: [
      {
        id: "dispensa-1",
        reason: "Atestado médico",
        startDate: "2026-03-01T00:00:00.000Z",
        endDate: "2026-03-31T00:00:00.000Z",
        createdAt: "2026-03-01T00:00:00.000Z",
      },
    ],
    isLoading: false,
    isError: false,
    refetch: refetchDispensas,
  }),
  useCreateDispensa: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteDispensa: () => ({
    mutateAsync: vi.fn(),
  }),
}));

describe("DispensasClient", () => {
  beforeEach(() => {
    refetchStudents.mockReset();
    refetchDispensas.mockReset();
  });

  it("renders the canonical dispensa workspace with the selected student history", async () => {
    render(<DispensasClient />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Dispensas" }),
      ).toBeInTheDocument();
    });

    expect(screen.getAllByText("Maria Silva").length).toBeGreaterThan(0);
    expect(screen.getByText("Atestado médico")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nova dispensa" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Atualizar" }),
    ).toBeInTheDocument();
  });
});
