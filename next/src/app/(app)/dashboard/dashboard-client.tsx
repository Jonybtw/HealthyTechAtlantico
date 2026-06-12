"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gauge,
  HeartPulse,
  Link2,
  Ruler,
  School,
  ShieldCheck,
  Upload,
  Users,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { StaffDashboardContent } from "./_components/staff-dashboard";
import { StudentDashboardContent } from "./_components/student-dashboard";
import type {
  DashboardActionData,
  DashboardCardData,
  DashboardSummary,
  DashboardWorkItem,
  ZafYearStat,
} from "@/lib/dashboard";
import { getQuestionnaireTypeLabelKey } from "@/lib/questionnaires";
import { cn } from "@/lib/utils";

interface Props {
  greeting: string;
  locale?: string;
  messages?: {
    dashboard: Record<string, string>;
    nav: Record<string, string>;
    questionarios: Record<string, string>;
  };
  username: string;
  summary: DashboardSummary;
  todayLabel: string;
}

const FALLBACK_MESSAGES: {
  dashboard: Record<string, string>;
  nav: Record<string, string>;
  questionarios: Record<string, string>;
} = {
  dashboard: {
    totalStudentsTitle: "Total Students",
    totalStudentsFooter: "+12 this month",
    biometricsLoggedTitle: "Biometrics Logged",
    biometricsLoggedFooter: "This academic year",
    activeAlertsTitle: "Active Alerts",
    activeAlertsFooter: "1 Critical priority",
    pendingAssessmentsTitle: "Pending Assessments",
    pendingAssessmentsFooter: "5 overdue",
    title: "Painel",
    dashboardStatus: "Painel",
    overview: "Vista geral",
    welcomeBackOverview:
      "Bem-vindo de volta, {name}. Aqui tens a tua visao geral de hoje.",
    platformOverview:
      "Centro de comando institucional para cobertura, segurança e qualidade dos dados.",
    teacherOverview:
      "Espaço de trabalho para registos de turma, dispensas e sinais SOS.",
    psychologistOverview:
      "Triagem de acompanhamento, instrumentos recentes e casos sinalizados.",
    parentOverview: "Resumo familiar dos alunos associados e relatórios partilhados.",
    activitySummary: "Últimos registos, próximos passos e atalhos do teu percurso.",
    unlinkedTitle: "Perfil não associado",
    unlinkedDescription:
      "A tua conta ainda não está associada a um perfil de aluno. Contacta a escola para concluírem a ligação.",
    students: "Alunos",
    classes: "Turmas",
    sessions: "Sessões",
    pendingSos: "SOS pendentes",
    totalRegistered: "Total registados",
    activeClasses: "Turmas ativas",
    evaluationsDone: "Sessões registadas",
    alertsPending: "SOS em aberto",
    questionnairesAvailable: "Questionários",
    questionnaireQueue: "Submissões para leitura",
    studentsInFollowUp: "Em acompanhamento",
    studentsInFollowUpDesc: "Alunos com sinais recentes",
    linkedStudents: "Alunos associados",
    linkedStudentsDesc: "Alunos ligados à tua conta",
    reportsAvailable: "Relatórios",
    reportsAvailableDesc: "Documentos disponíveis",
    familyQuestionnairesDesc: "Questionários submetidos",
    teacherStudentsDesc: "Alunos no ano letivo atual",
    teacherSessionsDesc: "Sessões que registaste",
    activeExemptions: "Dispensas ativas",
    activeExemptionsDesc: "Dispensas em vigor",
    teacherSosDesc: "Alertas encaminhados para ti",
    missingBiometrics: "Biometrias em falta",
    missingBiometricsDesc: "Alunos sem medição no ano atual",
    missingTests: "Testes em falta",
    missingTestsDesc: "Alunos sem prova física no ano atual",
    missingQuestionnaires: "Questionários em falta",
    missingQuestionnairesDesc: "Alunos sem submissão no ano atual",
    unlinkedStudents: "Alunos sem conta",
    unlinkedStudentsDesc: "Perfis ainda sem utilizador associado",
    guardianLinks: "Ligações familiares",
    guardianLinksDesc: "Associações aluno-encarregado",
    auditLast7Days: "Auditoria recente",
    auditLast7DaysDesc: "Eventos registados nos últimos 7 dias",
    reportsLast30Days: "Relatórios recentes",
    reportsLast30DaysDesc: "Relatórios gerados nos últimos 30 dias",
    commandCenter: "Comando",
    commandCenterTitle: "Prioridades institucionais",
    commandCenterDescription:
      "O que precisa de decisão, revisão ou encaminhamento neste momento.",
    teacherDesk: "Aula e registos",
    teacherDeskTitle: "Fila de trabalho da turma",
    teacherDeskDescription:
      "Alunos e registos que ajudam a fechar a cobertura do período.",
    clinicalDesk: "Acompanhamento",
    clinicalDeskTitle: "Fila de intervenção",
    clinicalDeskDescription: "Casos SOS por resolver, ordenados pelos mais antigos.",
    familyDesk: "Família",
    familyDeskTitle: "Acompanhamento por aluno",
    familyDeskDescription: "Leitura simples dos últimos sinais partilhados pela escola.",
    studentDesk: "Percurso",
    studentDeskTitle: "O teu estado atual",
    studentDeskDescription: "Datas e atalhos principais para continuares o teu registo.",
    quickActions: "Ações rápidas",
    quickActionsDescription: "Atalhos diretos para as tarefas mais prováveis.",
    recentActivity: "Atividade recente",
    viewAll: "Ver tudo",
    systemStatus: "Estado do sistema",
    allSystemsOperational: "Todos os sistemas operacionais",
    draftsSyncing: "{count} rascunhos a sincronizar",
    lastSync: "Última sincronização",
    allCaughtUp: "Tudo em dia",
    bmiFitnessTrends: "Tendências de IMC e condição física",
    currentAcademicYear: "Ano letivo atual",
    avgBmi: "IMC médio",
    fitnessScore: "Score físico",
    zafDistributionTitle: "Distribuição ZAF",
    coverageAverageLabel: "Média da turma",
    dataQualityTitle: "Cobertura e qualidade",
    dataQualityDescription: "Lacunas do ano letivo atual que merecem seguimento.",
    zafTitle: "Zona saudável e evolução",
    zafDescription: "Cobertura biométrica e distribuição ZAF nos anos recentes.",
    recentReportsTitle: "Relatórios recentes",
    recentReportsDescription: "Últimos documentos disponibilizados pela escola.",
    recentQuestionnairesTitle: "Instrumentos recentes",
    recentQuestionnairesDescription: "Submissões mais recentes para leitura clínica.",
    noPendingCasesTitle: "Sem casos pendentes",
    noPendingCasesDescription: "A fila SOS está limpa neste momento.",
    noRecentQuestionnairesTitle: "Sem questionários recentes",
    noRecentQuestionnairesDescription:
      "As novas submissões aparecem aqui quando forem recebidas.",
    noLinkedStudentsDashboardTitle: "Sem alunos associados",
    noLinkedStudentsDashboardDescription:
      "Quando a escola concluir a associação, os dados surgem aqui.",
    noReportsDashboardTitle: "Sem relatórios recentes",
    noReportsDashboardDescription:
      "Os relatórios disponibilizados pela escola aparecem nesta área.",
    classPending: "Turma por confirmar",
    alertOpenedOn: "Aberto em {date}",
    generatedOn: "Gerado em {date}",
    studentRecord: "Registo do aluno",
    lastBiometric: "Última biometria",
    lastTests: "Últimos testes",
    lastQuestionnaire: "Último questionário",
    lastReport: "Último relatório",
    activeStudentSos: "SOS ativo",
    activeStudentExemption: "Dispensa ativa",
    noStudentSignal: "Sem sinal ativo",
    lastMeasurement: "Data da última medição",
    lastTestDate: "Data do último teste físico",
    studentQuestionnairesDesc: "Instrumentos já submetidos",
    needsBiometrics: "Registar biometria",
    needsTests: "Registar testes",
    reviewItem: "Rever",
    openItem: "Abrir",
    latestAcademicYear: "Último ano letivo",
    coverageLabel: "Cobertura registada",
    studentsWithBiometrics: "Com biometria",
    healthyStudentsLabel: "Em Z. Saudável",
    improvementStudentsLabel: "Em Z. Melhoria",
    zsaf: "Z. Saudável",
    zmf: "Z. Melhoria",
    noBioData: "Sem dados biométricos",
    annualSeriesPendingTitle: "Ainda não existe série histórica comparável.",
    annualSeriesPendingDescription:
      "A evolução anual aparece quando houver mais do que um ano letivo com biometria registada.",
    studentsUnit: "alunos",
    actionSosTitle: "SOS",
    actionSosDesc: "Rever alertas ativos",
    actionStudentsTitle: "Alunos",
    actionStudentsDesc: "Gerir perfis e ligações",
    actionClassTitle: "Turma",
    actionClassDesc: "Ver trabalho da turma",
    actionBiometricsTitle: "Biometria",
    actionBiometricsDesc: "Registar medições",
    actionTestsTitle: "Testes",
    actionTestsDesc: "Registar provas",
    actionReportsTitle: "Relatórios",
    actionReportsDesc: "Consultar ou gerar documentos",
    actionQuestionnairesTitle: "Questionários",
    actionQuestionnairesDesc: "Responder instrumentos",
    actionProtocolsTitle: "Protocolos",
    actionProtocolsDesc: "Consultar orientações",
    actionAdminTitle: "Admin",
    actionAdminDesc: "Gerir utilizadores",
    actionAuditTitle: "Auditoria",
    actionAuditDesc: "Rever atividade",
    actionProfileTitle: "Perfil",
    actionProfileDesc: "Preferências e conta",
    actionLogBiometricsTitle: "Registar biometria",
    actionLogBiometricsDesc: "Registar dados do aluno",
    actionRaiseSosTitle: "Abrir SOS",
    actionRaiseSosDesc: "Alerta de emergência",
    actionNewAssessmentTitle: "Nova avaliação",
    actionNewAssessmentDesc: "Atribuir questionário",
    actionGenerateReportTitle: "Gerar relatório",
    actionGenerateReportDesc: "Exportar relatório PDF",
    actionEnrollStudentTitle: "Inscrever aluno",
    actionEnrollStudentDesc: "Adicionar novo aluno",
    actionBulkImportTitle: "Importação em lote",
    actionBulkImportDesc: "Upload CSV",
    studentHealthProgress: "My Health Progress",
    studentGrowthSubtitle: "Tracking your growth over time",
    student6Months: "6 Months",
    student1Year: "1 Year",
    studentWeightLabel: "Weight (kg)",
    studentHeightLabel: "Height (cm)",
    studentPendingTasks: "Pending Tasks",
    studentNoPendingTasks: "No pending tasks",
    studentNoPendingDesc: "All questionnaires for this school year have been submitted.",
    studentStart: "Start",
    studentDueSoon: "Due Soon",
    studentPending: "Pending",
    studentYourPosition: "Your Position",
    studentComparedWHO: "Position relative to the healthy zone",
    studentPercentile: "Percentile",
    studentCurrentHealth: "Current Health Status",
    studentBMI: "BMI",
    studentHeight: "Height",
    studentWeight: "Weight",
    studentZScore: "Z-Score (BMI)",
    studentFitnessScore: "Fitness Score",
    studentNoBiometrics: "No biometric data recorded",
    studentNoBiometricsDesc: "Once your teacher records your measurements, data will appear here.",
    studentNoTests: "No tests recorded",
    studentLastUpdated: "Last updated",
    studentHealthy: "Healthy",
    studentAtRisk: "At Risk",
    studentNormal: "Normal",
    studentGood: "Good",
    studentSosActive: "Active SOS alert",
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

const ICONS: Record<DashboardCardData["icon"], LucideIcon> = {
  activity: Activity,
  alert: AlertTriangle,
  book: BookOpen,
  clipboard: ClipboardList,
  file: FileText,
  gauge: Gauge,
  school: School,
  shield: ShieldCheck,
  upload: Upload,
  users: Users,
  userPlus: UserPlus,
};

function formatMessage(
  template: string,
  values?: Record<string, string | number>,
) {
  if (!values) return template;

  let result = template;
  for (const [token, replacement] of Object.entries(values)) {
    result = result.replaceAll(`{${token}}`, String(replacement));
  }
  return result;
}

function formatCompactDate(value: string | null, locale: string) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
  });
}

