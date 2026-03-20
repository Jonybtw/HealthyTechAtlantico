import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import TestesClient from "./testes-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("testes");

  return {
    title: t("title"),
  };
}

export default function TestesPage() {
  return <TestesClient />;
}
