import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ClientOnly } from "@/components/client-only";
import ChangePasswordClient from "./change-password-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("changePasswordPage");

  return {
    title: t("title"),
  };
}

export default function ChangePasswordPage() {
  return (
    <ClientOnly>
      <ChangePasswordClient />
    </ClientOnly>
  );
}
