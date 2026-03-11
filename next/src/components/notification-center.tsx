"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Bell, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSosAlerts } from "@/hooks/use-queries";

interface NotificationCenterProps {
  userRole: string;
}

export function NotificationCenter({ userRole }: NotificationCenterProps) {
  const t = useTranslations("notifications");
  const isStaff = ["ADMIN", "PROFESSOR", "PSICOLOGO"].includes(userRole);

  const { data: sosAlerts = [] } = useSosAlerts({
    enabled: isStaff,
    refetchInterval: 60_000,
  });

  const pendingCount = sosAlerts.filter(
    (a: { resolved: boolean }) => !a.resolved,
  ).length;

  // Track which alerts have been seen via localStorage
  const [seenCount, setSeenCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("ht-notif-seen-count");
    if (stored) setSeenCount(parseInt(stored, 10));
  }, []);

  const markAllSeen = useCallback(() => {
    setSeenCount(pendingCount);
    localStorage.setItem("ht-notif-seen-count", String(pendingCount));
  }, [pendingCount]);

  if (!isStaff) return null;

  const unreadCount = Math.max(0, pendingCount - seenCount);

  return (
    <Popover onOpenChange={(open) => { if (open) markAllSeen(); }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-xl"
          aria-label={t("bellLabel")}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-danger-600 text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">{t("title")}</h3>
        </div>
        <div className="max-h-[280px] overflow-y-auto p-2">
          {pendingCount === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2 className="size-8 text-success-500" />
              <p className="text-sm text-muted-foreground">{t("allClear")}</p>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg bg-danger-50/70 dark:bg-danger-950/20 p-3 border border-danger-200/60 dark:border-danger-900/30">
              <AlertTriangle className="size-5 text-danger-600 dark:text-danger-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-danger-700 dark:text-danger-300">
                  {t("pendingAlerts", { count: pendingCount })}
                </p>
                <p className="text-xs text-danger-600/80 dark:text-danger-400/70 mt-1">
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
