import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAnyRole } from "@/lib/auth-guard";
import QuestionariosClient from "./questionarios-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("questionarios");

  return {
    title: t("title"),
  };
}

/**
 * Rota: /questionarios
 *
 * Página de resposta a questionários. Está limitada ao perfil ALUNO e usa as
 * definições de src/lib/questionnaires.ts para decidir perguntas, histórico,
 * consentimento KIDMED e apresentação dos resultados.
 */
export default async function QuestionariosPage() {
  await requireAnyRole(["ALUNO"]);
  return <QuestionariosClient />;
}
