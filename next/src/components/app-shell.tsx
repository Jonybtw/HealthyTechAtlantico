"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, type NavItem } from "@/lib/nav-items";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { BrandLogo } from "@/components/brand-logo";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useIsClient } from "@/hooks/use-is-client";
import { usePreferences } from "@/hooks/use-preferences";

interface AppShellProps {
  user: {
    id: string;
    email: string;
    role: Role;
    name?: string | null;
  };
  children: React.ReactNode;
}

const MOBILE_PRIORITIES: Record<Role, string[]> = {
  ADMIN: ["/dashboard", "/alunos", "/analise", "/sos", "/admin"],
  PROFESSOR: ["/dashboard", "/turma", "/biometria", "/testes", "/sos"],
  ALUNO: ["/dashboard", "/biometria", "/testes", "/sos", "/relatorio"],
  PSICOLOGO: ["/dashboard", "/sos", "/protocolos", "/perfil"],
  PAIS: ["/dashboard", "/relatorio", "/protocolos", "/perfil"],
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const SECTION_ORDER: NavItem["section"][] = ["core", "operations", "reference", "admin"];

function getSectionLabel(section: NavItem["section"]) {
  switch (section) {
    case "core":
      return "Geral";
    case "operations":
      return "Operações";
    case "reference":
      return "Referência";
    case "admin":
      return "Conta";
  }
}

function getMobileItems(role: Role, items: NavItem[]) {
  const priorities = MOBILE_PRIORITIES[role] ?? [];
  const sorted = [...items].sort((left, right) => {
    const leftPriority = priorities.indexOf(left.href);
    const rightPriority = priorities.indexOf(right.href);

    if (leftPriority === -1 && rightPriority === -1) {
      return 0;
    }
    if (leftPriority === -1) {
      return 1;
    }
    if (rightPriority === -1) {
      return -1;
    }

    return leftPriority - rightPriority;
  });

  return sorted.slice(0, 4);
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
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-xs font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900",
        active
          ? "bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] text-white shadow-[0_18px_36px_rgba(4,10,18,0.22)]"
          : "text-navy-200/78 hover:bg-white/6 hover:text-white"
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
      <span className="flex-1 truncate">{label}</span>
      {active ? (
        <span className="h-1.5 w-1.5 rounded-full bg-gold-300 shadow-[0_0_10px_rgba(245,194,66,0.7)]" />
      ) : null}
    </Link>
  );
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const {
    theme,
    locale,
    contrast,
    fontScale,
    toggleTheme,
    toggleLocale,
    setFontScale,
    setContrastMode,
  } = usePreferences();
  const isClient = useIsClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useHotkeys([
    { key: "k", mods: ["ctrl"], handler: () => setCmdOpen((value) => !value) },
    {
      key: "m",
      mods: ["alt"],
      handler: () => {
        const firstNavLink = document.querySelector<HTMLAnchorElement>("nav a[href]");
        firstNavLink?.focus();
      },
    },
  ]);

  const brandName = "HealthyTech Atlantico";
  const savedTitle = useRef("");
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) {
        savedTitle.current = document.title;
        document.title = "Volta ao HealthyTech Atlantico";
      } else {
        document.title = savedTitle.current || brandName;
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const groupedItems = visibleItems.reduce<Record<NavItem["section"], NavItem[]>>(
    (groups, item) => {
      groups[item.section].push(item);
      return groups;
    },
    { core: [], operations: [], reference: [], admin: [] }
  );
  const mobileItems = getMobileItems(user.role, visibleItems);
  const currentItem =
    visibleItems.find((item) => isActivePath(pathname, item.href)) ??
    visibleItems[0] ??
    null;

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
      .filter((chunk) => Boolean(chunk) && !/^(prof|dr|dra|sr|sra)\.*$/i.test(chunk))
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase())
      .join("") || user.email.charAt(0).toUpperCase();

  const sidebarNav = (onNav?: () => void) => (
    <>
      {SECTION_ORDER.map((section) =>
        groupedItems[section].length > 0 ? (
          <div key={section} className="space-y-1.5">
            <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-navy-200/44">
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
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-50 -translate-y-16 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-float transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-gold-400/40"
        >
          {t("nav.skipToContent")}
        </a>
        <div className="bg-mesh" aria-hidden="true" />
        <div className="bg-noise" aria-hidden="true" />

        <aside
          aria-label={t("nav.sidebarNavigation")}
          className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-900 lg:flex lg:flex-col"
        >
          <div className="flex items-center justify-center border-b border-white/10 px-6 py-5">
            <BrandLogo
              alt={brandName}
              className="h-[98px] w-[96px]"
              imageClassName="brightness-0 invert drop-shadow-[0_2px_8px_rgba(255,255,255,0.12)]"
              priority
              sizes="96px"
            />
          </div>

          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-4">{sidebarNav()}</nav>
          </ScrollArea>

          <div className="border-t border-white/10 p-3">
            <div className="rounded-[18px] border border-white/10 bg-white/5 p-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-3">
                <Avatar className="size-8 shadow-[0_10px_20px_rgba(217,166,28,0.25)]">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{displayName}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-200/80">
                    {roleLabels[user.role]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="relative flex min-h-screen flex-col lg:ml-72">
          <header
            aria-label={t("nav.topBar")}
            className="sticky top-0 z-20 border-b border-border/70 bg-background/82 backdrop-blur-xl"
          >
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label={t("nav.openMenu")}
                  aria-expanded={mobileOpen}
                >
                  <Menu className="size-5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCmdOpen(true)}
                      aria-haspopup="dialog"
                      className="hidden items-center gap-2 px-2.5 py-1.5 text-xs text-muted-foreground sm:flex"
                    >
                      <Search className="size-3.5" />
                      <span className="max-w-[120px] truncate">
                        {t("commandPalette.placeholder")}
                      </span>
                      <kbd className="ml-1 inline-flex h-4 items-center rounded border border-border bg-muted px-1 text-[9px] font-medium">
                        Ctrl+K
                      </kbd>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("commandPalette.placeholder")}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="sm:hidden"
                      onClick={() => setCmdOpen(true)}
                      aria-label={t("commandPalette.placeholder")}
                    >
                      <Search className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("commandPalette.placeholder")}</TooltipContent>
                </Tooltip>

                <NotificationCenter userRole={user.role} />

                {isClient ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="hidden h-fit min-w-fit items-center gap-2 px-2.5 py-1.5 lg:flex"
                      >
                        <Avatar className="size-6">
                          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="max-w-[120px] truncate text-xs font-medium leading-tight text-foreground">
                          {displayName}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium text-foreground">{displayName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                            {roleLabels[user.role]}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/perfil">
                          <User className="mr-2 size-4" />
                          {t("nav.perfil")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>{t("nav.preferences")}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={toggleTheme}>
                        {theme === "light" ? (
                          <Moon className="size-4" />
                        ) : (
                          <Sun className="size-4" />
                        )}
                        {t("nav.changeTheme")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={toggleLocale}>
                        <Globe className="size-4" />
                        {t("nav.changeLanguage")}
                        <span className="ml-auto text-xs font-medium text-muted-foreground">
                          {locale.toUpperCase()}
                        </span>
                      </DropdownMenuItem>                      <DropdownMenuLabel>Acessibilidade</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setFontScale("small")}>Texto menor</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFontScale("default")}>Texto médio</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFontScale("large")}>Texto maior</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setContrastMode("normal")}>Contraste normal</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setContrastMode("high")}>Contraste alto</DropdownMenuItem>                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-danger-600 focus:text-danger-600"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                      >
                        <LogOut className="mr-2 size-4" />
                        {t("nav.logout")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
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

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent
              side="left"
              className="w-72 border-r-0 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-900 p-0"
            >
              <div className="flex items-center justify-center border-b border-white/10 px-6 py-5">
                <BrandLogo
                  alt={brandName}
                  className="h-[98px] w-[96px]"
                  imageClassName="brightness-0 invert drop-shadow-[0_2px_8px_rgba(255,255,255,0.12)]"
                  sizes="96px"
                />
              </div>
              <ScrollArea className="h-[calc(100vh-224px)] px-3 py-4">
                <nav className="space-y-4">{sidebarNav(() => setMobileOpen(false))}</nav>
              </ScrollArea>
              <div className="border-t border-white/10 p-3">
                <div className="rounded-[18px] border border-white/10 bg-white/5 p-3 text-white">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{displayName}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-200/80">
                        {roleLabels[user.role]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <main
            id="main-content"
            className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-4 py-3 pb-24 sm:px-6 lg:px-8 lg:py-4 lg:pb-6"
          >
            {children}
          </main>

          <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/92 px-3 py-2 backdrop-blur-xl lg:hidden">
            <div className="mx-auto grid max-w-xl grid-cols-5 gap-1.5">
              {mobileItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-semibold transition-all duration-300",
                      active
                        ? "bg-card text-foreground shadow-card"
                        : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-xl",
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

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-semibold transition-all duration-300",
                  mobileOpen || (currentItem && !mobileItems.some((item) => item.href === currentItem.href))
                    ? "bg-card text-foreground shadow-card"
                    : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-xl",
                    mobileOpen || (currentItem && !mobileItems.some((item) => item.href === currentItem.href))
                      ? "bg-gold-100 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300"
                      : "bg-muted/60"
                  )}
                >
                  <Menu className="size-4" />
                </span>
                <span>Menu</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} userRole={user.role} />
    </TooltipProvider>
  );
}
