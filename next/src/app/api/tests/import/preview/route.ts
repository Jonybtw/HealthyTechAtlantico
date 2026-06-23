import type { Prisma, Role, Sex } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  badRequest,
  forbidden,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api-response";
import {
  MAX_CSV_ROWS,
  normalizeCsvHeader,
  parseCsv,
  pickField,
  validateCsvUpload,
} from "@/lib/csv";
import { TEST_OPTIONS } from "@/lib/fitness-tests";
import { prisma } from "@/lib/prisma";
import { canRole, isStaffRole, PERMISSIONS } from "@/lib/rbac";
import { isValidDateParts } from "@/lib/student-import-helpers";

type StudentLookup =
  | { id: string; name: string; sex: Sex; birthDate: Date | null }
  | null
  | "AMBIGUOUS";

export interface TestPreviewRow {
  row: number;
  student: string;
  testId: string;
  value: string;
  date: string;
  status: "valid" | "error";
  errorMessage?: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const role = session.user.role as Role;
    if (!canRole(role, PERMISSIONS.RECORD_TESTS) || !isStaffRole(role)) {
      return forbidden();
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return badRequest("Ficheiro CSV em falta");

    const uploadError = validateCsvUpload(file);
    if (uploadError) return badRequest(uploadError);

    const text = await file.text();
    const { headers, rows } = parseCsv(text);
    if (!headers.length) return badRequest("CSV vazio");
    if (rows.length > MAX_CSV_ROWS) {
      return badRequest("CSV demasiado grande em numero de linhas (max 10000)");
    }

    const headerIndex = new Map<string, number>();
    headers.forEach((header, index) => {
      headerIndex.set(normalizeCsvHeader(header), index);
    });

    const previewRows: TestPreviewRow[] = [];
    const studentByIdCache = new Map<string, StudentLookup>();
    const studentByNameCache = new Map<string, StudentLookup>();

    for (let index = 0; index < rows.length; index += 1) {
      const rowNum = index + 1;
      const row = rows[index];

      const studentId = pickField(row, headerIndex, [
        "studentid",
        "alunoid",
        "idaluno",
      ]);
      const studentName = pickField(row, headerIndex, [
        "studentname",
        "aluno",
        "nomealuno",
        "name",
        "nome",
      ]);
      const schoolYear = pickField(row, headerIndex, [
        "schoolyear",
        "anoletivo",
        "academicyear",
        "year",
      ]);
      const className = pickField(row, headerIndex, [
        "classname",
        "class",
        "turma",
      ]);
      const testIdRaw = pickField(row, headerIndex, [
        "testid",
        "idteste",
        "teste",
      ]).toLowerCase();
      const valueText = pickField(row, headerIndex, [
        "value",
        "valuetext",
        "resultado",
        "valor",
      ]);
      const recordedAtRaw = pickField(row, headerIndex, [
        "recordedat",
        "data",
        "dateregisto",
        "createdat",
      ]);

      const displayStudent = studentName || studentId || "Em falta";
      const displayDate = recordedAtRaw || "-";

      if (!studentId && !studentName) {
        previewRows.push({
          row: rowNum,
          student: "Em falta",
          testId: testIdRaw || "-",
          value: valueText || "-",
          date: displayDate,
          status: "error",
          errorMessage: "Indique o ID ou o nome do aluno",
        });
        continue;
      }

      const testMeta = TEST_OPTIONS.find((item) => item.id === testIdRaw);
      if (!testMeta) {
        previewRows.push({
          row: rowNum,
          student: displayStudent,
          testId: testIdRaw || "Em falta",
          value: valueText || "-",
          date: displayDate,
          status: "error",
          errorMessage: "testId inválido",
        });
        continue;
      }

      if (!valueText) {
        previewRows.push({
          row: rowNum,
          student: displayStudent,
          testId: testMeta.label,
          value: "Em falta",
          date: displayDate,
          status: "error",
          errorMessage: "Valor do teste em falta",
        });
        continue;
      }

      const student = await resolveStudent({
        studentId,
        studentName,
        schoolYear,
        className,
        studentByIdCache,
        studentByNameCache,
      });

      if (!student) {
        previewRows.push({
          row: rowNum,
          student: displayStudent,
          testId: testMeta.label,
          value: valueText,
          date: displayDate,
          status: "error",
          errorMessage: "Aluno não encontrado",
        });
        continue;
      }

      if (student === "AMBIGUOUS") {
        previewRows.push({
          row: rowNum,
          student: displayStudent,
          testId: testMeta.label,
          value: valueText,
          date: displayDate,
          status: "error",
          errorMessage: "Aluno ambíguo — inclua turma/ano no CSV",
        });
        continue;
      }

      const valueNum = parseValueNum(testMeta.id, valueText);
      if (testMeta.id !== "milha" && valueNum === null) {
        previewRows.push({
          row: rowNum,
          student: student.name,
          testId: testMeta.label,
          value: valueText,
          date: displayDate,
          status: "error",
          errorMessage: "Valor inválido para teste numérico",
        });
        continue;
      }

      const recordedAt = normalizeRecordedAt(recordedAtRaw);
      if (recordedAtRaw && !recordedAt) {
        previewRows.push({
          row: rowNum,
          student: student.name,
          testId: testMeta.label,
          value: valueText,
          date: recordedAtRaw,
          status: "error",
          errorMessage: "Data inválida (use YYYY-MM-DD ou DD/MM/YYYY)",
        });
        continue;
      }

      previewRows.push({
        row: rowNum,
        student: student.name,
        testId: testMeta.label,
        value: `${valueText} ${testMeta.unit}`.trim(),
        date: recordedAtRaw || "-",
        status: "valid",
      });
    }

    const valid = previewRows.filter((r) => r.status === "valid").length;
    const errors = previewRows.filter((r) => r.status === "error").length;

    return ok({ valid, errors, rows: previewRows });
  } catch (error) {
    console.error("POST /api/tests/import/preview error:", error);
    return serverError();
  }
}

