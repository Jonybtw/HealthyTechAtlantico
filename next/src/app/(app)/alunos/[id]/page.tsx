import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StudentDetailClient } from "./student-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params;
  await requireAuth();

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      biometrics: { orderBy: { recordedAt: "desc" }, take: 5 },
      tests: { orderBy: { recordedAt: "desc" }, take: 5 },
      questionnaires: { orderBy: { submittedAt: "desc" }, take: 5 },
      dispensas: { orderBy: { startDate: "desc" } },
      guardians: { include: { guardian: true } },
    },
  });

  if (!student) notFound();

  // Serialize dates for client
  const serialized = {
    ...student,
    birthDate: student.birthDate?.toISOString() ?? null,
    createdAt: student.createdAt.toISOString(),
    updatedAt: student.updatedAt.toISOString(),
    biometrics: student.biometrics.map((b) => ({
      ...b,
      heightM: Number(b.heightM),
      weightKg: Number(b.weightKg),
      waistCm: b.waistCm ? Number(b.waistCm) : null,
      fatPct: b.fatPct ? Number(b.fatPct) : null,
      imc: Number(b.imc),
      recordedAt: b.recordedAt.toISOString(),
    })),
    tests: student.tests.map((t) => ({
      ...t,
      valueNum: t.valueNum ? Number(t.valueNum) : null,
      recordedAt: t.recordedAt.toISOString(),
    })),
    questionnaires: student.questionnaires.map((q) => ({
      ...q,
      submittedAt: q.submittedAt.toISOString(),
    })),
    dispensas: student.dispensas.map((d) => ({
      ...d,
      startDate: d.startDate.toISOString(),
      endDate: d.endDate.toISOString(),
      createdAt: d.createdAt.toISOString(),
    })),
    guardians: student.guardians.map((g) => ({
      id: g.id,
      relationship: g.relationship,
      guardian: {
        name: g.guardian.name,
        email: g.guardian.email,
      },
    })),
  };

  return <StudentDetailClient student={serialized} />;
}
