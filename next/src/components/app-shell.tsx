"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import type { Role } from "@prisma/client";
import {
  Globe,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  User,
} from "lucide-react";
import { useState } from "react";
import { useTheme, writeTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, type NavItem } from "@/lib/nav-items";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CommandPalette } from "@/components/command-palette";
import { NotificationCenter } from "@/components/notification-center";
import { useHotkeys } from "@/hooks/use-hotkeys";

interface AppShellProps {
  user: {
    id: string;
    email: string;
    role: Role;
    name?: string | null;
  };
  children: React.ReactNode;
}

function getInitialLocale() {
  if (typeof document === "undefined") {
    return "pt";
  }

  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  return match?.[1] ?? "pt";
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getSectionLabel(section: NavItem["section"]) {
  switch (section) {
    case "core":
      return "Workspace";
    case "operations":
      return "Operations";
    case "admin":
      return "Account";
  }
}

function NavLink({
  item,
  active,
  label,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  label: string;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900",
        active
          ? "bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] text-white shadow-[0_16px_32px_rgba(4,10,18,0.22)]"
          : "text-navy-200/75 hover:bg-white/6 hover:text-white"
      )}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-xl ring-1 transition-colors",
          active
            ? "bg-gold-300/15 text-gold-300 ring-gold-300/20"
            : "bg-white/5 text-navy-200/70 ring-white/10 group-hover:text-gold-200"
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="flex-1">{label}</span>
      {active ? (
        <span className="h-2 w-2 rounded-full bg-gold-300 shadow-[0_0_12px_rgba(245,194,66,0.7)]" />
      ) : null}
    </Link>
  );
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const theme = useTheme();
  const [locale, setLocale] = useState(getInitialLocale);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useHotkeys([
    { key: "k", mods: ["ctrl"], handler: () => setCmdOpen((v) => !v) },
  ]);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const groupedItems = visibleItems.reduce<Record<NavItem["section"], NavItem[]>>(
    (groups, item) => {
      groups[item.section].push(item);
      return groups;
    },
    { core: [], operations: [], admin: [] }
  );

  const roleLabels: Record<Role, string> = {
    ADMIN: t("roles.ADMIN"),
    PROFESSOR: t("roles.PROFESSOR"),
    ALUNO: t("roles.ALUNO"),
    PSICOLOGO: t("roles.PSICOLOGO"),
    PAIS: t("roles.PAIS"),
  };

  const displayName = user.name?.trim() || user.email;
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase())
      .join("") || user.email.charAt(0).toUpperCase();

  const toggleTheme = () => {
    writeTheme(theme === "light" ? "dark" : "light");
  };

  const toggleLocale = () => {
    const nextLocale = locale === "pt" ? "en" : "pt";
    setLocale(nextLocale);
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  const mobileItems = visibleItems
    .filter((item) =>
      ["/dashboard", "/biometria", "/testes", "/sos"].includes(item.href)
    )
    .slice(0, 4);

  const sidebarNav = (onNav?: () => void) => (
    <>
      {(["core", "operations", "admin"] as const).map((section) =>
        groupedItems[section].length > 0 ? (
          <div key={section} className="space-y-1.5">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-navy-200/50">
              {getSectionLabel(section)}
            </p>
            {groupedItems[section].map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
                label={t(item.label as Parameters<typeof t>[0])}
                onClick={onNav}
              />
            ))}
          </div>
        ) : null
      )}
    </>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative min-h-screen bg-background">
        {/* Skip-to-content link for keyboard/screen-reader users */}
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-50 -translate-y-16 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-float transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-gold-400/40"
        >
          {t("nav.skipToContent")}
        </a>
        <div className="bg-mesh" aria-hidden="true" />
        <div className="bg-noise" aria-hidden="true" />

        {/* ── Desktop Sidebar ── */}
        <aside
          aria-label={t("nav.sidebarNavigation")}
          className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border/70 bg-[linear-gradient(180deg,rgba(8,22,43,0.98),rgba(8,22,43,0.92))] lg:flex lg:flex-col"
        >
          <div className="border-b border-white/10 px-4 py-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="HealthyTech Atlantico"
                  width={140}
                  height={42}
                  className="object-contain brightness-0 invert"
                  priority
                />
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-4">{sidebarNav()}</nav>
          </ScrollArea>

          <div className="border-t border-white/10 p-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-3">
                <Avatar className="size-9 shadow-[0_12px_24px_rgba(217,166,28,0.3)]">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{displayName}</p>
                  <p className="truncate text-xs text-navy-200/70">{user.email}</p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-200/80">
                    {roleLabels[user.role]}
                  </p>
                </div>
              </div>


            </div>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="relative flex min-h-screen flex-col lg:ml-64">
          {/* ── Top header bar ── */}
          <header
            aria-label={t("nav.topBar")}
            className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl"
          >
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:justify-end lg:px-8">
              {/* Mobile: hamburger + logo */}
              <div className="flex items-center gap-2 lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  onClick={() => setMobileOpen(true)}
                  aria-label={t("nav.openMenu")}
                  aria-expanded={mobileOpen}
                >
                  <Menu className="size-5" />
                </Button>
              </div>

              {/* Right-side actions */}
              <div className="flex items-center gap-1.5">
                {/* Command palette trigger */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setCmdOpen(true)}
                      aria-haspopup="dialog"
                      className="hidden items-center gap-2 rounded-xl border border-border/70 bg-card/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground sm:flex"
                    >
                      <Search className="size-3.5" />
                      <span className="max-w-[100px] truncate">{t("commandPalette.placeholder")}</span>
                      <kbd className="ml-1 inline-flex h-5 items-center rounded border border-border bg-muted px-1 text-[10px] font-medium">
                        ⌘K
                      </kbd>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t("commandPalette.placeholder")}</TooltipContent>
                </Tooltip>

                {/* Notification center */}
                <NotificationCenter userRole={user.role} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl"
                      onClick={toggleTheme}
                    >
                      {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("nav.changeTheme")}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl"
                      onClick={toggleLocale}
                    >
                      <Globe className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("nav.changeLanguage")}</TooltipContent>
                </Tooltip>

                {/* User dropdown (desktop) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="hidden items-center gap-2 rounded-2xl border border-border/70 bg-card/60 px-3 py-1.5 transition-colors hover:bg-card lg:flex"
                    >
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="max-w-[120px] truncate text-sm font-medium text-foreground">
                        {displayName}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium text-foreground">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/perfil">
                        <User className="mr-2 size-4" />
                        {t("nav.perfil")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-danger-600 focus:text-danger-600"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                    >
                      <LogOut className="mr-2 size-4" />
                      {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile sign-out button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl lg:hidden"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      title={t("nav.logout")}
                    >
                      <LogOut className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("nav.logout")}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </header>

          {/* ── Mobile Sheet Sidebar ── */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent
              side="left"
              className="w-64 bg-[linear-gradient(180deg,rgba(8,22,43,0.98),rgba(8,22,43,0.92))] p-0 border-r-0"
            >
              <div className="border-b border-white/10 px-4 py-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-center">
                    <Image
                      src="/logo.png"
                      alt="HealthyTech Atlantico"
                      width={130}
                      height={38}
                      className="object-contain brightness-0 invert"
                    />
                  </div>
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-200px)] px-3 py-4">
                <nav className="space-y-4">
                  {sidebarNav(() => setMobileOpen(false))}
                </nav>
              </ScrollArea>
              <div className="border-t border-white/10 p-3">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-white">
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{displayName}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-200/80">
                      {roleLabels[user.role]}
                    </p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* ── Page content ── */}
          <main
            id="main-content"
            className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 py-4 pb-24 sm:px-6 lg:px-8 lg:py-5 lg:pb-8"
          >
            {children}
          </main>

          {/* ── Mobile bottom nav ── */}
          <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/92 px-3 py-2.5 backdrop-blur-xl lg:hidden">
            <div className="mx-auto grid max-w-xl grid-cols-5 gap-1.5">
              {mobileItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition-all duration-300",
                      active
                        ? "bg-card text-foreground shadow-card"
                        : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-xl",
                        active
                          ? "bg-gold-100 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300"
                          : "bg-muted/60"
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="truncate">{t(item.label as Parameters<typeof t>[0])}</span>
                  </Link>
                );
              })}

              <Link
                href="/perfil"
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition-all duration-300",
                  isActivePath(pathname, "/perfil")
                    ? "bg-card text-foreground shadow-card"
                    : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-xl",
                    isActivePath(pathname, "/perfil")
                      ? "bg-gold-100 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300"
                      : "bg-muted/60"
                  )}
                >
                  <User className="size-4" />
                </span>
                <span>{t("nav.perfil")}</span>
              </Link>
            </div>
          </nav>
        </div>
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} userRole={user.role} />
    </TooltipProvider>
  );
}
