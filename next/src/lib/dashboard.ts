import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { classifyBmi } from "@/lib/zaf";

export interface ZafYearStat {
  year: string;
  total: number;
  withBio: number;
  zsaf: number;
  zmf: number;
}

export interface DashboardCardData {
  id: string;
  titleKey: string;
  descriptionKey: string;
  footer?: string;
  footerKey?: string;
  footerValues?: Record<string, string | number>;
  value: number;
  icon:
    | "users"
    | "activity"
    | "alert"
    | "school"
    | "file"
    | "book"
    | "clipboard"
    | "shield"
    | "gauge"
    | "upload"
    | "userPlus";
  accent: "blue" | "gold" | "red" | "green";
}

export interface DashboardActionData {
  id: string;
  titleKey: string;
  descriptionKey: string;
  href: string;
  icon: DashboardCardData["icon"];
  tone: "primary" | "secondary" | "gold" | "danger";
}

export interface DashboardWorkItem {
  id: string;
  title: string;
  titleKey?: string;
  titleValues?: Record<string, string | number>;
  meta: string | null;
  metaKey?: string;
  metaValues?: Record<string, string | number>;
  href: string;
  tone: "default" | "success" | "warning" | "danger" | "info";
  createdAt: Date;
}

function messageValues(
  values: Record<string, string | number>,
): Record<string, string | number> {
  return values;
}

export interface DashboardTrendPoint {
  averageBmi: number | null;
  biometricCount: number;
  fitnessScore: number | null;
  label: string;
  recordedAt: string;
  testCount: number;
}

export interface DashboardPsychologistAlertItem {
  id: string;
  studentId: string;
  studentName: string;
  className: string | null;
  createdAt: string;
}

export interface DashboardPsychologistQuestionnaireItem {
  id: string;
  studentId: string;
  studentName: string;
  type: string;
  submittedAt: string;
}

export interface DashboardParentStudentItem {
  id: string;
  name: string;
  className: string | null;
  schoolYear: string | null;
  lastReportAt: string | null;
  lastQuestionnaireAt: string | null;
  lastBiometricAt: string | null;
}

export interface DashboardParentReportItem {
  id: string;
  title: string;
  studentName: string;
  createdAt: string;
}

export interface StudentBiometricTrendPoint {
  label: string;
  heightCm: number;
  weightKg: number;
}

export interface StudentLatestBiometric {
  heightCm: number;
  weightKg: number;
  imc: number;
  imcZone: string;
  heightDelta: number | null;
  weightDelta: number | null;
}

export interface StudentPendingQuestionnaire {
  type: "AUTOCONCEITO" | "AUTOESTIMA" | "KIDMED";
  questionCount: number;
}

interface StudentSummary {
  name: string;
  className: string | null;
  schoolYear: string | null;
  processNumber: string | null;
  sex: "M" | "F";
  lastBiometric: string | null;
  lastTest: string | null;
  lastQuestionnaire: string | null;
  lastReportAt: string | null;
  openSos: number;
  activeExemptions: number;
  latestBiometric: StudentLatestBiometric | null;
  biometricTrend: StudentBiometricTrendPoint[];
  bmiZScore: number | null;
  percentile: number | null;
  fitnessScore: number | null;
  pendingQuestionnaires: StudentPendingQuestionnaire[];
}

export type DashboardSummary =
  | {
      variant: "student";
      studentSummary: StudentSummary | null;
      cards: DashboardCardData[];
      quickActions: DashboardActionData[];
      workItems: DashboardWorkItem[];
      zafByYear: null;
    }
  | {
      variant: "admin";
      studentSummary: null;
      cards: DashboardCardData[];
      quickActions: DashboardActionData[];
      workItems: DashboardWorkItem[];
      zafByYear: ZafYearStat[];
      quality: DashboardCardData[];
    }
  | {
      variant: "teacher";
      studentSummary: null;
      cards: DashboardCardData[];
      quickActions: DashboardActionData[];
      workItems: DashboardWorkItem[];
      zafByYear: ZafYearStat[];
      classCoverage: DashboardCardData[];
      trendPoints: DashboardTrendPoint[];
      systemStatus: {
        draftsSyncing: number;
        lastSyncAt: Date | null;
      };
    }
  | {
      variant: "psychologist";
      studentSummary: null;
      cards: DashboardCardData[];
      quickActions: DashboardActionData[];
      workItems: DashboardWorkItem[];
      zafByYear: ZafYearStat[];
      openAlerts: DashboardPsychologistAlertItem[];
      recentQuestionnaires: DashboardPsychologistQuestionnaireItem[];
    }
  | {
      variant: "parent";
      studentSummary: null;
      cards: DashboardCardData[];
      quickActions: DashboardActionData[];
      workItems: DashboardWorkItem[];
      zafByYear: ZafYearStat[];
      linkedStudents: DashboardParentStudentItem[];
      recentReports: DashboardParentReportItem[];
    };

