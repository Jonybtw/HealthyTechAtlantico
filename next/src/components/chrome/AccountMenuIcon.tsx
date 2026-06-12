"use client";

import { cn } from "@/lib/utils";

export function AccountMenuIcon({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "gold" | "danger";
}) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-[12px] border",
        tone === "gold" &&
          "border-gold-200 bg-gold-100 text-gold-700 dark:border-gold-300/20 dark:bg-gold-300/12 dark:text-gold-200",
        tone === "danger" &&
          "border-danger-200 bg-danger-100 text-danger-700 dark:border-danger-300/20 dark:bg-danger-300/12 dark:text-danger-200",
        tone === "default" &&
          "border-navy-200 bg-navy-100 text-navy-700 dark:border-navy-200/20 dark:bg-white/8 dark:text-navy-100",
      )}
    >
      {children}
    </span>
  );
}
