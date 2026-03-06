"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import { createStudentSchema } from "@/lib/validations";
import type { Role } from "@prisma/client";

export async function createStudentAction(prevState: any, formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Não autenticado" };
        }

        if (!canRole(session.user.role as Role, PERMISSIONS.CREATE_STUDENT)) {
            return { error: "Sem permissão" };
        }

        const payload = {
            name: formData.get("name") as string,
            sex: formData.get("sex") as string,
            birthDate: formData.get("birthDate") as string,
            className: formData.get("className") as string,
        };

        const data = createStudentSchema.parse(payload);

        const userId = session.user.id;

        await prisma.student.create({
            data: {
                userId,
                name: data.name,
                sex: data.sex as any,
                birthDate: data.birthDate ? new Date(data.birthDate) : null,
                className: data.className || null,
                // Optional age/schoolYear calculations can be added or passed from frontend later
            },
        });

        revalidatePath("/alunos");
        return { success: true };
    } catch (error: any) {
        if (error.name === "ZodError") {
            return { error: error.errors[0]?.message || "Dados inválidos" };
        }
        console.error("createStudentAction error:", error);
        return { error: "Erro interno ao criar aluno." };
    }
}