function zToPercentile(z: number): number {
  const table: [number, number][] = [
    [-3.0, 0.1], [-2.0, 2.3], [-1.5, 6.7], [-1.0, 15.9],
    [-0.5, 30.9], [0.0, 50.0], [0.5, 69.1], [1.0, 84.1],
    [1.5, 93.3], [2.0, 97.7], [3.0, 99.9],
  ];
  if (z <= table[0][0]) return Math.round(table[0][1]);
  if (z >= table[table.length - 1][0]) return Math.round(table[table.length - 1][1]);
  for (let i = 0; i < table.length - 1; i++) {
    if (z >= table[i][0] && z <= table[i + 1][0]) {
      const [z0, p0] = table[i];
      const [z1, p1] = table[i + 1];
      const frac = (z - z0) / (z1 - z0);
      return Math.round(p0 + frac * (p1 - p0));
    }
  }
  return 50;
}

const QUESTIONNAIRE_QUESTION_COUNTS: Record<string, number> = {
  KIDMED: 16,
  AUTOCONCEITO: 23,
  AUTOESTIMA: 10,
};

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function buildAdminActivityFeed(): Promise<DashboardWorkItem[]> {
  const [alerts, sessions, questionnaires, reports, newStudents] =
    await Promise.all([
      prisma.sosAlert.findMany({
        where: { resolved: false },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          createdAt: true,
          student: { select: { id: true, name: true, className: true } },
        },
      }),
      prisma.evaluationSession.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          createdAt: true,
          createdBy: { select: { name: true } },
          student: { select: { id: true, name: true, className: true } },
          _count: { select: { biometrics: true } },
        },
      }),
      prisma.questionnaire.findMany({
        orderBy: { submittedAt: "desc" },
        take: 3,
        select: {
          id: true,
          type: true,
          submittedAt: true,
          student: { select: { id: true, name: true, className: true } },
        },
      }),
      prisma.report.findMany({
        orderBy: { createdAt: "desc" },
        take: 2,
        select: {
          id: true,
          createdAt: true,
          student: { select: { id: true, name: true } },
        },
      }),
      prisma.student.findMany({
        orderBy: { createdAt: "desc" },
        take: 2,
        select: {
          id: true,
          name: true,
          className: true,
          createdAt: true,
        },
      }),
    ]);

  const items: DashboardWorkItem[] = [
    ...alerts.map((a) => ({
      id: `sos-${a.id}`,
      title: `Alerta SOS criado para ${a.student.name}`,
      titleKey: "workSosCreated",
      titleValues: { name: a.student.name },
      meta: a.student.className
        ? `Por resolver \u2022 ${a.student.className}`
        : "Por resolver",
      metaKey: a.student.className ? "workUnresolvedClass" : "workUnresolved",
      metaValues: a.student.className
        ? messageValues({ className: a.student.className })
        : undefined,
      href: "/sos",
      tone: "danger" as const,
      createdAt: a.createdAt,
    })),
    ...sessions.map((s) => ({
      id: `session-${s.id}`,
      title: `Biometria registada para ${s.student.name}`,
      titleKey: "workBiometricsRecorded",
      titleValues: { name: s.student.name },
      meta: [s.student.className, s.createdBy?.name ? `Por ${s.createdBy.name}` : null]
        .filter(Boolean)
        .join(" \u2022 "),
      metaKey:
        s.student.className && s.createdBy?.name
          ? "workClassByUser"
          : s.student.className
            ? "workClassOnly"
            : s.createdBy?.name
              ? "workByUser"
              : undefined,
      metaValues:
        s.student.className && s.createdBy?.name
          ? messageValues({ className: s.student.className, name: s.createdBy.name })
          : s.student.className
            ? messageValues({ className: s.student.className })
            : s.createdBy?.name
              ? messageValues({ name: s.createdBy.name })
              : undefined,
      href: `/alunos/${s.student.id}`,
      tone: "warning" as const,
      createdAt: s.createdAt,
    })),
    ...questionnaires.map((q) => ({
      id: `q-${q.id}`,
      title: `Questionário ${q.type} concluído`,
      titleKey: "workQuestionnaireCompleted",
      titleValues: { type: q.type },
      meta: q.student.className
        ? `${q.student.name} \u2022 ${q.student.className}`
        : q.student.name,
      metaKey: q.student.className ? "workStudentClass" : "workStudentOnly",
      metaValues: q.student.className
        ? messageValues({ name: q.student.name, className: q.student.className })
        : messageValues({ name: q.student.name }),
      href: `/questionarios`,
      tone: "info" as const,
      createdAt: q.submittedAt,
    })),
    ...reports.map((r) => ({
      id: `report-${r.id}`,
      title: `Relatório gerado para ${r.student.name}`,
      titleKey: "workReportGenerated",
      titleValues: { name: r.student.name },
      meta: null,
      href: "/relatorio",
      tone: "success" as const,
      createdAt: r.createdAt,
    })),
    ...newStudents.map((s) => ({
      id: `student-${s.id}`,
      title: `Novo aluno inscrito: ${s.name}`,
      titleKey: "workNewStudent",
      titleValues: { name: s.name },
      meta: s.className ?? null,
      metaKey: s.className ? "workClassOnly" : undefined,
      metaValues: s.className
        ? messageValues({ className: s.className })
        : undefined,
      href: `/alunos/${s.id}`,
      tone: "default" as const,
      createdAt: s.createdAt,
    })),
  ];

  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 8);
}

