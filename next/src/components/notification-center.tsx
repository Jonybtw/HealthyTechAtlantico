"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Bell, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <Popover
      onOpenChange={(open) => {
        if (open) markAllSeen();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-lg"
          aria-label={t("bellLabel")}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge
              variant="danger"
              className="absolute -top-0.5 -right-0.5 min-w-3.5 justify-center px-1 text-micro shadow-sm"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(320px,calc(100vw-2rem))] p-0"
      >
        <div className="border-b border-border/60 px-3 py-2.5">
          <h3 className="text-xs font-semibold">{t("title")}</h3>
        </div>
        <div className="max-h-[260px] overflow-y-auto p-2">
          {pendingCount === 0 ? (
            <div className="flex flex-col items-center gap-2 py-5 text-center">
              <CheckCircle2 className="size-6 text-success-500" />
              <p className="text-xs text-muted-foreground">{t("allClear")}</p>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-danger-500/15 bg-danger-500/10 px-3 py-3 shadow-sm dark:border-danger-500/20 dark:bg-danger-500/12">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-danger-500/20 bg-danger-500/10 text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/15 dark:text-danger-300">
                <AlertTriangle className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-danger-700 dark:text-danger-300">
                  {t("pendingAlerts", { count: pendingCount })}
                </p>
                <p className="mt-1 text-tiny leading-relaxed text-muted-foreground">
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
