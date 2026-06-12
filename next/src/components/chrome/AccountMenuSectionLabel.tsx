"use client";

import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";

export function AccountMenuSectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DropdownMenuLabel className="px-1 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </DropdownMenuLabel>
  );
}
