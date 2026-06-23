import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  badRequest,
  forbidden,
  ok,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api-response";
import {
  MAX_CSV_ROWS,
  normalizeCsvHeader,
  parseCsv,
  pickField,
  validateCsvUpload,
} from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { canRole, isStaffRole, PERMISSIONS } from "@/lib/rbac";

interface ImportIssue {
  line: number;
  message: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const role = session.user.role as Role;
    if (!canRole(role, PERMISSIONS.READ_CLASS_REPORTS) || !isStaffRole(role)) {
      return forbidden();
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return badRequest("Ficheiro CSV em falta");
    }

    const uploadError = validateCsvUpload(file);
    if (uploadError) {
      return badRequest(uploadError);
    }

    const text = await file.text();
    const { headers, rows } = parseCsv(text);
    if (!headers.length) {
      return badRequest("CSV vazio");
    }
    if (rows.length > MAX_CSV_ROWS) {
      return badRequest("CSV demasiado grande em numero de linhas (max 10000)");
    }

    const headerIndex = new Map<string, number>();
    headers.forEach((header, index) => {
      headerIndex.set(normalizeCsvHeader(header), index);
    });

    const issues: ImportIssue[] = [];
    const validRows: { academicYear: string; className: string }[] = [];

    rows.forEach((row, index) => {
      const line = index + 2;
      const academicYear = pickField(row, headerIndex, [
        "academicyear",
        "anoletivo",
        "schoolyear",
        "year",
        "ano",
      ]);
      const className = pickField(row, headerIndex, [
        "classname",
        "class",
        "turma",
      ]);

      if (!academicYear) {
        issues.push({ line, message: "Ano letivo em falta" });
        return;
      }
      if (!className) {
        issues.push({ line, message: "Turma em falta" });
        return;
      }

      validRows.push({
        academicYear: academicYear.trim(),
        className: className.trim(),
      });
    });

    if (validRows.length === 0) {
      return validationError(issues, "Nenhuma linha valida para importar");
    }

    const uniqueYears = Array.from(
      new Set(validRows.map((row) => row.academicYear)),
    );

    const createdYears = await prisma.academicYear.createMany({
      data: uniqueYears.map((label) => ({ label })),
      skipDuplicates: true,
    });

    const years = await prisma.academicYear.findMany({
      where: { label: { in: uniqueYears } },
      select: { id: true, label: true },
    });

    const yearIdByLabel = new Map(years.map((year) => [year.label, year.id]));
    const uniqueClassPairs = new Set<string>();
    const classData: { academicYearId: string; name: string }[] = [];

    for (const row of validRows) {
      const academicYearId = yearIdByLabel.get(row.academicYear);
      if (!academicYearId) {
        continue;
      }

      const key = `${academicYearId}::${row.className}`;
      if (uniqueClassPairs.has(key)) {
        continue;
      }
      uniqueClassPairs.add(key);
      classData.push({
        academicYearId,
        name: row.className,
      });
    }

    const createdClasses = classData.length
      ? await prisma.schoolClass.createMany({
          data: classData,
          skipDuplicates: true,
        })
      : { count: 0 };

    return ok({
      createdAcademicYears: createdYears.count,
      createdClasses: createdClasses.count,
      failed: issues.length,
      issues,
    });
  } catch (error) {
    console.error("POST /api/classes/import error:", error);
    return serverError();
  }
}

