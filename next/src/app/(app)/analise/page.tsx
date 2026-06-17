import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAnyRole } from "@/lib/auth-guard";
import AnaliseClient from "./analise-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("analise");

  return {
    title: t("title"),
  };
}

/**
 * Rota: /analise
 *
 * Área de análise para admin e professor. Cruza alunos, biometria, testes e
 * relatórios por turma para apoiar leitura agregada dos indicadores.
 */
export default async function AnalisePage() {
  await requireAnyRole(["ADMIN", "PROFESSOR"]);
  return <AnaliseClient />;
}
