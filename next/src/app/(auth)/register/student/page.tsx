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

export default function StudentRegisterPage() {
  return (
    <ClientOnly>
      <StudentRegisterClient />
    </ClientOnly>
  );
}
