import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ClientOnly } from "@/components/client-only";
import GuardianRegisterClient from "./guardian-register-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("registerGuardian");

  return {
    title: t("title"),
  };
}

/**
 * Rota: /register/guardian
 *
 * Registo público de encarregado de educação. A associação ao aluno é feita a
 * partir do número de processo, por isso este fluxo deve continuar separado do
 * registo de aluno.
 */
export default function GuardianRegisterPage() {
  return (
    <ClientOnly>
      <GuardianRegisterClient />
    </ClientOnly>
  );
}