async function buildTeacherActivityFeed(
  teacherId: string,
  teacherEmail: string | null,
): Promise<DashboardWorkItem[]> {
  const sosWhere =
    teacherEmail !== null && teacherEmail !== undefined
      ? { resolved: false, teacherEmail }
      : { resolved: false };

  const [alerts, sessions, questionnaires] = await Promise.all([
    prisma.sosAlert.findMany({
      where: sosWhere,
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        createdAt: true,
        student: { select: { id: true, name: true, className: true } },
      },
    }),
    prisma.evaluationSession.findMany({
      where: { createdById: teacherId },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        createdAt: true,
        student: { select: { id: true, name: true, className: true } },
        _count: { select: { biometrics: true } },
      },
    }),
    prisma.questionnaire.findMany({
      orderBy: { submittedAt: "desc" },
      take: 3,
      select: {
        id: true,
        type: true,
        submittedAt: true,
        student: { select: { id: true, name: true, className: true } },
      },
    }),
  ]);

  const items: DashboardWorkItem[] = [
    ...alerts.map((a) => ({
      id: `sos-${a.id}`,
      title: `Alerta SOS criado para ${a.student.name}`,
      titleKey: "workSosCreated",
      titleValues: { name: a.student.name },
      meta: a.student.className
        ? `Por resolver \u2022 ${a.student.className}`
        : "Por resolver",
      metaKey: a.student.className ? "workUnresolvedClass" : "workUnresolved",
      metaValues: a.student.className
        ? messageValues({ className: a.student.className })
        : undefined,
      href: "/sos",
      tone: "danger" as const,
      createdAt: a.createdAt,
    })),
    ...sessions.map((s) => ({
      id: `session-${s.id}`,
      title: `Biometria registada para ${s.student.name}`,
      titleKey: "workBiometricsRecorded",
      titleValues: { name: s.student.name },
      meta: s.student.className ?? null,
      metaKey: s.student.className ? "workClassOnly" : undefined,
      metaValues: s.student.className
        ? messageValues({ className: s.student.className })
        : undefined,
      href: `/alunos/${s.student.id}`,
      tone: "warning" as const,
      createdAt: s.createdAt,
    })),
    ...questionnaires.map((q) => ({
      id: `q-${q.id}`,
      title: `Questionário ${q.type} concluído`,
      titleKey: "workQuestionnaireCompleted",
      titleValues: { type: q.type },
      meta: q.student.className
        ? `${q.student.name} \u2022 ${q.student.className}`
        : q.student.name,
      metaKey: q.student.className ? "workStudentClass" : "workStudentOnly",
      metaValues: q.student.className
        ? messageValues({ name: q.student.name, className: q.student.className })
        : messageValues({ name: q.student.name }),
      href: `/questionarios`,
      tone: "info" as const,
      createdAt: q.submittedAt,
    })),
  ];

  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 8);
}

