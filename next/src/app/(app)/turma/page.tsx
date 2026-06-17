import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAnyRole } from "@/lib/auth-guard";
import { canRole, PERMISSIONS } from "@/lib/rbac";
import { getClassOptions, getClassReport } from "@/lib/class-report";
import TurmaClient from "./turma-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("turma");

  return {
    title: t("title"),
  };
}

export default async function TurmaPage(props: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const user = await requireAnyRole(["ADMIN", "PROFESSOR", "PSICOLOGO"]);
  const canViewClassReports = canRole(user.role, PERMISSIONS.READ_CLASS_REPORTS);

  const searchParams = await props.searchParams;
  const classId = typeof searchParams.classId === "string" ? searchParams.classId : undefined;

  const [classes, initialReport] = await Promise.all([
    canViewClassReports ? getClassOptions() : Promise.resolve([]),
    canViewClassReports && classId
      ? getClassReport(classId).catch(() => [])
      : Promise.resolve([]),
  ]);

  return (
    <TurmaClient
      initialClasses={canViewClassReports ? classes : []}
      initialClassId={classId}
      initialReport={canViewClassReports && classId ? initialReport : []}
    />
  );
}