function formatNumberValue(value: string | number, locale: string) {
  if (typeof value === "number") {
    return value.toLocaleString(locale === "en" ? "en-GB" : "pt-PT");
  }

  return value;
}

function getCoveragePct(year: Pick<ZafYearStat, "total" | "withBio"> | null) {
  if (!year || year.total <= 0) return 0;
  return Math.round((year.withBio / year.total) * 100);
}

function getHealthyPct(year: Pick<ZafYearStat, "withBio" | "zsaf"> | null) {
  if (!year || year.withBio <= 0) return 0;
  return Math.round((year.zsaf / year.withBio) * 100);
}

function getLatestYear(zafByYear: ZafYearStat[] | null) {
  if (!zafByYear) return null;
  return zafByYear.find((year) => year.withBio > 0) ?? zafByYear[0] ?? null;
}

function useDashboardText(messages: Props["messages"]) {
  const t = (key: string, values?: Record<string, string | number>) =>
    formatMessage(
      messages?.dashboard[key] ?? FALLBACK_MESSAGES.dashboard[key] ?? key,
      values,
    );
  const nav = (key: string, values?: Record<string, string | number>) =>
    formatMessage(
      messages?.nav[key] ?? FALLBACK_MESSAGES.nav[key] ?? key,
      values,
    );
  const questionnaires = (
    key: string,
    values?: Record<string, string | number>,
  ) =>
    formatMessage(
      messages?.questionarios[key] ??
        FALLBACK_MESSAGES.questionarios[key] ??
        key,
      values,
    );

  return { nav, questionnaires, t };
}

