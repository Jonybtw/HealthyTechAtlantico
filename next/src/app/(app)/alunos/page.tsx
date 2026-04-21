import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { AlunosClient } from "@/app/(app)/alunos/alunos-client";
import { canRole, isStaffRole, PERMISSIONS } from "@/lib/rbac";

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
  const className = (resolvedParams.class_name as string) || "";
  const schoolYear = (resolvedParams.school_year as string) || "";

  return (
    <AlunosClient 
      currentPage={page}
      searchQuery={search}
      classNameQuery={className}
      schoolYearQuery={schoolYear}
    />
  );
}
