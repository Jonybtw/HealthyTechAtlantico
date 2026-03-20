import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import DispensasClient from "./dispensas-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dispensas");

  return {
    title: t("title"),
  };
}

export default function DispensasPage() {
  return <DispensasClient />;
}
