import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAnyRole } from "@/lib/auth-guard";
import AnaliseClient from "./analise-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("analise");

  return {
    title: t("title"),
  };
}

export default async function AnalisePage() {
  await requireAnyRole(["ADMIN", "PROFESSOR"]);
  return <AnaliseClient />;
}
