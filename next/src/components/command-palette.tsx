"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Command } from "cmdk";
import {
  LogOut,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme, writeTheme } from "@/lib/theme";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { NAV_ITEMS } from "@/lib/nav-items";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: string;
}

export function CommandPalette({ open, onOpenChange, userRole }: CommandPaletteProps) {
  const t = useTranslations();
  const router = useRouter();
  const theme = useTheme();
  const [search, setSearch] = useState("");

  const visibleNav = useMemo(
    () => NAV_ITEMS.filter((item) => item.roles.includes(userRole)),
    [userRole],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setSearch("");
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const runAction = useCallback(
    (action: () => void) => {
      handleOpenChange(false);
      action();
    },
    [handleOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden p-0 max-w-lg">
        <VisuallyHidden.Root>
          <DialogTitle>Paleta de comandos</DialogTitle>
        </VisuallyHidden.Root>
        <Command className="flex flex-col" loop>
          <div className="flex items-center border-b border-border px-3">
            <Search className="mr-2 size-4 shrink-0 text-muted-foreground" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder={t("commandPalette.placeholder")}
              className="flex h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:inline-flex h-4 items-center gap-1 rounded border border-border bg-muted px-1 text-[9px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[280px] overflow-y-auto p-1.5">
            <Command.Empty className="py-5 text-center text-xs text-muted-foreground">
              {t("commandPalette.noResults")}
            </Command.Empty>

            {/* ── Navigation ──────────────────────────────── */}
            <Command.Group
              heading={t("commandPalette.navigate")}
              className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] px-2 py-1.5"
            >
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const label = t(item.label as Parameters<typeof t>[0]);
                return (
                  <Command.Item
                    key={item.href}
                    value={label}
                    onSelect={() => runAction(() => router.push(item.href))}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer select-none data-[selected=true]:bg-muted/80 data-[selected=true]:text-foreground transition-colors"
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    <span>{label}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>

            {/* ── Actions ─────────────────────────────────── */}
            <Command.Group
              heading={t("commandPalette.actions")}
              className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] px-2 py-1.5 mt-1"
            >
              <Command.Item
                value={t("commandPalette.toggleTheme")}
                onSelect={() =>
                  runAction(() => writeTheme(theme === "light" ? "dark" : "light"))
                }
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer select-none data-[selected=true]:bg-muted/80 data-[selected=true]:text-foreground transition-colors"
              >
                {theme === "light" ? (
                  <Moon className="size-4 text-muted-foreground" />
                ) : (
                  <Sun className="size-4 text-muted-foreground" />
                )}
                <span>{t("commandPalette.toggleTheme")}</span>
              </Command.Item>

              <Command.Item
                value={t("commandPalette.signOut")}
                onSelect={() => runAction(() => signOut({ callbackUrl: "/login" }))}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer select-none data-[selected=true]:bg-muted/80 data-[selected=true]:text-foreground transition-colors"
              >
                <LogOut className="size-4 text-muted-foreground" />
                <span>{t("commandPalette.signOut")}</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
