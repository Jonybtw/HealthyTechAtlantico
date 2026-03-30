import { z } from "zod";
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
  validateCsvUpload,
} from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { canRole, isStaffRole, PERMISSIONS } from "@/lib/rbac";
import { createStudentSchema } from "@/lib/validations";

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
    if (!canRole(role, PERMISSIONS.CREATE_STUDENT) || !isStaffRole(role)) {
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
    const toCreate: {
      name: string;
      sex: "M" | "F";
      birthDate: Date | null;
      age: number | null;
      schoolYear: string | null;
      className: string | null;
      createdById: string;
    }[] = [];

    rows.forEach((row, index) => {
      const line = index + 2;

      try {
        const name = pickField(row, headerIndex, ["name", "nome"]);
        const rawSex = pickField(row, headerIndex, ["sex", "sexo"]);
        const birthDateRaw = pickField(row, headerIndex, [
          "birthdate",
          "dataNascimento",
          "datanascimento",
          "dob",
        ]);
        const ageRaw = pickField(row, headerIndex, ["age", "idade"]);
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

        if (!name) {
          issues.push({ line, message: "Nome em falta" });
          return;
        }

        const sex = parseSex(rawSex);
        if (!sex) {
          issues.push({ line, message: "Sexo invalido (use M/F)" });
          return;
        }

        const normalizedBirthDate = normalizeDateField(birthDateRaw);
        if (birthDateRaw && !normalizedBirthDate) {
          issues.push({
            line,
            message: "Data invalida (use YYYY-MM-DD ou DD/MM/YYYY)",
          });
          return;
        }

        const normalizedAge = normalizeAgeField(ageRaw);
        if (ageRaw && normalizedAge === null) {
          issues.push({ line, message: "Idade invalida" });
          return;
        }

        const parsed = createStudentSchema.parse({
          name,
          sex,
          birthDate: normalizedBirthDate ?? undefined,
          age: normalizedAge ?? undefined,
          schoolYear: schoolYear || undefined,
          className: className || undefined,
        });

        toCreate.push({
          name: parsed.name,
          sex: parsed.sex,
          birthDate: parsed.birthDate ? new Date(parsed.birthDate) : null,
          age: parsed.age ?? null,
          schoolYear: parsed.schoolYear?.trim() || null,
          className: parsed.className?.trim() || null,
          createdById: session.user.id,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          issues.push({
            line,
            message: error.issues[0]?.message ?? "Linha invalida",
          });
          return;
        }

        issues.push({ line, message: "Linha invalida" });
      }
    });

    if (toCreate.length === 0) {
      return validationError(issues, "Nenhuma linha valida para importar");
    }

    const result = await prisma.student.createMany({
      data: toCreate,
    });

    return ok({
      created: result.count,
      failed: issues.length,
      issues,
    });
  } catch (error) {
    console.error("POST /api/students/import error:", error);
    return serverError();
  }
}

function pickField(
  row: string[],
  headerIndex: Map<string, number>,
  aliases: string[],
): string {
  for (const alias of aliases) {
    const index = headerIndex.get(normalizeCsvHeader(alias));
    if (index === undefined) {
      continue;
    }
    return (row[index] ?? "").trim();
  }
  return "";
}

function parseSex(value: string): "M" | "F" | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (["m", "male", "masculino"].includes(normalized)) {
    return "M";
  }
  if (["f", "female", "feminino"].includes(normalized)) {
    return "F";
  }
  return null;
}

function normalizeDateField(value: string): string | null {
  if (!value.trim()) {
    return null;
  }

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    if (!isValidDateParts(Number(year), Number(month), Number(day))) {
      return null;
    }
    return value;
  }

  const ptMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ptMatch) {
    const [, day, month, year] = ptMatch;
    if (!isValidDateParts(Number(year), Number(month), Number(day))) {
      return null;
    }
    return `${year}-${month}-${day}`;
  }

  return null;
}

function normalizeAgeField(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const age = Number(value);
  if (!Number.isInteger(age)) {
    return null;
  }
  return age;
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
