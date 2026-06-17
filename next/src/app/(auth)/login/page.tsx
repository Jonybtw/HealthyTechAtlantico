import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ClientOnly } from "@/components/client-only";
import LoginClient from "./login-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");

  return {
    title: t("login"),
  };
}

/**
 * Rota: /login
 *
 * Página pública de autenticação. Renderiza o formulário cliente responsável
 * por iniciar sessão com NextAuth e apresentar feedback de erro ao utilizador.
 */
export default function LoginPage() {
  return (
    <ClientOnly>
      <LoginClient />
    </ClientOnly>
  );
}
