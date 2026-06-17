import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAnyRole } from "@/lib/auth-guard";
import DispensasClient from "./dispensas-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("exemptions");

  return {
    title: t("title"),
  };
}

/**
 * Rota: /dispensas
 *
 * Página de dispensas médicas ou limitações temporárias. Está limitada a admin
 * e professor por poder conter informação clínica ou sensível.
 */
export default async function DispensasPage() {
  await requireAnyRole(["ADMIN", "PROFESSOR"]);
  return <DispensasClient />;
}
