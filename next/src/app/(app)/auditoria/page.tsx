import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AuditoriaClient from "./auditoria-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auditoria");

  return {
    title: t("title"),
  };
}

export default function AuditoriaPage() {
  return <AuditoriaClient />;
}
