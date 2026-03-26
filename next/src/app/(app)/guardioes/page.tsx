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

export default async function GuardioesPage() {
  await requireAnyRole(["ADMIN", "PROFESSOR"]);
  return <GuardioesClient />;
}
