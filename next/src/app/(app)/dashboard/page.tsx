import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const user = await requireAuth();

  // Professors / Psicólogos see KPIs; students see their own summary
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
      />
    );
  }

  // Staff KPIs
  const [totalStudents, totalSessions, pendingSos, totalClasses] =
    await Promise.all([
      prisma.student.count(),
      prisma.evaluationSession.count(),
      prisma.sosAlert.count({ where: { resolved: false } }),
      prisma.schoolClass.count(),
    ]);

  return (
    <DashboardClient
      role={user.role}
      username={user.email.split("@")[0]}
      kpis={{ totalStudents, totalSessions, pendingSos, totalClasses }}
      studentSummary={null}
    />
  );
}
