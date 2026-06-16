import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAnyRole } from "@/lib/auth-guard";
import BiometriaClient from "./biometria-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("biometria");

  return {
    title: t("title"),
  };
}

/**
 * Rota: /biometria
 *
 * Página de registo e consulta de medições biométricas. Apenas admin e
 * professor podem aceder, porque aqui são gravados dados físicos dos alunos.
 */
export default async function BiometriaPage() {
  await requireAnyRole(["ADMIN", "PROFESSOR"]);
  return <BiometriaClient />;
}
