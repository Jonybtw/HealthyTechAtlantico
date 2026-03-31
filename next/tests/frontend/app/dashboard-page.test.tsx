import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardClient } from "@/app/(app)/dashboard/dashboard-client";
import type { DashboardSummary } from "@/lib/dashboard";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "pt-PT",
  useTranslations:
    (namespace?: string) =>
    (key: string, values?: Record<string, string | number>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const dictionary: Record<string, string> = {
        "dashboard.title": "Painel",
        "dashboard.unlinkedTitle": "Perfil nÃ£o associado",
        "dashboard.unlinkedDescription":
          "Conta ainda nÃ£o associada a um perfil de aluno.",
        "dashboard.activitySummary": "Resumo da tua atividade",
        "dashboard.lastBiometric": "Ãšltima biometria",
        "dashboard.lastTests": "Ãšltimos testes",
        "dashboard.lastMeasurement": "Data da Ãºltima mediÃ§Ã£o",
        "dashboard.lastTestDate": "Data do Ãºltimo teste fÃ­sico",
        "dashboard.platformOverview":
          "VisÃ£o geral da plataforma HealthyTech AtlÃ¢ntico",
        "dashboard.psychologistOverview":
          "VisÃ£o geral da fila de acompanhamento dos alunos",
        "dashboard.parentOverview":
          "VisÃ£o geral dos alunos associados Ã  tua conta",
        "dashboard.students": "Alunos",
        "dashboard.classes": "Turmas",
        "dashboard.sessions": "SessÃµes",
        "dashboard.pendingSos": "SOS Pendentes",
        "dashboard.totalRegistered": "Total registados",
        "dashboard.activeClasses": "Turmas ativas",
        "dashboard.evaluationsDone": "AvaliaÃ§Ãµes realizadas",
        "dashboard.alertsPending": "Alertas por resolver",
        "dashboard.zafDistribution": "DistribuiÃ§Ã£o ZAF por Ano Letivo",
        "dashboard.zafDistributionSummary":
          "Comparativo recente entre Zona SaudÃ¡vel e Zona de Melhoria.",
        "dashboard.zsaf": "Z. SaudÃ¡vel",
        "dashboard.zmf": "Z. Melhoria",
        "dashboard.psychologistQueueTitle":
          "Fila prioritÃ¡ria de acompanhamento",
        "dashboard.psychologistQueueDescription":
          "Casos pendentes que devem ser revistos primeiro pelo psicÃ³logo.",
        "dashboard.psychologistRecentTitle": "QuestionÃ¡rios recentes",
        "dashboard.psychologistRecentDescription":
          "Ãšltimos instrumentos submetidos.",
        "dashboard.classPending": "Turma por confirmar",
        "dashboard.alertOpenedOn": "Aberto em {date}",
        "dashboard.openStudentFollowUp": "Abrir acompanhamento",
        "dashboard.parentStudentsTitle": "Acompanhamento dos alunos",
        "dashboard.parentStudentsDescription":
          "VisÃ£o rÃ¡pida do estado recente dos alunos associados Ã  tua conta.",
        "dashboard.parentReportsTitle": "RelatÃ³rios recentes",
        "dashboard.parentReportsDescription":
          "Ãšltimos relatÃ³rios gerados para consulta familiar.",
        "dashboard.studentRecord": "Registo do aluno",
        "dashboard.lastReport": "Ãšltimo relatÃ³rio",
        "dashboard.lastQuestionnaire": "Ãšltimo questionÃ¡rio",
        "dashboard.linkedStudents": "Alunos associados",
        "dashboard.historyGeneratedOn": "Gerado em {date}",
        "dashboard.studentsUnit": "alunos",
        "dashboard.greetingMorning": "Bom dia",
        "dashboard.greetingAfternoon": "Boa tarde",
        "dashboard.greetingEvening": "Boa noite",
        "nav.perfil": "Perfil",
        "questionarios.autoconceito": "Autoconceito",
        "questionarios.autoestima": "Autoestima",
        "questionarios.kidmed": "KIDMED",
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

vi.mock("recharts", () => {
  const Wrapper = ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  );

  return {
    PieChart: Wrapper,
    Pie: Wrapper,
    Cell: Wrapper,
    Tooltip: () => null,
  };
});

vi.mock("@/hooks/use-reduced-effects", () => ({
  useReducedEffects: () => true,
}));

describe("DashboardClient", () => {
  it("renders the unlinked student state with the unified header", () => {
    const summary: DashboardSummary = {
      variant: "student",
      studentSummary: null,
      cards: [],
      zafByYear: null,
    };

    render(<DashboardClient username="JoÃ£o" summary={summary} />);

    expect(
      screen.getByRole("heading", { name: /JoÃ£o/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Perfil nÃ£o associado" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Perfil" })).toBeInTheDocument();
  });

  it("renders the linked student summary cards", () => {
    const summary: DashboardSummary = {
      variant: "student",
      studentSummary: {
        name: "Maria Silva",
        lastBiometric: "2026-03-20T00:00:00.000Z",
        lastTest: "2026-03-18T00:00:00.000Z",
      },
      cards: [],
      zafByYear: null,
    };

    render(<DashboardClient username="Maria Silva" summary={summary} />);

    expect(
      screen.getByRole("heading", { name: /Maria/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ãšltima biometria")).toBeInTheDocument();
    expect(screen.getByText("Ãšltimos testes")).toBeInTheDocument();
  });

  it("renders the psychologist dashboard sections", () => {
    const summary: DashboardSummary = {
      variant: "psychologist",
      studentSummary: null,
      zafByYear: null,
      cards: [
        {
          id: "open-sos",
          titleKey: "pendingSos",
          descriptionKey: "alertsPending",
          value: 2,
          icon: "alert",
          accent: "red",
        },
      ],
      openAlerts: [
        {
          id: "alert-1",
          studentId: "student-1",
          studentName: "Rita",
          className: "8A",
          createdAt: "2026-03-22T00:00:00.000Z",
        },
      ],
      recentQuestionnaires: [
        {
          id: "q-1",
          studentId: "student-1",
          studentName: "Rita",
          type: "AUTOCONCEITO",
          submittedAt: "2026-03-21T00:00:00.000Z",
        },
      ],
    };

    render(<DashboardClient username="PsicÃ³loga" summary={summary} />);

    expect(
      screen.getByText("Fila prioritÃ¡ria de acompanhamento"),
    ).toBeInTheDocument();
    expect(screen.getByText("QuestionÃ¡rios recentes")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Abrir acompanhamento/i }),
    ).toBeInTheDocument();
  });

  it("renders the parent dashboard sections", () => {
    const summary: DashboardSummary = {
      variant: "parent",
      studentSummary: null,
      zafByYear: null,
      cards: [
        {
          id: "linked-students",
          titleKey: "linkedStudents",
          descriptionKey: "linkedStudents",
          value: 1,
          icon: "users",
          accent: "blue",
        },
      ],
      linkedStudents: [
        {
          id: "student-1",
          name: "Miguel",
          className: "7B",
          schoolYear: "2025/2026",
          lastReportAt: "2026-03-12T00:00:00.000Z",
          lastQuestionnaireAt: "2026-03-14T00:00:00.000Z",
        },
      ],
      recentReports: [
        {
          id: "report-1",
          title: "RelatÃ³rio de marÃ§o",
          studentName: "Miguel",
          createdAt: "2026-03-15T00:00:00.000Z",
        },
      ],
    };

    render(<DashboardClient username="Encarregado" summary={summary} />);

    expect(
      screen.getByText("Acompanhamento dos alunos"),
    ).toBeInTheDocument();
    expect(screen.getByText("RelatÃ³rios recentes")).toBeInTheDocument();
    expect(screen.getAllByText("Miguel").length).toBeGreaterThan(0);
    expect(screen.getByText("RelatÃ³rio de marÃ§o")).toBeInTheDocument();
  });

  it("renders the staff dashboard analytics area", () => {
    const summary: DashboardSummary = {
      variant: "staff",
      studentSummary: null,
      cards: [
        {
          id: "students",
          titleKey: "students",
          descriptionKey: "totalRegistered",
          value: 340,
          icon: "users",
          accent: "blue",
        },
        {
          id: "classes",
          titleKey: "classes",
          descriptionKey: "activeClasses",
          value: 16,
          icon: "school",
          accent: "green",
        },
      ],
      zafByYear: [
        {
          year: "2025/2026",
          total: 200,
          withBio: 160,
          zsaf: 104,
          zmf: 56,
        },
        {
          year: "2024/2025",
          total: 180,
          withBio: 150,
          zsaf: 90,
          zmf: 60,
        },
      ],
    };

    render(<DashboardClient username="DireÃ§Ã£o" summary={summary} />);

    expect(
      screen.getAllByText("DistribuiÃ§Ã£o ZAF por Ano Letivo").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("2025/2026")).toBeInTheDocument();
    expect(screen.getByText("340")).toBeInTheDocument();
  });
});
