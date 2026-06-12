"use client";

import type { ComponentProps } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type DropdownMenuItemProps = ComponentProps<typeof DropdownMenuItem>;

export function AccountMenuRow({
  className,
  tone = "default",
  ...props
}: DropdownMenuItemProps & {
  tone?: "default" | "danger";
}) {
  return (
    <DropdownMenuItem
      className={cn(
        "group flex min-h-[46px] cursor-default items-center gap-2.5 rounded-[12px] border border-border/70 bg-[#f8f9fb] px-3 py-2 text-sm font-semibold text-foreground shadow-sm outline-none transition-colors duration-150 hover:border-gold-300/40 hover:bg-[#f0f4f8] data-[highlighted]:border-gold-300/40 data-[highlighted]:bg-[#f0f4f8] data-[highlighted]:text-foreground dark:bg-white/[0.045] dark:hover:border-gold-300/30 dark:hover:bg-white/[0.07]",
        tone === "danger" &&
          "text-danger-600 hover:border-danger-300/40 data-[highlighted]:border-danger-300/40 data-[highlighted]:text-danger-600 dark:text-danger-300",
        className,
      )}
      {...props}
    />
  );
}
