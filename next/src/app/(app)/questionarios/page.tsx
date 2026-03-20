import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import QuestionariosClient from "./questionarios-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("questionarios");

  return {
    title: t("title"),
  };
}

export default function QuestionariosPage() {
  return <QuestionariosClient />;
}
