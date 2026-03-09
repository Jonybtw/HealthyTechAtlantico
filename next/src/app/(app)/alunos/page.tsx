import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { AlunosClient } from "./alunos-client";

export default async function AlunosPage() {
  const user = await requireAuth();

  if (!isStaffRole(user.role)) {
    redirect("/dashboard");
  }

  // Fetch initial students on the server
  const students = await prisma.student.findMany({
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

  return <AlunosClient initialStudents={students} />;
}
