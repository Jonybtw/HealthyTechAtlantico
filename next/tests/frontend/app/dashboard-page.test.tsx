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

const messages = {
  dashboard: {
    title: "Painel",
    unlinkedTitle: "Perfil n\u00e3o associado",
    unlinkedDescription: "Conta ainda n\u00e3o associada a um perfil de aluno.",
    activitySummary: "Resumo da tua atividade",
    lastBiometric: "\u00daltima biometria",
    lastTests: "\u00daltimos testes",
    lastMeasurement: "Data da \u00faltima medi\u00e7\u00e3o",
    lastTestDate: "Data do \u00faltimo teste f\u00edsico",
    platformOverview: "Vis\u00e3o geral da plataforma HealthyTech Atl\u00e2ntico",
    psychologistOverview:
      "Vis\u00e3o geral da fila de acompanhamento dos alunos",
    parentOverview: "Vis\u00e3o geral dos alunos associados \u00e0 tua conta",
    students: "Alunos",
    classes: "Turmas",
    sessions: "Sess\u00f5es",
    pendingSos: "SOS Pendentes",
    totalRegistered: "Total registados",
    activeClasses: "Turmas ativas",
    evaluationsDone: "Avalia\u00e7\u00f5es realizadas",
    alertsPending: "Alertas por resolver",
    zafDistribution: "Distribui\u00e7\u00e3o ZAF por Ano Letivo",
    zafDistributionSummary:
      "Comparativo recente entre Zona Saud\u00e1vel e Zona de Melhoria.",
    zsaf: "Z. Saud\u00e1vel",
    zmf: "Z. Melhoria",
    psychologistQueueTitle: "Fila priorit\u00e1ria de acompanhamento",
    psychologistQueueDescription:
      "Casos pendentes que devem ser revistos primeiro pelo psic\u00f3logo.",
    psychologistRecentTitle: "Question\u00e1rios recentes",
    psychologistRecentDescription: "\u00daltimos instrumentos submetidos.",
    classPending: "Turma por confirmar",
    alertOpenedOn: "Aberto em {date}",
    openStudentFollowUp: "Abrir acompanhamento",
    noPendingCasesTitle: "Sem casos pendentes",
    noPendingCasesDescription: "A fila SOS est\u00e1 limpa neste momento.",
    noRecentQuestionnairesTitle: "Sem question\u00e1rios recentes",
    noRecentQuestionnairesDescription:
      "Quando houver novas submiss\u00f5es, aparecem aqui para leitura r\u00e1pida.",
    parentStudentsTitle: "Acompanhamento dos alunos",
    parentStudentsDescription:
      "Vis\u00e3o r\u00e1pida do estado recente dos alunos associados \u00e0 tua conta.",
    parentReportsTitle: "Relat\u00f3rios recentes",
    parentReportsDescription:
      "\u00daltimos relat\u00f3rios gerados para consulta familiar.",
    studentRecord: "Registo do aluno",
    lastReport: "\u00daltimo relat\u00f3rio",
    lastQuestionnaire: "\u00daltimo question\u00e1rio",
    linkedStudents: "Alunos associados",
    historyGeneratedOn: "Gerado em {date}",
    noLinkedStudentsDashboardTitle: "Sem alunos associados",
    noLinkedStudentsDashboardDescription:
      "Quando a escola concluir a associa\u00e7\u00e3o, os dados surgem aqui.",
    noReportsDashboardTitle: "Sem relat\u00f3rios recentes",
    noReportsDashboardDescription:
      "Os relat\u00f3rios disponibilizados pela escola aparecem nesta \u00e1rea.",
    studentsUnit: "alunos",
    overviewEyebrow: "Resumo operacional",
    overviewTitle: "Panorama da atividade",
    overviewDescription:
      "Leitura r\u00e1pida dos n\u00fameros-chave da plataforma e dos sinais que pedem aten\u00e7\u00e3o no dia a dia.",
    dashboardStatus: "Vis\u00e3o institucional",
    yearInFocus: "Ano em foco",
    coverageRecent: "Cobertura biom\u00e9trica do ano letivo mais recente.",
    studentsWithBiometrics: "Com biometria",
    coverageLabel: "Cobertura registada",
    healthyStudentsLabel: "Em Z. Saud\u00e1vel",
    improvementStudentsLabel: "Em Z. Melhoria",
    annualSeries: "S\u00e9rie anual",
    annualSeriesDescription:
      "Compara\u00e7\u00e3o do peso da Zona Saud\u00e1vel em cada ano letivo com registos.",
    comparisonPanelTitle: "Evolu\u00e7\u00e3o por ano letivo",
    comparisonPanelDescription:
      "Percentagem de Zona Saud\u00e1vel entre os alunos com biometria registada.",
    annualSeriesPendingTitle:
      "Ainda n\u00e3o existe s\u00e9rie hist\u00f3rica compar\u00e1vel.",
    annualSeriesPendingDescription:
      "A evolu\u00e7\u00e3o anual aparece quando houver mais do que um ano letivo com biometria registada.",
  },
  nav: {
    perfil: "Perfil",
  },
  questionarios: {
    autoconceito: "Autoconceito",
    autoestima: "Autoestima",
    kidmed: "KIDMED",
  },
} as const;

function renderDashboard(summary: DashboardSummary, username: string) {
  return render(
    <DashboardClient
      greeting="Bom dia"
      todayLabel="quarta-feira, 1 de abril de 2026"
      username={username}
      summary={summary}
      messages={messages}
    />,
  );
}

describe("DashboardClient", () => {
  it("renders the unlinked student state with the unified header", () => {
    const summary: DashboardSummary = {
      variant: "student",
      studentSummary: null,
      cards: [],
      zafByYear: null,
    };

    renderDashboard(summary, "Jo\u00e3o");

    expect(screen.getByRole("heading", { name: /Jo\u00e3o/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Perfil n\u00e3o associado" }),
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

    renderDashboard(summary, "Maria Silva");

    expect(screen.getByRole("heading", { name: /Maria/i })).toBeInTheDocument();
    expect(screen.getByText("\u00daltima biometria")).toBeInTheDocument();
    expect(screen.getByText("\u00daltimos testes")).toBeInTheDocument();
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

    renderDashboard(summary, "Psic\u00f3loga");

    expect(
      screen.getByText("Fila priorit\u00e1ria de acompanhamento"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Question\u00e1rios recentes").length).toBeGreaterThan(
      0,
    );
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
          title: "Relat\u00f3rio de mar\u00e7o",
          studentName: "Miguel",
          createdAt: "2026-03-15T00:00:00.000Z",
        },
      ],
    };

    renderDashboard(summary, "Encarregado");

    expect(screen.getByText("Acompanhamento dos alunos")).toBeInTheDocument();
    expect(screen.getAllByText("Relat\u00f3rios recentes").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Miguel").length).toBeGreaterThan(0);
    expect(screen.getByText("Relat\u00f3rio de mar\u00e7o")).toBeInTheDocument();
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

    renderDashboard(summary, "Dire\u00e7\u00e3o");

    expect(
      screen.getAllByText("Distribui\u00e7\u00e3o ZAF por Ano Letivo").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("2025/2026").length).toBeGreaterThan(0);
    expect(screen.getByText("340")).toBeInTheDocument();
  });
});