function getRoleCopy(summary: DashboardSummary) {
  if (summary.variant === "admin") return "platformOverview";
  if (summary.variant === "teacher") return "teacherOverview";
  if (summary.variant === "psychologist") return "psychologistOverview";
  if (summary.variant === "parent") return "parentOverview";
  return "activitySummary";
}

export function DashboardClient({
  greeting,
  locale = "pt-PT",
  messages = FALLBACK_MESSAGES,
  summary,
  todayLabel,
  username,
}: Props) {
  const { nav, questionnaires, t } = useDashboardText(messages);
  const titleName =
    summary.variant === "student" && summary.studentSummary
      ? summary.studentSummary.name.split(" ")[0]
      : username;

  return (
    <PageScaffold
      className="gap-6"
      header={
        summary.variant === "teacher" || summary.variant === "student" ? null : (
          <DashboardHero
            eyebrow={t("dashboardStatus")}
            title={`${greeting}, ${titleName}`}
            description={t(getRoleCopy(summary))}
            todayLabel={todayLabel}
          />
        )
      }
    >
      {summary.variant === "admin" ? (
        <AdminDashboard locale={locale} summary={summary} t={t} />
      ) : summary.variant === "teacher" ? (
        <TeacherDashboard
          greeting={greeting}
          locale={locale}
          summary={summary}
          t={t}
          username={titleName}
        />
      ) : summary.variant === "psychologist" ? (
        <PsychologistDashboard
          locale={locale}
          questionnaires={questionnaires}
          summary={summary}
          t={t}
        />
      ) : summary.variant === "parent" ? (
        <ParentDashboard locale={locale} summary={summary} t={t} />
      ) : (
        <StudentDashboard
          greeting={greeting}
          locale={locale}
          nav={nav}
          questionnaires={questionnaires}
          summary={summary}
          t={t}
        />
      )}
    </PageScaffold>
  );
}

