import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAnyRole } from "@/lib/auth-guard";
import TestesClient from "./testes-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("testes");

  return {
    title: t("title"),
  };
}

/**
 * Rota: /testes
 *
 * Página de testes físicos. Permite selecionar aluno, consultar resultados
 * recentes e gravar novos testes definidos em src/lib/fitness-tests.ts.
 */
export default async function TestesPage() {
  await requireAnyRole(["ADMIN", "PROFESSOR"]);
  return <TestesClient />;
}
