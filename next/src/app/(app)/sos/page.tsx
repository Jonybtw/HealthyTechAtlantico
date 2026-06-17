import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAnyRole } from "@/lib/auth-guard";
import SosClient from "./sos-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sos");

  return {
    title: t("title"),
  };
}

/**
 * Rota: /sos
 *
 * Página de alertas SOS. Alunos podem criar pedidos de acompanhamento; staff
 * autorizado pode consultar e resolver alertas conforme permissões.
 */
export default async function SosPage() {
  await requireAnyRole(["ADMIN", "PROFESSOR", "ALUNO", "PSICOLOGO"]);
  return <SosClient />;
}
