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

vi.mock("@/hooks/use-reduced-effects", () => ({
  useReducedEffects: () => true,
}));

const messages = {
  dashboard: {
    title: "Painel",
    unlinkedTitle: "Perfil não associado",
    unlinkedDescription: "Conta ainda não associada a um perfil de aluno.",
    activitySummary: "Resumo da tua atividade",
    platformOverview: "Visão institucional",
    teacherOverview: "Visão da turma",
    psychologistOverview: "Visão clínica",
    parentOverview: "Visão familiar",
    dashboardStatus: "Painel",
    students: "Alunos",
    classes: "Turmas",
    sessions: "Sessões",
    pendingSos: "SOS Pendentes",
    totalRegistered: "Total registados",
    activeClasses: "Turmas ativas",
    evaluationsDone: "Sessões registadas",
    alertsPending: "SOS em aberto",
    lastBiometric: "Última biometria",
    lastTests: "Últimos testes",
    lastQuestionnaire: "Último questionário",
    lastReport: "Último relatório",
    linkedStudents: "Alunos associados",
    linkedStudentsDesc: "Alunos associados",
    reportsAvailable: "Relatórios",
    reportsAvailableDesc: "Relatórios disponíveis",
    questionnairesAvailable: "Questionários",
    familyQuestionnairesDesc: "Questionários submetidos",
    studentsInFollowUp: "Alunos em acompanhamento",
    studentsInFollowUpDesc: "Alunos com sinais recentes",
    questionnaireQueue: "Submissões para leitura",
    classPending: "Turma por confirmar",
    noPendingCasesTitle: "Sem casos pendentes",
    noPendingCasesDescription: "A fila SOS está limpa neste momento.",
    noLinkedStudentsDashboardTitle: "Sem alunos associados",
    noLinkedStudentsDashboardDescription:
      "Quando a escola concluir a associação, os dados surgem aqui.",
    noReportsDashboardTitle: "Sem relatórios recentes",
    noReportsDashboardDescription:
      "Os relatórios disponibilizados pela escola aparecem nesta área.",
    studentRecord: "Registo do aluno",
    generatedOn: "Gerado em {date}",
    studentsUnit: "alunos",
    coverageLabel: "Cobertura registada",
    studentsWithBiometrics: "Com biometria",
    zsaf: "Z. Saudável",
    zmf: "Z. Melhoria",
    dataQualityTitle: "Cobertura e qualidade",
    dataQualityDescription: "Lacunas do ano atual.",
    zafTitle: "Zona saudável e evolução",
    zafDescription: "Distribuição ZAF.",
    commandCenter: "Comando",
    commandCenterTitle: "Prioridades institucionais",
    commandCenterDescription: "O que precisa de revisão.",
    teacherDesk: "Aula e registos",
    teacherDeskTitle: "Fila de trabalho da turma",
    teacherDeskDescription: "Registos pendentes.",
    clinicalDesk: "Acompanhamento",
    clinicalDeskTitle: "Fila de intervenção",
    clinicalDeskDescription: "Casos SOS por resolver.",
    familyDesk: "Família",
    familyDeskTitle: "Acompanhamento por aluno",
    familyDeskDescription: "Últimos sinais partilhados.",
    studentDesk: "Percurso",
    studentDeskTitle: "O teu estado atual",
    studentDeskDescription: "Datas e atalhos principais.",
    quickActions: "Ações rápidas",
    quickActionsDescription: "Atalhos diretos.",
    recentReportsTitle: "Relatórios recentes",
    recentReportsDescription: "Últimos documentos.",
    recentQuestionnairesTitle: "Instrumentos recentes",
    recentQuestionnairesDescription: "Submissões recentes.",
    activeStudentSos: "SOS ativo",
    noStudentSignal: "Sem sinal ativo",
    actionProfileTitle: "Perfil",
    actionProfileDesc: "Preferências e conta",
  },
  nav: {
    perfil: "Perfil",
  },
  questionarios: {
    autoconceito: "Autoconceito",
    autoestima: "Autoestima",
    kidmed: "KIDMED",
  },
};

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
  it("renders the unlinked student state", () => {
    const summary: DashboardSummary = {
      variant: "student",
      studentSummary: null,
      cards: [],
      quickActions: [{ id: "profile", titleKey: "actionProfileTitle", descriptionKey: "actionProfileDesc", href: "/perfil", icon: "users", tone: "secondary" }],
      workItems: [],
      zafByYear: null,
    };

    renderDashboard(summary, "João");

    expect(screen.getByRole("heading", { name: /João/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Perfil não associado" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Perfil" })).toBeInTheDocument();
  });

  it("renders the linked student workspace", () => {
    const summary: DashboardSummary = {
      variant: "student",
      studentSummary: {
        name: "Maria Silva",
        className: "7A",
        schoolYear: "2025/2026",
        lastBiometric: "2026-03-20T00:00:00.000Z",
        lastTest: "2026-03-18T00:00:00.000Z",
        lastQuestionnaire: "2026-03-21T00:00:00.000Z",
        lastReportAt: "2026-03-22T00:00:00.000Z",
        openSos: 0,
        activeExemptions: 0,
      },
      cards: [],
      quickActions: [],
      workItems: [],
      zafByYear: null,
    };

    renderDashboard(summary, "Maria Silva");

    expect(screen.getAllByRole("heading", { name: /Maria/i }).length).toBeGreaterThan(0);
    expect(screen.getByText("O teu estado atual")).toBeInTheDocument();
    expect(screen.getByText("Última biometria")).toBeInTheDocument();
    expect(screen.getByText("Últimos testes")).toBeInTheDocument();
  });

  it("renders the psychologist workspace", () => {
    const summary: DashboardSummary = {
      variant: "psychologist",
      studentSummary: null,
      zafByYear: [],
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
      quickActions: [],
      workItems: [],
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

    renderDashboard(summary, "Psicóloga");

    expect(screen.getByText("Fila de intervenção")).toBeInTheDocument();
    expect(screen.getAllByText("Instrumentos recentes").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Rita/i })).toBeInTheDocument();
  });

  it("renders the parent workspace", () => {
    const summary: DashboardSummary = {
      variant: "parent",
      studentSummary: null,
      zafByYear: [],
      cards: [
        {
          id: "linked-students",
          titleKey: "linkedStudents",
          descriptionKey: "linkedStudentsDesc",
          value: 1,
          icon: "users",
          accent: "blue",
        },
      ],
      quickActions: [],
      workItems: [],
      linkedStudents: [
        {
          id: "student-1",
          name: "Miguel",
          className: "7B",
          schoolYear: "2025/2026",
          lastReportAt: "2026-03-12T00:00:00.000Z",
          lastQuestionnaireAt: "2026-03-14T00:00:00.000Z",
          lastBiometricAt: "2026-03-10T00:00:00.000Z",
        },
      ],
      recentReports: [
        {
          id: "report-1",
          title: "Relatório de março",
          studentName: "Miguel",
          createdAt: "2026-03-15T00:00:00.000Z",
        },
      ],
    };

    renderDashboard(summary, "Encarregado");

    expect(screen.getByText("Acompanhamento por aluno")).toBeInTheDocument();
    expect(screen.getAllByText("Relatórios recentes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Miguel").length).toBeGreaterThan(0);
    expect(screen.getByText("Relatório de março")).toBeInTheDocument();
  });

  it("renders the admin command center", () => {
    const summary: DashboardSummary = {
      variant: "admin",
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
      ],
      quickActions: [],
      workItems: [],
      quality: [
        {
          id: "missing-biometrics",
          titleKey: "missingBiometrics",
          descriptionKey: "missingBiometricsDesc",
          value: 8,
          icon: "activity",
          accent: "gold",
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
      ],
    };

    renderDashboard(summary, "Direção");

    expect(screen.getByText("Prioridades institucionais")).toBeInTheDocument();
    expect(screen.getAllByText("Cobertura e qualidade").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Zona saudável e evolução").length).toBeGreaterThan(0);
    expect(screen.getByText("340")).toBeInTheDocument();
  });
});
