import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { AlunosClient } from "./alunos-client";
import type { Role } from "@prisma/client";

export default async function AlunosPage() {
  const user = await requireAuth();

  // Guard access based on permissions if needed, though most roles can view students.
  // ALUNOS see themselves, PAIS see their kids, PROFESSOR/PSICOLOGO see all.
  if (!canRole(user.role as Role, PERMISSIONS.LIST_STUDENTS)) {
    redirect("/dashboard");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (user.role === "ALUNO") {
    where.userId = user.id;
  } else if (user.role === "PAIS") {
    where.guardians = {
      some: { guardianUserId: user.id },
    };
  }

  // Fetch initial students on the server
  const students = await prisma.student.findMany({
    where,
    orderBy: { name: "asc" },
    take: 500, // Safe upper limit for now
    select: {
      id: true,
      name: true,
      sex: true,
      birthDate: true,
      className: true,
      schoolYear: true,
    },
  });

  return <AlunosClient initialStudents={students as any} />;
}
