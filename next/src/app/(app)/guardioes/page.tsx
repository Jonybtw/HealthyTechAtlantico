import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import GuardioesClient from "./guardioes-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("guardioes");

  return {
    title: t("title"),
  };
}

export default function GuardioesPage() {
  return <GuardioesClient />;
}
