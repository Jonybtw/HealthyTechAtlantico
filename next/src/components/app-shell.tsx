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
  Settings2,
  Sun,
  Type,
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CommandPalette } from "@/components/command-palette";
import { NotificationCenter } from "@/components/notification-center";
import { BrandLogo } from "@/components/brand-logo";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useIsClient } from "@/hooks/use-is-client";
import { usePreferences } from "@/hooks/use-preferences";
import { MeshBackground } from "@/components/ui/mesh-glow";

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
  ALUNO: ["/dashboard", "/questionarios", "/sos", "/relatorio", "/protocolos"],
  PSICOLOGO: ["/dashboard", "/sos", "/perfil"],
  PAIS: ["/dashboard", "/relatorio", "/protocolos", "/perfil"],
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const SECTION_ORDER: NavItem["section"][] = [
  "core",
  "operations",
  "reference",
  "admin",
];

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
        "group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-xs font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 focus-visible:ring-offset-2",
        active
          ? "bg-navy-100 dark:bg-white/10 text-navy-900 dark:text-white"
          : "text-navy-600 dark:text-navy-200/78 hover:bg-navy-200/30 dark:hover:bg-white/6 hover:text-navy-900 dark:hover:text-white",
      )}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-xl ring-1 transition-colors",
          active
            ? "bg-gold-400/20 text-gold-600 ring-gold-400/30 dark:bg-gold-300/15 dark:text-gold-300 dark:ring-gold-300/20"
            : "bg-navy-200/20 text-navy-600 ring-navy-300/30 group-hover:text-gold-600 dark:bg-white/5 dark:text-navy-200/70 dark:ring-white/10 dark:group-hover:text-gold-200",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="flex-1 truncate">{label}</span>
      {active ? (
        <span className="h-1.5 w-1.5 rounded-full bg-gold-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] dark:bg-gold-300 dark:shadow-[0_0_10px_rgba(245,194,66,0.7)]" />
      ) : null}
    </Link>
  );
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const {
    contrast,
    fontScale,
    theme,
    locale,
    toggleTheme,
    toggleLocale,
    setFontScale,
    setContrastMode,
  } = usePreferences();
  const isClient = useIsClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);

  useHotkeys([
    { key: "k", mods: ["ctrl"], handler: () => setCmdOpen((value) => !value) },
    {
      key: "m",
      mods: ["alt"],
      handler: () => {
        const firstNavLink =
          document.querySelector<HTMLAnchorElement>("nav a[href]");
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

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role),
  );
  const groupedItems = visibleItems.reduce<
    Record<NavItem["section"], NavItem[]>
  >(
    (groups, item) => {
      groups[item.section].push(item);
      return groups;
    },
    { core: [], operations: [], reference: [], admin: [] },
  );
  const mobileItems = getMobileItems(user.role, visibleItems);
  const currentItem =
    visibleItems.find((item) => isActivePath(pathname, item.href)) ??
    visibleItems[0] ??
    null;
  const currentItemLabel = currentItem
    ? t(currentItem.label as Parameters<typeof t>[0])
    : brandName;

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
      .filter(
        (chunk) => Boolean(chunk) && !/^(prof|dr|dra|sr|sra)\.*$/i.test(chunk),
      )
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase())
      .join("") || user.email.charAt(0).toUpperCase();

  const sidebarNav = (onNav?: () => void) => (
    <>
      {SECTION_ORDER.map((section) =>
        groupedItems[section].length > 0 ? (
          <div key={section} className="space-y-1.5">
            <p className="px-2.5 pb-1 text-micro font-semibold uppercase tracking-[0.22em] text-navy-200/44">
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
        ) : null,
      )}
    </>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground transition-colors duration-300">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-50 -translate-y-16 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-float transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-gold-400/40"
        >
          {t("nav.skipToContent")}
        </a>
        <MeshBackground />
        <div className="bg-noise" aria-hidden="true" />

        <aside
          data-theme="dark"
          aria-label={t("nav.sidebarNavigation")}
          className="dark fixed inset-y-0 left-0 z-30 hidden w-72 overflow-hidden rounded-r-[2.75rem] border-r border-navy-800 shadow-2xl transition-colors duration-300 lg:flex lg:flex-col"
        >
          {/* Base sólida para isolar e preservar o Dark Mode Perfeito */}
          <div className="absolute inset-0 bg-navy-950 rounded-r-[2.75rem]" />

          {/* Malha sutil de fundo para dar textura rica e blur */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-r-[2.75rem]">
            <div className="absolute -left-20 -top-20 size-96 rounded-full bg-gold-400/5" />
            <div className="absolute -bottom-20 -right-20 size-96 rounded-full bg-navy-300/5" />
            <div className="bg-noise absolute inset-0 opacity-[0.03]" />
          </div>

          <div className="absolute inset-0 bg-navy-950/90 rounded-r-[2.75rem]" />

          <div className="absolute inset-x-0 top-0 h-28 rounded-tr-[2.75rem] bg-[radial-gradient(circle_at_top_left,rgba(216,173,52,0.16),transparent_40%),linear-gradient(180deg,rgba(20,48,76,0.24),transparent)] z-0" />

          <div className="relative z-10 flex items-center justify-center border-b border-white/10 px-6 py-5">
            <BrandLogo
              alt={brandName}
              className="h-[98px] w-[96px]"
              imageClassName="drop-shadow-[0_2px_8px_rgba(255,255,255,0.12)] brightness-0 invert"
              priority
              sizes="96px"
            />
          </div>

          <ScrollArea className="relative flex-1 px-3 py-4">
            <nav className="space-y-4">{sidebarNav()}</nav>
          </ScrollArea>

          <div className="relative border-t border-white/10 p-3">
            <div className="rounded-3xl border border-white/10 bg-white/6 p-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ">
              <div className="flex items-center gap-3">
                <Avatar className="size-8 rounded-2xl shadow-[0_10px_20px_rgba(217,166,28,0.25)]">
                  <AvatarFallback className="rounded-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">
                    {displayName}
                  </p>
                  <p className="mt-1 text-micro font-semibold uppercase tracking-[0.18em] text-gold-300">
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
            className="sticky top-0 z-20 border-b border-white/45 bg-white/62 shadow-[0_16px_34px_-30px_rgba(9,21,35,0.42)] backdrop-blur-md transition-colors duration-300 dark:border-white/10 dark:bg-navy-950/66"
          >
            <div className="mx-auto flex w-full max-w-[1680px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
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

                <div className="min-w-0 lg:hidden">
                  <p className="text-micro font-semibold uppercase tracking-[0.22em] text-gold-600 dark:text-gold-300">
                    {currentItem
                      ? getSectionLabel(currentItem.section)
                      : roleLabels[user.role]}
                  </p>
                  <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                    {currentItemLabel}
                  </p>
                </div>
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
                      <kbd className="ml-1 inline-flex h-4 items-center rounded border border-border bg-muted px-1 text-micro font-medium">
                        Ctrl+K
                      </kbd>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("commandPalette.placeholder")}
                  </TooltipContent>
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
                  <TooltipContent>
                    {t("commandPalette.placeholder")}
                  </TooltipContent>
                </Tooltip>

                <NotificationCenter userRole={user.role} />

                {isClient ? (
                  <DropdownMenu
                    onOpenChange={(open) =>
                      !open && setAccessibilityOpen(false)
                    }
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="hidden h-fit min-w-fit items-center gap-2 rounded-full border border-transparent px-2.5 py-1.5 lg:flex hover:border-navy-200/70 hover:bg-white/70 dark:hover:border-white/10 dark:hover:bg-white/6"
                      >
                        <Avatar className="size-6">
                          <AvatarFallback className="text-micro">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="max-w-[120px] truncate text-xs font-medium leading-tight text-foreground">
                          {displayName}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={10}
                      className="w-72 rounded-2xl border border-white/45 bg-white/84 p-1.5 shadow-[0_24px_60px_-28px_rgba(9,21,35,0.28)]  dark:border-white/10 dark:bg-navy-950/84"
                    >
                      <div className="rounded-2xl bg-gradient-to-br from-navy-50 to-white px-3.5 py-3 dark:from-white/8 dark:to-white/4">
                        <div className="flex items-start gap-3">
                          <Avatar className="size-10 shadow-sm ring-1 ring-white/70 dark:ring-white/10">
                            <AvatarFallback className="text-xs font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-semibold text-foreground">
                              {displayName}
                            </p>
                            <p className="truncate pt-0.5 text-xs text-muted-foreground">
                              {user.email}
                            </p>
                            <p className="pt-2 text-micro font-semibold uppercase tracking-[0.24em] text-gold-600 dark:text-gold-300">
                              {roleLabels[user.role]}
                            </p>
                          </div>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        asChild
                        className="rounded-2xl px-3 py-3"
                      >
                        <Link href="/perfil">
                          <span className="flex size-8 items-center justify-center rounded-2xl bg-navy-100 text-navy-700 dark:bg-white/8 dark:text-navy-100">
                            <User className="size-4" />
                          </span>
                          {t("nav.perfil")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>
                        {t("nav.preferences")}
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={toggleTheme}
                        className="rounded-2xl px-3 py-3"
                      >
                        {theme === "light" ? (
                          <Moon className="size-4" />
                        ) : (
                          <Sun className="size-4" />
                        )}
                        {t("nav.changeTheme")}
                        <DropdownMenuShortcut>
                          {theme === "light"
                            ? t("nav.darkMode")
                            : t("nav.lightMode")}
                        </DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={toggleLocale}
                        className="rounded-2xl px-3 py-3"
                      >
                        <Globe className="size-4" />
                        {t("nav.changeLanguage")}
                        <DropdownMenuShortcut className="font-semibold text-navy-500 dark:text-navy-200">
                          {locale.toUpperCase()}
                        </DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="rounded-2xl px-3 py-3"
                        onSelect={(event) => {
                          event.preventDefault();
                          setAccessibilityOpen((value) => !value);
                        }}
                      >
                        <Settings2 className="size-4" />
                        {t("nav.accessibility")}
                        <DropdownMenuShortcut className="text-base leading-none text-navy-500 dark:text-navy-200">
                          {accessibilityOpen ? "−" : "+"}
                        </DropdownMenuShortcut>
                      </DropdownMenuItem>
                      {accessibilityOpen ? (
                        <div className="space-y-3 rounded-2xl border border-navy-200/70 bg-navy-50/75 px-2 py-2.5 dark:border-white/10 dark:bg-white/6">
                          <div>
                            <DropdownMenuLabel className="px-2 pb-1 pt-1">
                              {t("nav.textSize")}
                            </DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                              value={fontScale}
                              onValueChange={(value) =>
                                setFontScale(
                                  value as "small" | "default" | "large",
                                )
                              }
                            >
                              <DropdownMenuRadioItem
                                value="small"
                                className="rounded-none border-0 bg-transparent px-7 py-2 text-base"
                              >
                                <Type className="size-4" />
                                {t("nav.textSmall")}
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem
                                value="default"
                                className="rounded-none border-0 bg-transparent px-7 py-2 text-base"
                              >
                                <Type className="size-4" />
                                {t("nav.textDefault")}
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem
                                value="large"
                                className="rounded-none border-0 bg-transparent px-7 py-2 text-base"
                              >
                                <Type className="size-4" />
                                {t("nav.textLarge")}
                              </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </div>
                          <DropdownMenuSeparator className="mx-0" />
                          <div>
                            <DropdownMenuLabel className="px-2 pb-1 pt-1">
                              {t("nav.contrast")}
                            </DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                              value={contrast}
                              onValueChange={(value) =>
                                setContrastMode(value as "normal" | "high")
                              }
                            >
                              <DropdownMenuRadioItem
                                value="normal"
                                className="rounded-none border-0 bg-transparent px-7 py-2 text-base"
                              >
                                {t("nav.contrastNormal")}
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem
                                value="high"
                                className="rounded-none border-0 bg-transparent px-7 py-2 text-base"
                              >
                                {t("nav.contrastHigh")}
                              </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </div>
                        </div>
                      ) : null}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="rounded-2xl px-3 py-3 text-danger-600 focus:text-danger-600"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                      >
                        <span className="flex size-8 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 dark:bg-danger-950/40">
                          <LogOut className="size-4" />
                        </span>
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
              data-theme="dark"
              className="dark w-72 rounded-none border-r border-navy-800 p-0 transition-colors duration-300 overflow-hidden"
            >
              {/* Dark Mode Base Layer */}
              <div className="absolute inset-0 bg-navy-950" />

              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -left-20 -top-20 size-96 rounded-full bg-gold-400/10 " />
                <div className="absolute -bottom-20 -right-20 size-96 rounded-full bg-navy-300/5 " />
                <div className="bg-noise absolute inset-0 opacity-[0.03]" />
              </div>

              <div className="absolute inset-0 bg-navy-950 " />

              <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(216,173,52,0.16),transparent_40%),linear-gradient(180deg,rgba(20,48,76,0.24),transparent)] z-0" />

              <div className="relative z-10 flex h-full flex-col">
                <div className="relative flex items-center justify-center border-b border-white/10 px-6 py-5">
                  <BrandLogo
                    alt={brandName}
                    className="h-[98px] w-[96px]"
                    imageClassName="drop-shadow-[0_2px_8px_rgba(255,255,255,0.12)] brightness-0 invert"
                    sizes="96px"
                  />
                </div>
                <ScrollArea className="h-[calc(100vh-224px)] px-3 py-4">
                  <nav className="space-y-4">
                    {sidebarNav(() => setMobileOpen(false))}
                  </nav>
                </ScrollArea>
                <div className="border-t border-navy-200/50 dark:border-white/10 p-3">
                  <div className="rounded-3xl border border-white/40 bg-white/50 p-3 text-navy-900 shadow-sm  dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 rounded-2xl shadow-sm dark:shadow-[0_10px_20px_rgba(217,166,28,0.25)]">
                        <AvatarFallback className="rounded-2xl text-micro">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">
                          {displayName}
                        </p>
                        <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-300">
                          {roleLabels[user.role]}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <main
            id="main-content"
            className="relative mx-auto flex w-full max-w-[1680px] flex-1 flex-col gap-5 px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-6 lg:pb-8"
          >
            {children}
          </main>

          <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/45 bg-white/74 px-3 py-2 backdrop-blur-md transition-colors duration-300 dark:border-white/10 dark:bg-navy-950/78 lg:hidden">
            <div className="mx-auto grid max-w-xl grid-cols-5 gap-1.5">
              {mobileItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-micro font-semibold transition-all duration-300",
                      active
                        ? "bg-navy-100 text-navy-900 shadow-sm dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] dark:text-white dark:shadow-[0_18px_36px_rgba(4,10,18,0.22)]"
                        : "text-navy-500 hover:bg-navy-50 hover:text-navy-900 dark:text-navy-300 dark:hover:bg-white/5 dark:hover:text-white",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-xl",
                        active
                          ? "bg-gold-400/20 text-gold-600 ring-1 ring-gold-400/30 dark:bg-gold-300/15 dark:text-gold-300 dark:ring-gold-300/20"
                          : "bg-navy-100/50 dark:bg-white/5",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="truncate">
                      {t(item.label as Parameters<typeof t>[0])}
                    </span>
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-micro font-semibold transition-all duration-300",
                  mobileOpen ||
                    (currentItem &&
                      !mobileItems.some(
                        (item) => item.href === currentItem.href,
                      ))
                    ? "bg-navy-100 text-navy-900 shadow-sm dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] dark:text-white dark:shadow-[0_18px_36px_rgba(4,10,18,0.22)]"
                    : "text-navy-500 hover:bg-navy-50 hover:text-navy-900 dark:text-navy-300 dark:hover:bg-white/5 dark:hover:text-white",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-xl",
                    mobileOpen ||
                      (currentItem &&
                        !mobileItems.some(
                          (item) => item.href === currentItem.href,
                        ))
                      ? "bg-gold-400/20 text-gold-600 ring-1 ring-gold-400/30 dark:bg-gold-300/15 dark:text-gold-300 dark:ring-gold-300/20"
                      : "bg-navy-100/50 dark:bg-white/5",
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

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        userRole={user.role}
      />
    </TooltipProvider>
  );
}
