"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/rbac";
import { createStudentSchema } from "@/lib/validations";

type CreateStudentActionState =
  | { error: string; success?: false }
  | { success: true; error?: undefined }
  | null;

export async function createStudentAction(
  _prevState: CreateStudentActionState,
  formData: FormData,
): Promise<CreateStudentActionState> {
  try {
    // Centralised auth + permission check — throws if unauthenticated or unauthorised
    const user = await requirePermission(PERMISSIONS.CREATE_STUDENT);

    const payload = {
      name: String(formData.get("name") ?? ""),
      sex: String(formData.get("sex") ?? ""),
      birthDate: String(formData.get("birthDate") ?? ""),
      className: String(formData.get("className") ?? ""),
      processNumber: String(formData.get("processNumber") ?? ""),
    };

    const data = createStudentSchema.parse(payload);

    await prisma.student.create({
      data: {
        name: data.name,
        sex: data.sex,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        className: data.className || null,
        processNumber: data.processNumber || null,
        createdById: user.id,
      },
    });

    revalidatePath("/alunos");
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") return { error: "Sem permissão" };
      if (error.name === "ZodError") return { error: "Dados inválidos" };
    }
    console.error("createStudentAction error:", error);
    return { error: "Erro interno ao criar aluno." };
  }
}