function DashboardHero({
  description,
  eyebrow,
  title,
  todayLabel,
}: {
  description: string;
  eyebrow: string;
  title: string;
  todayLabel: string;
}) {
  return (
    <PageHeader
      eyebrow={eyebrow}
      title={title}
      description={description}
      icon={<HeartPulse className="size-6" />}
      meta={
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <CalendarDays className="size-3.5 text-gold-600 dark:text-gold-300" />
          {todayLabel}
        </span>
      }
    />
  );
}

function AdminDashboard({
  locale,
  summary,
  t,
}: {
  locale: string;
  summary: Extract<DashboardSummary, { variant: "admin" }>;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="grid gap-6">
      <MetricGrid cards={summary.cards} t={t} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <WorkQueue
          description={t("commandCenterDescription")}
          emptyIcon={CheckCircle2}
          emptyTitle={t("noPendingCasesTitle")}
          eyebrow={t("commandCenter")}
          items={summary.workItems}
          locale={locale}
          t={t}
          title={t("commandCenterTitle")}
        />
        <QuickActions actions={summary.quickActions} t={t} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <DataQuality cards={summary.quality} t={t} />
        <ZafPanel compact locale={locale} t={t} zafByYear={summary.zafByYear} />
      </div>
    </div>
  );
}

function TeacherDashboard({
  greeting,
  locale,
  summary,
  t,
  username,
}: {
  greeting: string;
  locale: string;
  summary: Extract<DashboardSummary, { variant: "teacher" }>;
  t: (key: string, values?: Record<string, string | number>) => string;
  username: string;
}) {
  return (
    <StaffDashboardContent
      greeting={greeting}
      locale={locale}
      summary={summary}
      t={t}
      username={username}
    />
  );
}

