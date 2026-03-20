import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import TurmaClient from "./turma-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("turma");

  return {
    title: t("title"),
  };
}

export default function TurmaPage() {
  return <TurmaClient />;
}
