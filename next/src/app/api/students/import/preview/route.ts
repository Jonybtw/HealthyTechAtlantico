import { z } from "zod";
import type { Role } from "@prisma/client";
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
import { canRole, isStaffRole, PERMISSIONS } from "@/lib/rbac";
import { createStudentSchema } from "@/lib/validations";
import {
  normalizeAgeField,
  normalizeDateField,
  parseSex,
} from "@/lib/student-import-helpers";

export interface PreviewRow {
  row: number;
  name: string;
  dob: string;
  sex: string;
  className: string;
  status: "valid" | "error";
  errorMessage?: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const role = session.user.role as Role;
    if (!canRole(role, PERMISSIONS.CREATE_STUDENT) || !isStaffRole(role)) {
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

    const previewRows: PreviewRow[] = [];

    rows.forEach((row, index) => {
      const rowNum = index + 1;

      const name = pickField(row, headerIndex, ["name", "nome"]);
      const rawSex = pickField(row, headerIndex, ["sex", "sexo", "gender"]);
      const birthDateRaw = pickField(row, headerIndex, [
        "birthdate",
        "dataNascimento",
        "datanascimento",
        "dob",
      ]);
      const ageRaw = pickField(row, headerIndex, ["age", "idade"]);
      const className = pickField(row, headerIndex, [
        "classname",
        "class",
        "turma",
      ]);

      const displayDob = birthDateRaw || ageRaw || "-";
      const displaySex = rawSex || "-";
      const displayClass = className || "-";

      try {
        if (!name) {
          previewRows.push({
            row: rowNum,
            name: "Em falta",
            dob: displayDob,
            sex: displaySex,
            className: displayClass,
            status: "error",
            errorMessage: "Nome em falta",
          });
          return;
        }

        const sex = parseSex(rawSex);
        if (!sex) {
          previewRows.push({
            row: rowNum,
            name,
            dob: displayDob,
            sex: rawSex || "Em falta",
            className: displayClass,
            status: "error",
            errorMessage: "Sexo inválido (use M/F)",
          });
          return;
        }

        const normalizedBirthDate = normalizeDateField(birthDateRaw);
        if (birthDateRaw && !normalizedBirthDate) {
          previewRows.push({
            row: rowNum,
            name,
            dob: birthDateRaw,
            sex: displaySex,
            className: displayClass,
            status: "error",
            errorMessage: "Data inválida (use YYYY-MM-DD ou DD/MM/YYYY)",
          });
          return;
        }

        const normalizedAge = normalizeAgeField(ageRaw);
        if (ageRaw && normalizedAge === null) {
          previewRows.push({
            row: rowNum,
            name,
            dob: ageRaw,
            sex: displaySex,
            className: displayClass,
            status: "error",
            errorMessage: "Idade inválida",
          });
          return;
        }

        createStudentSchema.parse({
          name,
          sex,
          birthDate: normalizedBirthDate ?? undefined,
          age: normalizedAge ?? undefined,
          className: className || undefined,
        });

        previewRows.push({
          row: rowNum,
          name,
          dob: normalizedBirthDate ?? (ageRaw ? `${ageRaw} anos` : "-"),
          sex,
          className: className || "-",
          status: "valid",
        });
      } catch (error) {
        const message =
          error instanceof z.ZodError
            ? (error.issues[0]?.message ?? "Linha inválida")
            : "Linha inválida";
        previewRows.push({
          row: rowNum,
          name: name || "-",
          dob: displayDob,
          sex: displaySex,
          className: displayClass,
          status: "error",
          errorMessage: message,
        });
      }
    });

    const valid = previewRows.filter((r) => r.status === "valid").length;
    const errors = previewRows.filter((r) => r.status === "error").length;

    return ok({ valid, errors, rows: previewRows });
  } catch (error) {
    console.error("POST /api/students/import/preview error:", error);
    return serverError();
  }
}

