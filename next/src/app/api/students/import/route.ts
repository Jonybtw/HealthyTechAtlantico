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
  pickField,
  validateCsvUpload,
} from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { canRole, isStaffRole, PERMISSIONS } from "@/lib/rbac";
import { createStudentSchema } from "@/lib/validations";
import {
  normalizeAgeField,
  normalizeDateField,
  parseSex,
} from "@/lib/student-import-helpers";

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
      processNumber: string | null;
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
        const processNumber = pickField(row, headerIndex, [
          "processnumber",
          "numeroprocesso",
          "processo",
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
          processNumber: processNumber || undefined,
        });

        toCreate.push({
          name: parsed.name,
          sex: parsed.sex,
          birthDate: parsed.birthDate ? new Date(parsed.birthDate) : null,
          age: parsed.age ?? null,
          schoolYear: parsed.schoolYear?.trim() || null,
          className: parsed.className?.trim() || null,
          processNumber: parsed.processNumber?.trim() || null,
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

