import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getLinkedStudentByUserId } from "@/lib/student-access";

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
  value: number;
  icon: "users" | "activity" | "alert" | "school" | "file" | "book";
  accent: "blue" | "gold" | "red" | "green";
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
}

export interface DashboardParentReportItem {
  id: string;
  title: string;
  studentName: string;
  createdAt: string;
}

export type DashboardSummary =
  | {
      variant: "student";
      studentSummary: {
        name: string;
        lastBiometric: string | null;
        lastTest: string | null;
      } | null;
      cards: [];
      zafByYear: null;
    }
  | {
      variant: "staff";
      studentSummary: null;
      cards: DashboardCardData[];
      zafByYear: ZafYearStat[];
    }
  | {
      variant: "psychologist";
      studentSummary: null;
      cards: DashboardCardData[];
      zafByYear: null;
      openAlerts: DashboardPsychologistAlertItem[];
      recentQuestionnaires: DashboardPsychologistQuestionnaireItem[];
    }
  | {
      variant: "parent";
      studentSummary: null;
      cards: DashboardCardData[];
      zafByYear: null;
      linkedStudents: DashboardParentStudentItem[];
      recentReports: DashboardParentReportItem[];
    };

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

      const withBio = students.filter((student) => student.biometrics.length > 0);
      const zsaf = withBio.filter((student) => {
        const zone = student.biometrics[0]?.imcZone ?? "";
        return zone.toLowerCase().includes("saudável") || zone === "ZSAF";
      }).length;

      return {
        year: academicYear.label,
        total: students.length,
        withBio: withBio.length,
        zsaf,
        zmf: withBio.length - zsaf,
      };
    })
  );
}

export async function getDashboardSummaryForUser(user: {
  id: string;
  role: Role;
}): Promise<DashboardSummary> {
  if (user.role === "ALUNO") {
    const student = await prisma.student.findUnique({
      where: { linkedUserId: user.id },
      include: {
        biometrics: { orderBy: { recordedAt: "desc" }, take: 1 },
        tests: { orderBy: { recordedAt: "desc" }, take: 1 },
      },
    });

    return {
      variant: "student",
      studentSummary: student
        ? {
            name: student.name,
            lastBiometric: student.biometrics[0]?.recordedAt?.toISOString() ?? null,
            lastTest: student.tests[0]?.recordedAt?.toISOString() ?? null,
          }
        : null,
      cards: [],
      zafByYear: null,
    };
  }

  if (user.role === "PSICOLOGO") {
    const [openSos, questionnaireCount, followedStudents, recentAlerts, recentQuestionnaires] = await Promise.all([
      prisma.sosAlert.count({ where: { resolved: false } }),
      prisma.questionnaire.count(),
      prisma.sosAlert.findMany({
        where: { resolved: false },
        distinct: ["studentId"],
        select: { studentId: true },
      }),
      prisma.sosAlert.findMany({
        where: { resolved: false },
        orderBy: { createdAt: "desc" },
        take: 4,
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
        take: 4,
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
      zafByYear: null,
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
    const [reportCount, questionnaireCount, linkedStudents, recentReports] = linkedStudentIds.length
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
            take: 4,
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
      zafByYear: null,
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
      linkedStudents: linkedStudents.map((student) => ({
        id: student.id,
        name: student.name,
        className: student.className,
        schoolYear: student.schoolYear,
        lastReportAt: student.reports[0]?.createdAt?.toISOString() ?? null,
        lastQuestionnaireAt: student.questionnaires[0]?.submittedAt?.toISOString() ?? null,
      })),
      recentReports: recentReports.map((report) => ({
        id: report.id,
        title: report.title,
        studentName: report.student.name,
        createdAt: report.createdAt.toISOString(),
      })),
    };
  }

  const [totalStudents, totalSessions, pendingSos, totalClasses, zafByYear] =
    await Promise.all([
      prisma.student.count(),
      prisma.evaluationSession.count(),
      prisma.sosAlert.count({ where: { resolved: false } }),
      prisma.schoolClass.count(),
      getRecentZafStats(),
    ]);

  return {
    variant: "staff",
    studentSummary: null,
    zafByYear,
    cards: [
      {
        id: "students",
        titleKey: "students",
        descriptionKey: "totalRegistered",
        value: totalStudents,
        icon: "users",
        accent: "blue",
      },
      {
        id: "classes",
        titleKey: "classes",
        descriptionKey: "activeClasses",
        value: totalClasses,
        icon: "school",
        accent: "green",
      },
      {
        id: "sessions",
        titleKey: "sessions",
        descriptionKey: "evaluationsDone",
        value: totalSessions,
        icon: "activity",
        accent: "gold",
      },
      {
        id: "pending-sos",
        titleKey: "pendingSos",
        descriptionKey: "alertsPending",
        value: pendingSos,
        icon: "alert",
        accent: "red",
      },
    ],
  };
}

export async function getStudentSelfServiceProfile(userId: string) {
  return getLinkedStudentByUserId(userId);
}
