"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Bell, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSosAlerts } from "@/hooks/use-queries";
import { useIsClient } from "@/hooks/use-is-client";

interface NotificationCenterProps {
  userRole: string;
}

export function NotificationCenter({ userRole }: NotificationCenterProps) {
  const t = useTranslations("notifications");
  const isStaff = ["ADMIN", "PROFESSOR", "PSICOLOGO"].includes(userRole);
  const isClient = useIsClient();

  const { data: sosAlerts = [] } = useSosAlerts({
    enabled: isStaff,
    refetchInterval: 60_000,
  });

  const pendingCount = sosAlerts.filter(
    (a: { resolved: boolean }) => !a.resolved,
  ).length;

  const [seenCount, setSeenCount] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }
    const stored = localStorage.getItem("ht-notif-seen-count");
    return stored ? Number.parseInt(stored, 10) || 0 : 0;
  });

  const markAllSeen = useCallback(() => {
    setSeenCount(pendingCount);
    localStorage.setItem("ht-notif-seen-count", String(pendingCount));
  }, [pendingCount]);

  if (!isStaff || !isClient) return null;

  const unreadCount = Math.max(0, pendingCount - seenCount);

  return (
    <Popover onOpenChange={(open) => { if (open) markAllSeen(); }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-lg"
          aria-label={t("bellLabel")}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-danger-600 text-[9px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(320px,calc(100vw-2rem))] p-0">
        <div className="border-b border-border px-3 py-2.5">
          <h3 className="text-xs font-semibold">{t("title")}</h3>
        </div>
        <div className="max-h-[260px] overflow-y-auto p-2">
          {pendingCount === 0 ? (
            <div className="flex flex-col items-center gap-2 py-5 text-center">
              <CheckCircle2 className="size-6 text-success-500" />
              <p className="text-xs text-muted-foreground">{t("allClear")}</p>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-lg bg-danger-50/70 dark:bg-danger-950/20 p-2.5 border border-danger-200/60 dark:border-danger-900/30">
              <AlertTriangle className="size-4 text-danger-600 dark:text-danger-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-danger-700 dark:text-danger-300">
                  {t("pendingAlerts", { count: pendingCount })}
                </p>
                <p className="text-[11px] text-danger-600/80 dark:text-danger-400/70 mt-1">
                  {t("pendingDescription")}
                </p>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
