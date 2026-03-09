"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canRole, isStaffRole, PERMISSIONS } from "@/lib/rbac";
import { createStudentSchema } from "@/lib/validations";
import type { Role } from "@prisma/client";

type CreateStudentActionState =
  | { error: string; success?: false }
  | { success: true; error?: undefined }
  | null;

export async function createStudentAction(
  _prevState: CreateStudentActionState,
  formData: FormData
): Promise<CreateStudentActionState> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Não autenticado" };
        }

        const role = session.user.role as Role;
        if (!canRole(role, PERMISSIONS.CREATE_STUDENT) || !isStaffRole(role)) {
            return { error: "Sem permissão" };
        }

        const payload = {
            name: formData.get("name") as string,
            sex: formData.get("sex") as string,
            birthDate: formData.get("birthDate") as string,
            className: formData.get("className") as string,
        };

        const data = createStudentSchema.parse(payload);

        await prisma.student.create({
            data: {
                name: data.name,
                sex: data.sex,
                birthDate: data.birthDate ? new Date(data.birthDate) : null,
                className: data.className || null,
                createdById: session.user.id,
                // Optional age/schoolYear calculations can be added or passed from frontend later
            },
        });

        revalidatePath("/alunos");
        return { success: true };
    } catch (error: unknown) {
        if (error instanceof Error && error.name === "ZodError") {
            return { error: "Dados inválidos" };
        }
        console.error("createStudentAction error:", error);
        return { error: "Erro interno ao criar aluno." };
    }
}