async function getLastTeacherActivity(teacherId: string): Promise<Date | null> {
  const [lastSession, lastAlert] = await Promise.all([
    prisma.evaluationSession.findFirst({
      where: { createdById: teacherId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.sosAlert.findFirst({
      where: { resolvedById: teacherId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const dates = [lastSession?.createdAt, lastAlert?.createdAt].filter(Boolean) as Date[];
  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

async function getLatestAcademicYearLabel() {
  const latest = await prisma.academicYear.findFirst({
    orderBy: { label: "desc" },
    select: { label: true },
  });

  return latest?.label ?? null;
}

async function getRecentZafStats(): Promise<ZafYearStat[]> {
  const academicYears = await prisma.academicYear.findMany({
    orderBy: { label: "desc" },
    take: 3,
  });

  return Promise.all(
    academicYears.map(async (academicYear) => {
      const students = await prisma.student.findMany({
        where: { schoolYear: academicYear.label },
        select: {
          biometrics: {
            orderBy: { recordedAt: "desc" },
            take: 1,
            select: { imcZone: true },
          },
        },
      });

      const withBio = students.filter(
        (student) => student.biometrics.length > 0,
      );
      const zsaf = withBio.filter((student) => {
        const zone = student.biometrics[0]?.imcZone ?? "";
        return zone.toLowerCase().includes("saud") || zone === "ZSAF";
      }).length;

      return {
        year: academicYear.label,
        total: students.length,
        withBio: withBio.length,
        zsaf,
        zmf: withBio.length - zsaf,
      };
    }),
  );
}

function buildQuickActions(ids: Array<DashboardActionData["id"]>) {
  const catalog: Record<string, DashboardActionData> = {
    sos: {
      id: "sos",
      titleKey: "actionSosTitle",
      descriptionKey: "actionSosDesc",
      href: "/sos",
      icon: "alert",
      tone: "danger",
    },
    students: {
      id: "students",
      titleKey: "actionStudentsTitle",
      descriptionKey: "actionStudentsDesc",
      href: "/alunos",
      icon: "users",
      tone: "primary",
    },
    class: {
      id: "class",
      titleKey: "actionClassTitle",
      descriptionKey: "actionClassDesc",
      href: "/turma",
      icon: "school",
      tone: "secondary",
    },
    biometrics: {
      id: "biometrics",
      titleKey: "actionBiometricsTitle",
      descriptionKey: "actionBiometricsDesc",
      href: "/biometria",
      icon: "activity",
      tone: "gold",
    },
    tests: {
      id: "tests",
      titleKey: "actionTestsTitle",
      descriptionKey: "actionTestsDesc",
      href: "/testes",
      icon: "clipboard",
      tone: "secondary",
    },
    reports: {
      id: "reports",
      titleKey: "actionReportsTitle",
      descriptionKey: "actionReportsDesc",
      href: "/relatorio",
      icon: "file",
      tone: "secondary",
    },
    questionnaires: {
      id: "questionnaires",
      titleKey: "actionQuestionnairesTitle",
      descriptionKey: "actionQuestionnairesDesc",
      href: "/questionarios",
      icon: "book",
      tone: "gold",
    },
    protocols: {
      id: "protocols",
      titleKey: "actionProtocolsTitle",
      descriptionKey: "actionProtocolsDesc",
      href: "/protocolos",
      icon: "shield",
      tone: "secondary",
    },
    admin: {
      id: "admin",
      titleKey: "actionAdminTitle",
      descriptionKey: "actionAdminDesc",
      href: "/admin",
      icon: "shield",
      tone: "primary",
    },
    audit: {
      id: "audit",
      titleKey: "actionAuditTitle",
      descriptionKey: "actionAuditDesc",
      href: "/auditoria",
      icon: "file",
      tone: "secondary",
    },
    profile: {
      id: "profile",
      titleKey: "actionProfileTitle",
      descriptionKey: "actionProfileDesc",
      href: "/perfil",
      icon: "users",
      tone: "secondary",
    },
    logBiometrics: {
      id: "logBiometrics",
      titleKey: "actionLogBiometricsTitle",
      descriptionKey: "actionLogBiometricsDesc",
      href: "/biometria",
      icon: "activity",
      tone: "gold",
    },
    raiseSos: {
      id: "raiseSos",
      titleKey: "actionRaiseSosTitle",
      descriptionKey: "actionRaiseSosDesc",
      href: "/sos",
      icon: "alert",
      tone: "danger",
    },
    newAssessment: {
      id: "newAssessment",
      titleKey: "actionNewAssessmentTitle",
      descriptionKey: "actionNewAssessmentDesc",
      href: "/questionarios",
      icon: "clipboard",
      tone: "secondary",
    },
    generateReport: {
      id: "generateReport",
      titleKey: "actionGenerateReportTitle",
      descriptionKey: "actionGenerateReportDesc",
      href: "/relatorio",
      icon: "file",
      tone: "secondary",
    },
    enrollStudent: {
      id: "enrollStudent",
      titleKey: "actionEnrollStudentTitle",
      descriptionKey: "actionEnrollStudentDesc",
      href: "/alunos",
      icon: "userPlus",
      tone: "gold",
    },
    bulkImport: {
      id: "bulkImport",
      titleKey: "actionBulkImportTitle",
      descriptionKey: "actionBulkImportDesc",
      href: "/turma",
      icon: "upload",
      tone: "secondary",
    },
  };

  return ids.map((id) => catalog[id]).filter(Boolean);
}

async function getCurrentYearStudentReadiness(schoolYear: string | null) {
  if (!schoolYear) {
    return [];
  }

  return prisma.student.findMany({
    where: { schoolYear },
    orderBy: [{ className: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      className: true,
      schoolYear: true,
      biometrics: {
        orderBy: { recordedAt: "desc" },
        take: 1,
        select: { recordedAt: true },
      },
      tests: {
        orderBy: { recordedAt: "desc" },
        take: 1,
        select: { recordedAt: true },
      },
      questionnaires: {
        orderBy: { submittedAt: "desc" },
        take: 1,
        select: { submittedAt: true },
      },
    },
  });
}

function isHealthyZoneLabel(value: string | null | undefined) {
  const zone = value?.toLowerCase() ?? "";
  return zone.includes("saud") || zone === "zsaf" || zone.includes("healthy");
}

function buildTeacherTrendPoints(
  sessions: Array<{
    biometrics: Array<{ imc: unknown }>;
    createdAt: Date;
    label: string;
    tests: Array<{ zone: string }>;
  }>,
): DashboardTrendPoint[] {
  const groups = new Map<
    string,
    {
      biometricCount: number;
      bmiTotal: number;
      label: string;
      recordedAt: Date;
      testCount: number;
      testsHealthy: number;
    }
  >();

  for (const session of sessions) {
    const key = session.createdAt.toISOString().slice(0, 10);
    const group =
      groups.get(key) ??
      {
        biometricCount: 0,
        bmiTotal: 0,
        label: session.label,
        recordedAt: session.createdAt,
        testCount: 0,
        testsHealthy: 0,
      };

    for (const biometric of session.biometrics) {
      const imc = Number(biometric.imc);
      if (Number.isFinite(imc)) {
        group.bmiTotal += imc;
        group.biometricCount += 1;
      }
    }

    for (const test of session.tests) {
      group.testCount += 1;
      if (isHealthyZoneLabel(test.zone)) {
        group.testsHealthy += 1;
      }
    }

    groups.set(key, group);
  }

  return [...groups.values()]
    .sort((left, right) => left.recordedAt.getTime() - right.recordedAt.getTime())
    .map((group) => ({
      averageBmi:
        group.biometricCount > 0
          ? Math.round((group.bmiTotal / group.biometricCount) * 10) / 10
          : null,
      biometricCount: group.biometricCount,
      fitnessScore:
        group.testCount > 0
          ? Math.round((group.testsHealthy / group.testCount) * 100)
          : null,
      label: group.label,
      recordedAt: group.recordedAt.toISOString(),
      testCount: group.testCount,
    }));
}

export async function getDashboardSummaryForUser(user: {
  email?: string | null;
  id: string;
  role: Role;
}): Promise<DashboardSummary> {
  if (user.role === "ALUNO") {
    const now = new Date();
    const student = await prisma.student.findUnique({
      where: { linkedUserId: user.id },
      include: {
        biometrics: { orderBy: { recordedAt: "desc" }, take: 8 },
        tests: {
          orderBy: { recordedAt: "desc" },
          take: 20,
          select: { zone: true, recordedAt: true },
        },
        questionnaires: {
          select: { type: true, schoolYear: true, submittedAt: true },
          orderBy: { submittedAt: "desc" },
          take: 50,
        },
        reports: { orderBy: { createdAt: "desc" }, take: 1 },
        sosAlerts: {
          where: { resolved: false },
          select: { id: true },
        },
        exemptions: {
          where: {
            startDate: { lte: now },
            endDate: { gte: now },
          },
          select: { id: true },
        },
      },
    });

    const latestBio = student?.biometrics[0] ?? null;
    const prevBio = student?.biometrics[1] ?? null;

    let latestBiometric: StudentLatestBiometric | null = null;
    let bmiZScore: number | null = null;
    let percentile: number | null = null;

    if (latestBio) {
      const heightDelta =
        prevBio !== null
          ? Math.round(
              (Number(latestBio.heightM) - Number(prevBio.heightM)) * 1000,
            ) / 10
          : null;
      const weightDelta =
        prevBio !== null
          ? Math.round(
              (Number(latestBio.weightKg) - Number(prevBio.weightKg)) * 10,
            ) / 10
          : null;

      latestBiometric = {
        heightCm: Math.round(Number(latestBio.heightM) * 100),
        weightKg: Number(latestBio.weightKg),
        imc: Math.round(Number(latestBio.imc) * 10) / 10,
        imcZone: latestBio.imcZone,
        heightDelta,
        weightDelta,
      };

      if (student?.age && student.sex) {
        const classification = classifyBmi(
          Number(latestBio.imc),
          student.sex,
          student.age,
        );
        if (classification) {
          const midpoint = (classification.min + classification.max) / 2;
          const halfRange = (classification.max - classification.min) / 2;
          bmiZScore =
            Math.round(
              ((Number(latestBio.imc) - midpoint) / halfRange) * 100,
            ) / 100;
          percentile = zToPercentile(bmiZScore);
        }
      }
    }

    const biometricTrend: StudentBiometricTrendPoint[] = [
      ...(student?.biometrics ?? []),
    ]
      .reverse()
      .map((b) => ({
        label: new Date(b.recordedAt).toLocaleDateString("pt-PT", {
          month: "short",
          year: "2-digit",
        }),
        heightCm: Math.round(Number(b.heightM) * 100),
        weightKg: Math.round(Number(b.weightKg) * 10) / 10,
      }));

    const allTests = student?.tests ?? [];
    const healthyTests = allTests.filter((t) => t.zone === "Zona Saudável");
    const fitnessScore =
      allTests.length > 0
        ? Math.round((healthyTests.length / allTests.length) * 100)
        : null;

    const currentSchoolYear = student?.schoolYear ?? null;
    const submittedTypes = new Set(
      (student?.questionnaires ?? [])
        .filter(
          (q) => !currentSchoolYear || q.schoolYear === currentSchoolYear,
        )
        .map((q) => q.type as string),
    );
    const ALL_QUESTIONNAIRE_TYPES = [
      "KIDMED",
      "AUTOCONCEITO",
      "AUTOESTIMA",
    ] as const;
    const pendingQuestionnaires: StudentPendingQuestionnaire[] =
      ALL_QUESTIONNAIRE_TYPES.filter(
        (type) => !submittedTypes.has(type),
      ).map((type) => ({
        type,
        questionCount: QUESTIONNAIRE_QUESTION_COUNTS[type] ?? 10,
      }));

    return {
      variant: "student",
      studentSummary: student
        ? {
            name: student.name,
            className: student.className,
            schoolYear: student.schoolYear,
            processNumber: student.processNumber,
            sex: student.sex,
            lastBiometric:
              student.biometrics[0]?.recordedAt?.toISOString() ?? null,
            lastTest: student.tests[0]?.recordedAt?.toISOString() ?? null,
            lastQuestionnaire:
              student.questionnaires[0]?.submittedAt?.toISOString() ?? null,
            lastReportAt: student.reports[0]?.createdAt?.toISOString() ?? null,
            openSos: student.sosAlerts.length,
            activeExemptions: student.exemptions.length,
            latestBiometric,
            biometricTrend,
            bmiZScore,
            percentile,
            fitnessScore,
            pendingQuestionnaires,
          }
        : null,
      cards: [],
      quickActions: buildQuickActions([
        "questionnaires",
        "reports",
        "protocols",
        "profile",
      ]),
      workItems: [],
      zafByYear: null,
    };
  }

  const [latestYear, zafByYear] = await Promise.all([
    getLatestAcademicYearLabel(),
    getRecentZafStats(),
  ]);

  if (user.role === "PSICOLOGO") {
    const alertWhere =
      user.email !== null && user.email !== undefined
        ? { resolved: false, psychEmail: user.email }
        : { resolved: false };
    const [
      openSos,
      questionnaireCount,
      followedStudents,
      recentAlerts,
      recentQuestionnaires,
    ] = await Promise.all([
      prisma.sosAlert.count({ where: alertWhere }),
      prisma.questionnaire.count(),
      prisma.sosAlert.findMany({
        where: alertWhere,
        distinct: ["studentId"],
        select: { studentId: true },
      }),
      prisma.sosAlert.findMany({
        where: alertWhere,
        orderBy: { createdAt: "asc" },
        take: 6,
        select: {
          id: true,
          createdAt: true,
          student: {
            select: {
              id: true,
              name: true,
              className: true,
            },
          },
        },
      }),
      prisma.questionnaire.findMany({
        orderBy: { submittedAt: "desc" },
        take: 6,
        select: {
          id: true,
          type: true,
          submittedAt: true,
          student: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      variant: "psychologist",
      studentSummary: null,
      zafByYear,
      cards: [
        {
          id: "open-sos",
          titleKey: "pendingSos",
          descriptionKey: "alertsPending",
          value: openSos,
          icon: "alert",
          accent: "red",
        },
        {
          id: "questionnaires",
          titleKey: "questionnairesAvailable",
          descriptionKey: "questionnaireQueue",
          value: questionnaireCount,
          icon: "book",
          accent: "gold",
        },
        {
          id: "students-in-follow-up",
          titleKey: "studentsInFollowUp",
          descriptionKey: "studentsInFollowUpDesc",
          value: followedStudents.length,
          icon: "users",
          accent: "blue",
        },
      ],
      quickActions: buildQuickActions(["sos", "protocols", "profile"]),
      workItems: recentAlerts.map((alert) => ({
        id: alert.id,
        title: `Alerta SOS - ${alert.student.name}`,
        meta: alert.student.className ?? null,
        href: `/acompanhamento/${alert.student.id}`,
        tone: "danger" as const,
        createdAt: alert.createdAt,
      })),
      openAlerts: recentAlerts.map((alert) => ({
        id: alert.id,
        studentId: alert.student.id,
        studentName: alert.student.name,
        className: alert.student.className,
        createdAt: alert.createdAt.toISOString(),
      })),
      recentQuestionnaires: recentQuestionnaires.map((questionnaire) => ({
        id: questionnaire.id,
        studentId: questionnaire.student.id,
        studentName: questionnaire.student.name,
        type: questionnaire.type,
        submittedAt: questionnaire.submittedAt.toISOString(),
      })),
    };
  }

  if (user.role === "PAIS") {
    const guardianLinks = await prisma.studentGuardian.findMany({
      where: { guardianUserId: user.id },
      select: { studentId: true },
    });
    const linkedStudentIds = guardianLinks.map((link) => link.studentId);
    const [
      reportCount,
      questionnaireCount,
      linkedStudents,
      recentReports,
    ] = linkedStudentIds.length
      ? await Promise.all([
          prisma.report.count({
            where: { studentId: { in: linkedStudentIds } },
          }),
          prisma.questionnaire.count({
            where: { studentId: { in: linkedStudentIds } },
          }),
          prisma.student.findMany({
            where: { id: { in: linkedStudentIds } },
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              className: true,
              schoolYear: true,
              biometrics: {
                orderBy: { recordedAt: "desc" },
                take: 1,
                select: { recordedAt: true },
              },
              reports: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { createdAt: true },
              },
              questionnaires: {
                orderBy: { submittedAt: "desc" },
                take: 1,
                select: { submittedAt: true },
              },
            },
          }),
          prisma.report.findMany({
            where: { studentId: { in: linkedStudentIds } },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              title: true,
              createdAt: true,
              student: {
                select: {
                  name: true,
                },
              },
            },
          }),
        ])
      : [0, 0, [], []];

    return {
      variant: "parent",
      studentSummary: null,
      zafByYear,
      cards: [
        {
          id: "linked-students",
          titleKey: "linkedStudents",
          descriptionKey: "linkedStudentsDesc",
          value: linkedStudentIds.length,
          icon: "users",
          accent: "blue",
        },
        {
          id: "reports",
          titleKey: "reportsAvailable",
          descriptionKey: "reportsAvailableDesc",
          value: reportCount,
          icon: "file",
          accent: "green",
        },
        {
          id: "family-questionnaires",
          titleKey: "questionnairesAvailable",
          descriptionKey: "familyQuestionnairesDesc",
          value: questionnaireCount,
          icon: "book",
          accent: "gold",
        },
      ],
      quickActions: buildQuickActions(["reports", "protocols", "profile"]),
      workItems: recentReports.map((report) => ({
        id: report.id,
        title: report.title,
        meta: report.student.name,
        href: "/relatorio",
        tone: "info" as const,
        createdAt: report.createdAt,
      })),
      linkedStudents: linkedStudents.map((student) => ({
        id: student.id,
        name: student.name,
        className: student.className,
        schoolYear: student.schoolYear,
        lastReportAt: student.reports[0]?.createdAt?.toISOString() ?? null,
        lastQuestionnaireAt:
          student.questionnaires[0]?.submittedAt?.toISOString() ?? null,
        lastBiometricAt:
          student.biometrics[0]?.recordedAt?.toISOString() ?? null,
      })),
      recentReports: recentReports.map((report) => ({
        id: report.id,
        title: report.title,
        studentName: report.student.name,
        createdAt: report.createdAt.toISOString(),
      })),
    };
  }

  if (user.role === "PROFESSOR") {
    const now = new Date();
    const readiness = await getCurrentYearStudentReadiness(latestYear);
    const [
      sessionsByTeacher,
      openSosForTeacher,
      _activeExemptions,
      _recentSessions,
      trendSessions,
    ] = await Promise.all([
        prisma.evaluationSession.count({ where: { createdById: user.id } }),
        prisma.sosAlert.count({
          where:
            user.email !== null && user.email !== undefined
              ? { resolved: false, teacherEmail: user.email }
              : { resolved: false },
        }),
        prisma.exemption.count({
          where: {
            startDate: { lte: now },
            endDate: { gte: now },
          },
        }),
        prisma.evaluationSession.findMany({
          where: { createdById: user.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            label: true,
            createdAt: true,
            _count: {
              select: {
                biometrics: true,
                tests: true,
              },
            },
            student: {
              select: {
                id: true,
                name: true,
                className: true,
              },
            },
          },
        }),
        prisma.evaluationSession.findMany({
          where: {
            createdById: user.id,
            schoolYear: latestYear ?? undefined,
          },
          orderBy: { createdAt: "asc" },
          select: {
            label: true,
            createdAt: true,
            biometrics: {
              select: {
                imc: true,
              },
            },
            tests: {
              select: {
                zone: true,
              },
            },
          },
        }),
      ]);

    const missingBiometrics = readiness.filter(
      (student) => student.biometrics.length === 0,
    );
    const missingTests = readiness.filter((student) => student.tests.length === 0);
    const missingQuestionnaires = readiness.filter(
      (student) => student.questionnaires.length === 0,
    );

    return {
      variant: "teacher",
      studentSummary: null,
      zafByYear,
      cards: [
        {
          id: "teacher-students",
          titleKey: "totalStudentsTitle",
          descriptionKey: "totalStudentsFooter",
          footer: `${readiness.length} este ano`,
          footerKey: "footerCountThisYear",
          footerValues: { count: readiness.length },
          value: readiness.length,
          icon: "users",
          accent: "blue",
        },
        {
          id: "teacher-sessions",
          titleKey: "biometricsLoggedTitle",
          descriptionKey: "biometricsLoggedFooter",
          footer: "Este ano letivo",
          footerKey: "biometricsLoggedFooter",
          value: sessionsByTeacher,
          icon: "activity",
          accent: "green",
        },
        {
          id: "teacher-sos",
          titleKey: "activeAlertsTitle",
          descriptionKey: "activeAlertsFooter",
          footer: `${openSosForTeacher} alertas abertos`,
          footerKey: "footerOpenAlerts",
          footerValues: { count: openSosForTeacher },
          value: openSosForTeacher,
          icon: "alert",
          accent: "gold",
        },
        {
          id: "teacher-exemptions",
          titleKey: "pendingAssessmentsTitle",
          descriptionKey: "pendingAssessmentsFooter",
          footer: `${missingBiometrics.length} em atraso`,
          footerKey: "footerOverdue",
          footerValues: { count: missingBiometrics.length },
          value: missingBiometrics.length,
          icon: "clipboard",
          accent: "red",
        },
      ],
      quickActions: buildQuickActions([
        "logBiometrics",
        "raiseSos",
        "newAssessment",
        "generateReport",
        "enrollStudent",
        "bulkImport",
      ]),
      workItems: await buildTeacherActivityFeed(user.id, user.email ?? null),
      classCoverage: [
        {
          id: "missing-biometrics",
          titleKey: "missingBiometrics",
          descriptionKey: "missingBiometricsDesc",
          value: missingBiometrics.length,
          icon: "activity",
          accent: "gold",
        },
        {
          id: "missing-tests",
          titleKey: "missingTests",
          descriptionKey: "missingTestsDesc",
          value: missingTests.length,
          icon: "clipboard",
          accent: "blue",
        },
        {
          id: "missing-questionnaires",
          titleKey: "missingQuestionnaires",
          descriptionKey: "missingQuestionnairesDesc",
          value: missingQuestionnaires.length,
          icon: "book",
          accent: "green",
        },
      ],
      trendPoints: buildTeacherTrendPoints(trendSessions),
      systemStatus: {
        draftsSyncing: missingBiometrics.length + missingTests.length + missingQuestionnaires.length,
        lastSyncAt: await getLastTeacherActivity(user.id),
      },
    };
  }

  const currentStudents = await getCurrentYearStudentReadiness(latestYear);
  const [
    totalStudents,
    totalBiometrics,
    pendingSos,
    _totalClasses,
    _guardianLinks,
    _reportsLast30Days,
    _auditLast7Days,
    newStudentsThisMonth,
    criticalSos,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.biometric.count(),
    prisma.sosAlert.count({ where: { resolved: false } }),
    prisma.schoolClass.count(),
    prisma.studentGuardian.count(),
    prisma.report.count({ where: { createdAt: { gte: daysAgo(30) } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: daysAgo(7) } } }),
    prisma.student.count({ where: { createdAt: { gte: daysAgo(30) } } }),
    prisma.sosAlert.count({ where: { resolved: false, createdAt: { lte: daysAgo(7) } } }),
  ]);

  const missingBiometrics = currentStudents.filter(
    (student) => student.biometrics.length === 0,
  );
  const missingTests = currentStudents.filter(
    (student) => student.tests.length === 0,
  );
  const missingQuestionnaires = currentStudents.filter(
    (student) => student.questionnaires.length === 0,
  );
  const unlinkedStudents = await prisma.student.count({
    where: { schoolYear: latestYear ?? undefined, linkedUserId: null },
  });

  return {
    variant: "admin",
    studentSummary: null,
    zafByYear,
    cards: [
      {
        id: "students",
        titleKey: "totalStudentsTitle",
        descriptionKey: "totalStudentsFooter",
        footer: `+${newStudentsThisMonth} este mês`,
        footerKey: "footerNewThisMonth",
        footerValues: { count: newStudentsThisMonth },
        value: totalStudents,
        icon: "users",
        accent: "blue",
      },
      {
        id: "biometrics",
        titleKey: "biometricsLoggedTitle",
        descriptionKey: "biometricsLoggedFooter",
        footer: "Este ano letivo",
        footerKey: "biometricsLoggedFooter",
        value: totalBiometrics,
        icon: "activity",
        accent: "green",
      },
      {
        id: "active-alerts",
        titleKey: "activeAlertsTitle",
        descriptionKey: "activeAlertsFooter",
        footer: `${criticalSos} prioridade crítica`,
        footerKey: "footerCriticalPriority",
        footerValues: { count: criticalSos },
        value: pendingSos,
        icon: "alert",
        accent: "gold",
      },
      {
        id: "pending-assessments",
        titleKey: "pendingAssessmentsTitle",
        descriptionKey: "pendingAssessmentsFooter",
        footer: `${missingBiometrics.length} em atraso`,
        footerKey: "footerOverdue",
        footerValues: { count: missingBiometrics.length },
        value: missingBiometrics.length,
        icon: "clipboard",
        accent: "red",
      },
    ],
    quickActions: buildQuickActions([
      "sos",
      "students",
      "admin",
      "audit",
      "reports",
    ]),
    workItems: await buildAdminActivityFeed(),
    quality: [
      {
        id: "missing-biometrics",
        titleKey: "missingBiometrics",
        descriptionKey: "missingBiometricsDesc",
        value: missingBiometrics.length,
        icon: "activity",
        accent: "gold",
      },
      {
        id: "missing-tests",
        titleKey: "missingTests",
        descriptionKey: "missingTestsDesc",
        value: missingTests.length,
        icon: "clipboard",
        accent: "blue",
      },
      {
        id: "missing-questionnaires",
        titleKey: "missingQuestionnaires",
        descriptionKey: "missingQuestionnairesDesc",
        value: missingQuestionnaires.length,
        icon: "book",
        accent: "green",
      },
      {
        id: "unlinked-students",
        titleKey: "unlinkedStudents",
        descriptionKey: "unlinkedStudentsDesc",
        value: unlinkedStudents,
        icon: "users",
        accent: "red",
      },
    ],
  };
}
