import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import BiometriaClient from "./biometria-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("biometria");

  return {
    title: t("title"),
  };
}

export default function BiometriaPage() {
  return <BiometriaClient />;
}
