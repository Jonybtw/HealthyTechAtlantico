import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAnyRole } from "@/lib/auth-guard";
import AdminClient from "./admin-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");

  return {
    title: t("title"),
  };
}

/**
 * Rota: /admin
 *
 * Administração de contas internas. Permite gerir professores, psicólogos e
 * operações de segurança, como forçar redefinição de palavra-passe.
 */
export default async function AdminPage() {
  await requireAnyRole(["ADMIN"]);
  return <AdminClient />;
}
