import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PerfilClient from "./perfil-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("perfil");

  return {
    title: t("title"),
  };
}

export default function PerfilPage() {
  return <PerfilClient />;
}
