import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth-guard";
import PerfilClient from "./perfil-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("perfil");

  return {
    title: t("title"),
  };
}

/**
 * Rota: /perfil
 *
 * Página de conta do utilizador autenticado. O componente cliente trata a
 * atualização de consentimentos e a alteração de palavra-passe através das
 * APIs do utilizador atual.
 */
export default async function PerfilPage() {
  await requireAuth();
  return <PerfilClient />;
}
