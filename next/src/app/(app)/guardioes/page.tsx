import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAnyRole } from "@/lib/auth-guard";
import GuardioesClient from "./guardioes-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("guardioes");

  return {
    title: t("title"),
  };
}

/**
 * Rota: /guardioes
 *
 * Página de associação entre alunos e encarregados de educação. Uma associação
 * errada pode expor dados pessoais, por isso o acesso fica limitado a staff.
 */
export default async function GuardioesPage() {
  await requireAnyRole(["ADMIN", "PROFESSOR"]);
  return <GuardioesClient />;
}
