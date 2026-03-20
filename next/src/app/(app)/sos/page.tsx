import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SosClient from "./sos-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sos");

  return {
    title: t("title"),
  };
}

export default function SosPage() {
  return <SosClient />;
}
