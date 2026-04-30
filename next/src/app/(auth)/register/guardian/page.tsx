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

export default function GuardianRegisterPage() {
  return (
    <ClientOnly>
      <GuardianRegisterClient />
    </ClientOnly>
  );
}
