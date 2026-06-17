import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAnyRole } from "@/lib/auth-guard";
import AuditoriaClient from "./auditoria-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auditoria");

  return {
    title: t("title"),
  };
}

/**
 * Rota: /auditoria
 *
 * Consulta dos registos de auditoria. Apenas administradores devem aceder,
 * porque a página revela ações realizadas por utilizadores da plataforma.
 */
export default async function AuditoriaPage() {
  await requireAnyRole(["ADMIN"]);
  return <AuditoriaClient />;
}
