import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Server-side helper for the `/turma` page. Returns the same payload
 * shape as `GET /api/classes/report?classId=...` but executed via a
 * direct Prisma call (no HTTP round-trip from the server component).
 *
 * RSC migration step: lets the server component pass the initial
 * class list + selected-class report to `TurmaClient` as props,
 * avoiding the first-paint client fetch and the loading skeleton.
 *
 * Returns `null` if the class doesn't exist or the user lacks the
 * `READ_CLASS_REPORTS` permission — callers should treat that as
 * "no initial data" and let the client component re-fetch.
 */
export interface ClassReportRow {
  id: string;
  name: string;
  sex: string;
  className: string | null;
  processNumber: string | null;
  birthDate: Date | null;
  latestBiometric: {
    id: string;
    studentId: string;
    recordedAt: Date;
    heightM: number;
    weightKg: number;
    imc: number;
    imcZone: string;
    fatPct: number | null;
    waistCm: number | null;
  } | null;
  testCount: number;
}

export async function getClassReport(classId: string): Promise<ClassReportRow[]> {
  if (!classId) return [];

  const schoolClass = await prisma.schoolClass.findUnique({
    where: { id: classId },
    include: { academicYear: { select: { label: true } } },
  });
  if (!schoolClass) return [];

  const students = await prisma.student.findMany({
    where: {
      schoolYear: schoolClass.academicYear.label,
      className: schoolClass.name,
    },
    orderBy: [{ className: "asc" }, { name: "asc" }],
    include: {
      biometrics: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
      tests: {
        orderBy: { recordedAt: "desc" },
      },
    },
  });

  return students.map((student) => {
    const bio = student.biometrics[0];
    return {
      id: student.id,
      name: student.name,
      sex: student.sex,
      className: student.className,
      processNumber: student.processNumber,
      birthDate: student.birthDate,
      latestBiometric: bio
        ? {
            id: bio.id,
            studentId: bio.studentId,
            recordedAt: bio.recordedAt,
            heightM: Number(bio.heightM),
            weightKg: Number(bio.weightKg),
            imc: Number(bio.imc),
            imcZone: bio.imcZone,
            fatPct: bio.fatPct ? Number(bio.fatPct) : null,
            waistCm: bio.waistCm ? Number(bio.waistCm) : null,
          }
        : null,
      testCount: student.tests.length,
    };
  });
}

export interface ClassOption {
  id: string;
  name: string;
  year: string;
  studentCount: number;
}

export async function getClassOptions(): Promise<ClassOption[]> {
  const classes = await prisma.schoolClass.findMany({
    orderBy: [{ academicYear: { label: "desc" } }, { name: "asc" }],
    include: {
      academicYear: { select: { label: true } },
    },
  });
  return classes.map((entry) => ({
    id: entry.id,
    name: entry.name,
    year: entry.academicYear.label,
    studentCount: 0, // populated on the client via the report
  }));
}
