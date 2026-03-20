import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import RelatorioClient from "./relatorio-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("relatorio");

  return {
    title: t("title"),
  };
}

export default function RelatorioPage() {
  return <RelatorioClient />;
}
