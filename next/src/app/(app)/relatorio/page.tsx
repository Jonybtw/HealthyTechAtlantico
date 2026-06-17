import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAnyRole } from "@/lib/auth-guard";
import RelatorioClient from "./relatorio-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("relatorio");

  return {
    title: t("title"),
  };
}

/**
 * Rota: /relatorio
 *
 * Página de relatórios individuais. Reúne dados de aluno, biometria e testes
 * para gerar PDF e, quando o perfil permite, enviar por email institucional.
 */
export default async function RelatorioPage() {
  await requireAnyRole(["ADMIN", "PROFESSOR", "ALUNO", "PAIS"]);
  return <RelatorioClient />;
}
