import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const user = await requireAuth();

  // Aluno sees their own summary
  if (user.role === "ALUNO") {
    const student = await prisma.student.findFirst({
      where: { userId: user.id },
      include: {
        biometrics: { orderBy: { recordedAt: "desc" }, take: 1 },
        tests: { orderBy: { recordedAt: "desc" }, take: 1 },
      },
    });

    return (
      <DashboardClient
        role={user.role}
        username={user.email.split("@")[0]}
        kpis={null}
        studentSummary={
          student
            ? {
              name: student.name,
              lastBiometric: student.biometrics[0]?.recordedAt?.toISOString() ?? null,
              lastTest: student.tests[0]?.recordedAt?.toISOString() ?? null,
            }
            : null
        }
        zafByYear={null}
      />
    );
  }

  // Staff KPIs + per-year ZAF distribution
  const [totalStudents, totalSessions, pendingSos, totalClasses, academicYears] =
    await Promise.all([
      prisma.student.count(),
      prisma.evaluationSession.count(),
      prisma.sosAlert.count({ where: { resolved: false } }),
      prisma.schoolClass.count(),
      prisma.academicYear.findMany({ orderBy: { label: "desc" }, take: 3 }),
    ]);

  // Per-year ZAF stats
  const zafByYear = await Promise.all(
    academicYears.map(async (ay) => {
      const students = await prisma.student.findMany({
        where: { schoolYear: ay.label },
        select: {
          biometrics: {
            orderBy: { recordedAt: "desc" },
            take: 1,
            select: { imcZone: true },
          },
        },
      });
      const withBio = students.filter((s) => s.biometrics.length > 0);
      const zsaf = withBio.filter(
        (s) =>
          s.biometrics[0]?.imcZone?.toLowerCase().includes("saudável") ||
          s.biometrics[0]?.imcZone === "ZSAF"
      ).length;
      const zmf = withBio.length - zsaf;
      return {
        year: ay.label,
        total: students.length,
        withBio: withBio.length,
        zsaf,
        zmf,
      };
    })
  );

  return (
    <DashboardClient
      role={user.role}
      username={user.email.split("@")[0]}
      kpis={{ totalStudents, totalSessions, pendingSos, totalClasses }}
      studentSummary={null}
      zafByYear={zafByYear}
    />
  );
}