function PsychologistDashboard({
  locale,
  questionnaires,
  summary,
  t,
}: {
  locale: string;
  questionnaires: (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  summary: Extract<DashboardSummary, { variant: "psychologist" }>;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="grid gap-6">
      <MetricGrid cards={summary.cards} t={t} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <PageSection
          eyebrow={t("clinicalDesk")}
          title={t("clinicalDeskTitle")}
          description={t("clinicalDeskDescription")}
          tone="secondary"
          layout="list"
        >
          {summary.openAlerts.length > 0 ? (
            <div className="grid gap-3">
              {summary.openAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={`/acompanhamento/${alert.studentId}`}
                  className="group"
                >
                  <Card className="transition-all hover:-translate-y-0.5 hover:border-danger-400/45 hover:shadow-card-hover">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-danger-500/10 text-danger-600 dark:text-danger-400">
                        <AlertTriangle className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-base">
                          {alert.studentName}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {alert.className ?? t("classPending")}
                        </CardDescription>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge variant="danger" className="hidden sm:inline-flex">{t("pendingSos")}</Badge>
                        <span className="hidden text-xs text-muted-foreground lg:inline">
                          {formatCompactDate(alert.createdAt, locale)}
                        </span>
                        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title={t("noPendingCasesTitle")}
              description={t("noPendingCasesDescription")}
            />
          )}
        </PageSection>

        <QuickActions actions={summary.quickActions} t={t} />
      </div>

      <PageSection
        eyebrow={t("recentQuestionnairesTitle")}
        title={t("recentQuestionnairesTitle")}
        description={t("recentQuestionnairesDescription")}
        tone="secondary"
        layout="list"
      >
        {summary.recentQuestionnaires.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {summary.recentQuestionnaires.map((questionnaire) => (
              <Card key={questionnaire.id}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-gold-500/10 text-gold-700 dark:text-gold-300">
                    <ClipboardList className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base">
                      {questionnaire.studentName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {questionnaires(
                        getQuestionnaireTypeLabelKey(
                          questionnaire.type as
                            | "AUTOCONCEITO"
                            | "AUTOESTIMA"
                            | "KIDMED",
                        ),
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="gold" className="shrink-0">
                    {formatCompactDate(questionnaire.submittedAt, locale)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title={t("noRecentQuestionnairesTitle")}
            description={t("noRecentQuestionnairesDescription")}
          />
        )}
      </PageSection>
    </div>
  );
}

function ParentDashboard({
  locale,
  summary,
  t,
}: {
  locale: string;
  summary: Extract<DashboardSummary, { variant: "parent" }>;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="grid gap-6">
      <MetricGrid cards={summary.cards} t={t} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <PageSection
          eyebrow={t("familyDesk")}
          title={t("familyDeskTitle")}
          description={t("familyDeskDescription")}
          tone="secondary"
          layout="list"
        >
          {summary.linkedStudents.length > 0 ? (
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
              {summary.linkedStudents.map((student) => (
                <StudentFamilyCard
                  key={student.id}
                  locale={locale}
                  student={student}
                  t={t}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title={t("noLinkedStudentsDashboardTitle")}
              description={t("noLinkedStudentsDashboardDescription")}
            />
          )}
        </PageSection>

        <QuickActions actions={summary.quickActions} t={t} />
      </div>

      <RecentReports
        locale={locale}
        reports={summary.recentReports}
        t={t}
      />
    </div>
  );
}

function StudentDashboard({
  greeting,
  locale,
  nav,
  questionnaires,
  summary,
  t,
}: {
  greeting: string;
  locale: string;
  nav: (key: string, values?: Record<string, string | number>) => string;
  questionnaires: (key: string, values?: Record<string, string | number>) => string;
  summary: Extract<DashboardSummary, { variant: "student" }>;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const student = summary.studentSummary;

  if (!student) {
    return (
      <EmptyState
        icon={Link2}
        title={t("unlinkedTitle")}
        description={t("unlinkedDescription")}
        action={
          <Link
            href="/perfil"
            className={buttonVariants({ size: "sm", variant: "secondary" })}
          >
            {nav("perfil")}
          </Link>
        }
      />
    );
  }

  return (
    <StudentDashboardContent
      greeting={greeting}
      locale={locale}
      questionnaires={questionnaires}
      student={student}
      t={t}
    />
  );
}

function MetricGrid({
  cards,
  t,
}: {
  cards: DashboardCardData[];
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  if (cards.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <KpiCard
          key={card.id}
          accent={card.accent}
          footer={card.footer ?? t(card.descriptionKey)}
          icon={ICONS[card.icon]}
          title={t(card.titleKey)}
          value={card.value}
        />
      ))}
    </div>
  );
}

function QuickActions({
  actions = [],
  compact = false,
  t,
}: {
  actions: DashboardActionData[];
  compact?: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <PageSection
      eyebrow={t("quickActions")}
      title={t("quickActions")}
      description={compact ? undefined : t("quickActionsDescription")}
      tone="utility"
      layout="list"
    >
      <div className={cn("grid gap-3", compact && "sm:grid-cols-2 lg:grid-cols-1")}>
        {actions.map((action) => {
          const Icon = ICONS[action.icon];

          return (
            <Link key={action.id} href={action.href} className="group">
              <div className="flex items-center gap-3 rounded-[12px] border border-border/70 bg-background/65 p-3.5 transition-all hover:-translate-y-0.5 hover:border-gold-300/45 hover:shadow-card">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-[8px] border",
                    action.tone === "danger"
                      ? "border-danger-500/20 bg-danger-500/10 text-danger-600 dark:text-danger-300"
                      : action.tone === "gold"
                        ? "border-gold-500/20 bg-gold-500/10 text-gold-700 dark:text-gold-300"
                        : "border-border bg-surface-secondary text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {t(action.titleKey)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {t(action.descriptionKey)}
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </PageSection>
  );
}

function WorkQueue({
  description,
  emptyIcon,
  emptyTitle,
  eyebrow,
  items,
  locale: _locale,
  t,
  title,
}: {
  description: string;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  eyebrow: string;
  items: DashboardWorkItem[];
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
  title: string;
}) {
  return (
    <PageSection
      eyebrow={eyebrow}
      title={title}
      description={description}
      tone="secondary"
      layout="list"
    >
      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <WorkQueueItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={t("noPendingCasesDescription")}
        />
      )}
    </PageSection>
  );
}

function WorkQueueItem({
  item,
}: {
  item: DashboardWorkItem;
}) {
  return (
    <Link href={item.href} className="group">
      <Card className="transition-all hover:-translate-y-0.5 hover:border-gold-300/45 hover:shadow-card-hover">
        <CardContent className="flex items-center gap-4 p-5">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-[12px]",
              item.tone === "danger"
                ? "bg-danger-500/10 text-danger-600 dark:text-danger-400"
                : item.tone === "warning"
                  ? "bg-gold-500/10 text-gold-700 dark:text-gold-300"
                  : "bg-navy-500/10 text-navy-700 dark:text-navy-200",
            )}
          >
            {item.tone === "danger" ? (
              <AlertTriangle className="size-5" />
            ) : item.tone === "warning" ? (
              <Activity className="size-5" />
            ) : (
              <ClipboardList className="size-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="truncate text-base">{item.title}</CardTitle>
              <ToneBadge tone={item.tone} />
            </div>
            {item.meta ? (
              <CardDescription className="mt-1">{item.meta}</CardDescription>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ToneBadge({ tone }: { tone: DashboardWorkItem["tone"] }) {
  if (tone === "danger") return <Badge variant="danger">SOS</Badge>;
  if (tone === "warning") return <Badge variant="warning">Fila</Badge>;
  if (tone === "success") return <Badge variant="success">OK</Badge>;
  if (tone === "info") return <Badge variant="info">Info</Badge>;
  return <Badge variant="default">Estado</Badge>;
}

function DataQuality({
  cards,
  t,
}: {
  cards: DashboardCardData[];
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <PageSection
      eyebrow={t("dataQualityTitle")}
      title={t("dataQualityTitle")}
      description={t("dataQualityDescription")}
      tone="secondary"
      layout="default"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = ICONS[card.icon];

          return (
            <Card key={card.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-10 items-center justify-center rounded-[8px] border border-border bg-background/70 text-gold-700 dark:text-gold-300">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    {card.value}
                  </span>
                </div>
                <CardTitle className="mt-5 text-base">{t(card.titleKey)}</CardTitle>
                <CardDescription className="mt-1">
                  {t(card.descriptionKey)}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageSection>
  );
}

function ZafPanel({
  compact = false,
  locale,
  t,
  zafByYear,
}: {
  compact?: boolean;
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
  zafByYear: ZafYearStat[];
}) {
  const latestYear = getLatestYear(zafByYear);

  return (
    <PageSection
      eyebrow={t("zafTitle")}
      title={t("zafTitle")}
      description={t("zafDescription")}
      tone="secondary"
      layout="default"
    >
      {latestYear ? (
        <div className={cn("grid gap-4", !compact && "xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]")}>
          <Card className="overflow-hidden">
            <CardHeader>
              <CardDescription className="text-xs uppercase tracking-[0.16em]">
                {t("latestAcademicYear")}
              </CardDescription>
              <CardTitle className="text-2xl">{latestYear.year}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 pt-0">
              <div className="grid gap-3 sm:grid-cols-2">
                <MiniStat
                  icon={Users}
                  label={t("studentsWithBiometrics")}
                  value={`${formatNumberValue(latestYear.withBio, locale)} / ${formatNumberValue(latestYear.total, locale)}`}
                />
                <MiniStat
                  icon={Gauge}
                  label={t("coverageLabel")}
                  value={`${getCoveragePct(latestYear)}%`}
                />
              </div>
              <ZafStackedBar
                healthy={latestYear.zsaf}
                healthyLabel={t("zsaf")}
                improvement={latestYear.zmf}
                improvementLabel={t("zmf")}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs uppercase tracking-[0.16em]">
                {t("healthyZoneRate")}
              </CardDescription>
              <CardTitle className="text-lg">{t("comparisonPanelTitle")}</CardTitle>
              <CardDescription>{t("comparisonPanelDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 pt-0">
              {zafByYear
                .filter((year) => year.withBio > 0)
                .slice(0, 3)
                .map((year) => (
                  <YearRow key={year.year} locale={locale} t={t} year={year} />
                ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState
          icon={Activity}
          title={t("noBioData")}
          description={t("annualSeriesPendingDescription")}
        />
      )}
    </PageSection>
  );
}

function StudentFamilyCard({
  locale,
  student,
  t,
}: {
  locale: string;
  student: Extract<DashboardSummary, { variant: "parent" }>["linkedStudents"][number];
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="flex h-full min-w-0 flex-col p-5">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-navy-500/10 text-navy-700 dark:text-navy-200">
            <Users className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">{student.name}</CardTitle>
            <CardDescription className="mt-1 truncate">
              {[student.className, student.schoolYear].filter(Boolean).join(" - ") ||
                t("studentRecord")}
            </CardDescription>
          </div>
          <Badge variant="info" className="w-fit shrink-0">{t("linkedStudents")}</Badge>
        </div>
        <div className="mt-5 grid min-w-0 flex-1 gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,145px),1fr))]">
          <MiniStat
            icon={Ruler}
            label={t("lastBiometric")}
            value={formatCompactDate(student.lastBiometricAt, locale)}
          />
          <MiniStat
            icon={ClipboardList}
            label={t("lastQuestionnaire")}
            value={formatCompactDate(student.lastQuestionnaireAt, locale)}
          />
          <MiniStat
            icon={FileText}
            label={t("lastReport")}
            value={formatCompactDate(student.lastReportAt, locale)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function RecentReports({
  locale,
  reports,
  t,
}: {
  locale: string;
  reports: Extract<DashboardSummary, { variant: "parent" }>["recentReports"];
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <PageSection
      eyebrow={t("recentReportsTitle")}
      title={t("recentReportsTitle")}
      description={t("recentReportsDescription")}
      tone="secondary"
      layout="list"
    >
      {reports.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-navy-500/10 text-navy-700 dark:text-navy-200">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-base">{report.title}</CardTitle>
                  <CardDescription className="mt-1 truncate">
                    {report.studentName} · {formatCompactDate(report.createdAt, locale)}
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title={t("noReportsDashboardTitle")}
          description={t("noReportsDashboardDescription")}
        />
      )}
    </PageSection>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[12px] border border-border/70 bg-background/60 p-3">
      {Icon && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-navy-500/10 text-navy-700 dark:text-navy-300">
          <Icon className="size-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="break-words text-[10px] font-semibold uppercase leading-tight tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function YearRow({
  locale,
  t,
  year,
}: {
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
  year: ZafYearStat;
}) {
  const healthyPct = getHealthyPct(year);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{year.year}</p>
          <p className="text-xs text-muted-foreground">
            {formatNumberValue(year.withBio, locale)} {t("studentsUnit")}
          </p>
        </div>
        <p className="text-sm font-semibold text-success-700 dark:text-success-300">
          {healthyPct}%
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/50">
        <div
          className="h-full rounded-full bg-success-600 dark:bg-success-400"
          style={{ width: `${healthyPct}%` }}
        />
      </div>
    </div>
  );
}

function ZafStackedBar({
  healthy,
  healthyLabel,
  improvement,
  improvementLabel,
}: {
  healthy: number;
  healthyLabel: string;
  improvement: number;
  improvementLabel: string;
}) {
  const total = healthy + improvement;
  const healthyPct = total > 0 ? Math.round((healthy / total) * 100) : 0;

  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted/50">
        <div
          className="bg-success-600 dark:bg-success-400"
          style={{ width: `${healthyPct}%` }}
        />
        <div
          className="bg-danger-500/90 dark:bg-danger-400/90"
          style={{ width: `${Math.max(0, 100 - healthyPct)}%` }}
        />
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <span className="inline-flex items-center gap-2 font-medium">
          <span className="size-2 rounded-full bg-success-500" />
          {healthyLabel} {healthy}
        </span>
        <span className="inline-flex items-center gap-2 font-medium">
          <span className="size-2 rounded-full bg-danger-500" />
          {improvementLabel} {improvement}
        </span>
      </div>
    </div>
  );
}
