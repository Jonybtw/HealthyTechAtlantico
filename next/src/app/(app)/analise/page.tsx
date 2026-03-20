import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AnaliseClient from "./analise-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("analise");

  return {
    title: t("title"),
  };
}

export default function AnalisePage() {
  return <AnaliseClient />;
}