async function resolveStudent({
  studentId,
  studentName,
  schoolYear,
  className,
  studentByIdCache,
  studentByNameCache,
}: {
  studentId: string;
  studentName: string;
  schoolYear: string;
  className: string;
  studentByIdCache: Map<string, StudentLookup>;
  studentByNameCache: Map<string, StudentLookup>;
}): Promise<StudentLookup> {
  if (studentId) {
    const cached = studentByIdCache.get(studentId);
    if (cached !== undefined) return cached;
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, sex: true, birthDate: true },
    });
    const value: StudentLookup = student ?? null;
    studentByIdCache.set(studentId, value);
    return value;
  }

  const key = [
    studentName.toLowerCase(),
    schoolYear.toLowerCase(),
    className.toLowerCase(),
  ].join("::");
  const cached = studentByNameCache.get(key);
  if (cached !== undefined) return cached;

  const where: Prisma.StudentWhereInput = {
    name: { equals: studentName, mode: "insensitive" },
  };
  if (schoolYear) where.schoolYear = schoolYear;
  if (className) where.className = className;

  const matches = await prisma.student.findMany({
    where,
    take: 2,
    select: { id: true, name: true, sex: true, birthDate: true },
  });

  let value: StudentLookup = null;
  if (matches.length === 1) value = matches[0];
  else if (matches.length > 1) value = "AMBIGUOUS";

  studentByNameCache.set(key, value);
  return value;
}


function parseValueNum(testId: string, valueText: string): number | null {
  if (testId === "milha") return null;
  const normalized = valueText.replace(",", ".");
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function normalizeRecordedAt(value: string): Date | null {
  if (!value.trim()) return null;

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    if (!isValidDateParts(Number(year), Number(month), Number(day))) return null;
    return new Date(`${value}T00:00:00`);
  }

  const ptMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ptMatch) {
    const [, day, month, year] = ptMatch;
    if (!isValidDateParts(Number(year), Number(month), Number(day))) return null;
    return new Date(`${year}-${month}-${day}T00:00:00`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}
