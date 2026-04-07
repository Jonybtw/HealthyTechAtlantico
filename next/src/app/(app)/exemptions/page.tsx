import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAnyRole } from "@/lib/auth-guard";
import ExemptionsClient from "./exemptions-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("exemptions");

  return {
    title: t("title"),
  };
}

export default async function ExemptionsPage() {
  await requireAnyRole(["ADMIN", "PROFESSOR"]);
  return <ExemptionsClient />;
}
