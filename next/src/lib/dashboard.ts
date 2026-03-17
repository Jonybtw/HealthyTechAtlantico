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
      variant: "psychologist" | "parent";
      studentSummary: null;
      cards: DashboardCardData[];
      zafByYear: null;
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
    const [openSos, questionnaireCount] = await Promise.all([
      prisma.sosAlert.count({ where: { resolved: false } }),
      prisma.questionnaire.count(),
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
          titleKey: "questionnairesReviewed",
          descriptionKey: "questionnaireQueue",
          value: questionnaireCount,
          icon: "book",
          accent: "gold",
        },
      ],
    };
  }

  if (user.role === "PAIS") {
    const guardianLinks = await prisma.studentGuardian.findMany({
      where: { guardianUserId: user.id },
      select: { studentId: true },
    });
    const linkedStudentIds = guardianLinks.map((link) => link.studentId);
    const reportCount = linkedStudentIds.length
      ? await prisma.report.count({
          where: { studentId: { in: linkedStudentIds } },
        })
      : 0;

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
      ],
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
