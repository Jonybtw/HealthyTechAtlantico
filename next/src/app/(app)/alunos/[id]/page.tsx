import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/rbac";
import { notFound, redirect } from "next/navigation";
import { StudentDetailClient } from "./student-detail-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("studentDetail");

  return {
    title: t("editTitle"),
  };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireAuth();

  if (!isStaffRole(user.role)) {
    redirect("/dashboard");
  }

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      biometrics: { orderBy: { recordedAt: "desc" }, take: 5 },
      tests: { orderBy: { recordedAt: "desc" }, take: 5 },
      questionnaires: { orderBy: { submittedAt: "desc" }, take: 5 },
      dispensas: { orderBy: { startDate: "desc" } },
      kidmedConsentRecordedBy: { select: { id: true, name: true, email: true } },
      guardians: { include: { guardian: true } },
    },
  });

  if (!student) notFound();

  // Serialize dates for client
  const serialized = {
    ...student,
    birthDate: student.birthDate?.toISOString() ?? null,
    kidmedConsentAt: student.kidmedConsentAt?.toISOString() ?? null,
    kidmedConsentRecordedBy: student.kidmedConsentRecordedBy
      ? {
          id: student.kidmedConsentRecordedBy.id,
          name: student.kidmedConsentRecordedBy.name,
          email: student.kidmedConsentRecordedBy.email,
        }
      : null,
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
