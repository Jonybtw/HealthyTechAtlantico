import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function AppNotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="label-micro text-muted-foreground">
        {t("eyebrow")}
      </p>
      <h1 className="font-display text-3xl font-bold tracking-tight text-navy-950 dark:text-white">
        {t("title")}
      </h1>
      <p className="max-w-md text-sm text-navy-700 dark:text-navy-200">
        {t("description")}
      </p>
      <Button asChild variant="primary" size="sm">
        <Link href="/dashboard">{t("backToDashboard")}</Link>
      </Button>
    </div>
  );
}
