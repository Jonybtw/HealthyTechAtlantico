import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ClientOnly } from "@/components/client-only";
import StudentRegisterClient from "./student-register-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("registerStudent");

  return {
    title: t("title"),
  };
}

/**
 * Rota: /register/student
 *
 * Registo público de aluno. O formulário cliente recolhe dados da conta,
 * número de processo e consentimento RGPD antes de chamar a API de registo.
 */
export default function StudentRegisterPage() {
  return (
    <ClientOnly>
      <StudentRegisterClient />
    </ClientOnly>
  );
}
