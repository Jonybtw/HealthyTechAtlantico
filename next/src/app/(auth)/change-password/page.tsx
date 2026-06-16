import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ClientOnly } from "@/components/client-only";
import ChangePasswordClient from "./change-password-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("changePasswordPage");

  return {
    title: t("title"),
  };
}

/**
 * Rota: /change-password
 *
 * Página de alteração de palavra-passe. É usada tanto no fluxo público como no
 * fluxo obrigatório, quando o utilizador precisa trocar a palavra-passe antes
 * de entrar na aplicação.
 */
export default function ChangePasswordPage() {
  return (
    <ClientOnly>
      <ChangePasswordClient />
    </ClientOnly>
  );
}
