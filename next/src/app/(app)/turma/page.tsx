import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAnyRole } from "@/lib/auth-guard";
import TurmaClient from "./turma-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("turma");

  return {
    title: t("title"),
  };
}

/**
 * Rota: /turma
 *
 * Página de gestão e consulta de turmas. Suporta importação de turmas, criação
 * de alunos em contexto de turma e exportação de relatórios por classe.
 */
export default async function TurmaPage() {
  await requireAnyRole(["ADMIN", "PROFESSOR", "PSICOLOGO"]);
  return <TurmaClient />;
}
