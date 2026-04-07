import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { AlunosClient } from "./alunos-client";
import { canRole, PERMISSIONS } from "@/lib/rbac";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("alunos");

  return {
    title: t("title"),
  };
}

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AlunosPage({ searchParams }: Props) {
  const user = await requireAuth();

  // Allow either staff roles or any role (e.g. Psicologo) that has explicit permission
  if (!isStaffRole(user.role) && !canRole(user.role, PERMISSIONS.LIST_STUDENTS)) {
    redirect("/dashboard");
  }

  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page as string, 10) || 1;
  const search = (resolvedParams.search as string) || "";
  const pageSize = 15;

  const whereCondition = search
    ? { name: { contains: search, mode: "insensitive" as const } }
    : {};

  const totalStudents = await prisma.student.count({ where: whereCondition });

  const students = await prisma.student.findMany({
    where: whereCondition,
    orderBy: { name: "asc" },
    take: pageSize, 
    skip: (page - 1) * pageSize,
    select: {
      id: true,
      name: true,
      sex: true,
      birthDate: true,
      className: true,
      schoolYear: true,
    },
  });

  return (
    <AlunosClient 
      initialStudents={students} 
      totalStudents={totalStudents}
      currentPage={page}
    />
  );
}
