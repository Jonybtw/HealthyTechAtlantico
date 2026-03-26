import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAnyRole } from "@/lib/auth-guard";
import QuestionariosClient from "./questionarios-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("questionarios");

  return {
    title: t("title"),
  };
}

export default async function QuestionariosPage() {
  await requireAnyRole(["ALUNO"]);
  return <QuestionariosClient />;
}
