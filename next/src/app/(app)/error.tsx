"use client";

// Página de erro das rotas autenticadas.
// Mostra uma mensagem segura ao utilizador e mantém detalhes técnicos nos logs.

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      console.error("[AppError]", error);
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" />
      </div>

      <div className="flex flex-col gap-2 max-w-md">
        <h2 className="text-xl font-semibold text-foreground">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono">
            {t("reference")}: {error.digest}
          </p>
        )}
      </div>

      <Button onClick={reset} variant="outline">
        {t("retry")}
      </Button>
    </div>
  );
}
