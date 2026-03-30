import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TurmaPage from "@/app/(app)/turma/turma-client";

const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations:
    (namespace?: string) =>
    (key: string) =>
      (
        {
          "turma.title": "Turma",
          "turma.description": "Vista geral da turma com dados agregados",
          "turma.colName": "Nome",
          "turma.colSex": "Sexo",
          "turma.colBmi": "IMC",
          "turma.colZone": "Zona",
          "turma.colTests": "Testes",
          "turma.className": "Turma",
          "turma.healthyZone": "Zona Saudavel",
          "turma.improvementZone": "Zona de Melhoria",
          "turma.noDataLabel": "Sem dados",
          "turma.noStudents": "Nenhum aluno nesta turma.",
          "turma.noClassSelected": "Nenhuma turma selecionada",
          "turma.noClassSelectedDesc": "Selecione uma turma para ver os dados.",
          "turma.studentsUnit": "alunos",
          "common.importCsv": "Importar CSV",
          "common.exportCsv": "Exportar CSV",
        } as Record<string, string>
      )[`${namespace}.${key}`] ?? key,
}));

vi.mock("@/components/user-context", () => ({
  useUser: () => ({
    id: "admin-1",
    email: "admin@example.com",
    role: "ADMIN",
  }),
}));

vi.mock("@/hooks/use-queries", () => ({
  useClasses: () => ({
    data: [
      {
        id: "class-1",
        name: "8A",
        academicYearLabel: "2025/2026",
      },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

function createJsonResponse(data: unknown) {
  return {
    ok: true,
    json: async () => ({ data }),
  } as Response;
}

describe("TurmaPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createJsonResponse([
          {
            id: "student-1",
            name: "Maria Silva",
            sex: "F",
            className: "8A",
            latestBiometric: {
              imc: 21.4,
              imcZone: "ZSAF - Zona Saudavel",
            },
            testCount: 4,
          },
        ]),
      ),
    );
    routerPush.mockReset();
  });

  it("loads the selected class summary and routes row clicks to student detail", async () => {
    const user = userEvent.setup();

    render(<TurmaPage />);

    await user.click(screen.getByRole("button", { name: "Turma" }));
    await user.click(screen.getByRole("button", { name: "8A" }));

    await waitFor(() => {
      expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    });

    expect(screen.getByText("21.4")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    await user.click(screen.getByText("Maria Silva"));

    expect(routerPush).toHaveBeenCalledWith("/alunos/student-1");
  });
});
