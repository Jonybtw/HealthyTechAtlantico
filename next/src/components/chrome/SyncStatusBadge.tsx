"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Cloud, CloudOff } from "lucide-react";
import { useSyncStatus } from "@/contexts/sync-context";
import { cn } from "@/lib/utils";

export function SyncStatusBadge() {
  const t = useTranslations("common");
  const { isOnline, draftCount, isSyncing } = useSyncStatus();
  const pending = draftCount > 0 || !isOnline;

  const label = useMemo(() => {
    if (pending) {
      return draftCount > 0 ? `${draftCount} pending` : "Offline";
    }
    return "Synced";
  }, [pending, draftCount]);

  return (
    <div
      className={cn(
        "hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-300 sm:flex",
        pending
          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"
          : "border-success-200 bg-success-50 text-success-700 dark:border-success-400/20 dark:bg-success-400/10 dark:text-success-300",
      )}
      role="status"
      aria-live="polite"
    >
      {pending ? (
        <CloudOff className={cn("size-3.5", isSyncing && "animate-pulse")} />
      ) : (
        <Cloud className="size-3.5" />
      )}
      <span className="whitespace-nowrap">{label}</span>
      <span className="sr-only">{t("syncStatus")}</span>
    </div>
  );
}
