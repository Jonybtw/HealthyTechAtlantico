"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import type { Role } from "@prisma/client";
import {
  ChevronRight,
  Cloud,
  CloudOff,
  Globe,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings2,
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
import { SyncProvider, useSyncStatus } from "@/contexts/sync-context";

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

const SECTION_LABEL_KEYS: Record<NavItem["section"], string> = {
  core: "nav.sectionCore",
  operations: "nav.sectionOperations",
  reference: "nav.sectionReference",
  admin: "nav.sectionAdmin",
};

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
  const isSos = item.href === "/sos";

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 focus-visible:ring-offset-2",
        active && isSos
          ? "bg-danger-100 text-danger-600 dark:bg-danger-300/12 dark:text-danger-200"
          : active
          ? "bg-[#f5e6c3] text-[#b88c19] dark:bg-gold-300/15 dark:text-gold-200"
          : "text-[#2a4a6e] hover:bg-[#f8f9fb] dark:text-navy-100/78 dark:hover:bg-white/6 dark:hover:text-white",
      )}
    >
      <span
        className={cn(
          "flex size-5 items-center justify-center transition-colors",
          active && isSos
            ? "text-danger-600 dark:text-danger-200"
            : active
            ? "text-[#b88c19] dark:text-gold-200"
            : "text-[#2a4a6e] dark:text-navy-100/78 dark:group-hover:text-white",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="flex-1 truncate">{label}</span>
      {active && isSos ? (
        <span
          aria-hidden="true"
          className="size-2.5 rounded-full bg-danger-500 dark:bg-danger-300"
        />
      ) : null}
    </Link>
  );
}

function SyncStatusBadge() {
  const { isOnline, draftCount, isSyncing } = useSyncStatus();
  const pending = draftCount > 0 || !isOnline;

  return (
    <div
      className={cn(
        "hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-300 sm:flex",
        pending
          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"
          : "border-success-200 bg-success-50 text-success-700 dark:border-success-400/20 dark:bg-success-400/10 dark:text-success-300",
      )}
    >
      {pending ? (
        <CloudOff className={cn("size-3.5", isSyncing && "animate-pulse")} />
      ) : (
        <Cloud className="size-3.5" />
      )}
      <span className="whitespace-nowrap">
        {pending
          ? draftCount > 0
            ? `${draftCount} pending`
            : "Offline"
          : "Synced"}
      </span>
    </div>
  );
}

function AccountMenuIcon({
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

function AccountMenuRow({
  className,
  tone = "default",
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuItem> & {
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

function AccountMenuSectionLabel({
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

  const brandName = "HealthyTech Atlântico";
  const savedTitle = useRef("");
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) {
        savedTitle.current = document.title;
      document.title = "Volta ao HealthyTech Atlântico";
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
  const isDashboard = isActivePath(pathname, "/dashboard");
  const contentWidthClassName = isDashboard ? "max-w-none" : "max-w-[1680px]";
  const currentItemLabel = currentItem
    ? t(currentItem.label as Parameters<typeof t>[0])
    : brandName;
  const getSectionLabel = (section: NavItem["section"]) =>
    t(SECTION_LABEL_KEYS[section] as Parameters<typeof t>[0]);
  const breadcrumbPrimary = currentItem
    ? getSectionLabel(currentItem.section)
    : brandName;
  const breadcrumbSecondary = currentItemLabel;

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
  const targetLocale = locale === "pt" ? "EN" : "PT";

  const sidebarNav = (onNav?: () => void) => (
    <div className="space-y-5">
      {SECTION_ORDER.map((section) =>
        groupedItems[section].length > 0 ? (
          <div key={section} className="space-y-1.5">
            <p className="px-2.5 pb-1 text-micro font-semibold uppercase tracking-[0.22em] text-muted-foreground/70 dark:text-navy-200/48">
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
    </div>
  );

  return (
    <SyncProvider>
    <TooltipProvider delayDuration={300}>
      <div className="relative h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-50 -translate-y-16 rounded-[8px] bg-gold-500 px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-float transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-gold-400/40"
        >
          {t("nav.skipToContent")}
        </a>
        <header
          aria-label={t("nav.topBar")}
          className="relative z-50 h-16 shrink-0 border-b border-border bg-background shadow-sm transition-colors duration-300"
        >
          <div
            className={cn(
              "relative mx-auto flex h-16 w-full min-w-0 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8",
              contentWidthClassName,
            )}
          >
            <div className="flex min-w-0 items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-[8px] lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label={t("nav.openMenu")}
                aria-expanded={mobileOpen}
              >
                <Menu className="size-5" />
              </Button>

              {/* Logo + text (mobile) */}
              <Link href="/dashboard" className="flex items-center gap-2.5 lg:hidden">
                <BrandLogo
                  alt=""
                  className="h-9 w-9 shrink-0"
                  imageClassName="brightness-0 dark:invert drop-shadow-[0_0_8px_rgba(232,199,102,0.25)] dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.18)]"
                  priority
                  sizes="36px"
                />
                <span className="whitespace-nowrap text-[16px] font-semibold tracking-tight text-foreground">
                  HealthyTech{" "}
                  <span className="bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 bg-clip-text font-bold text-transparent dark:from-gold-200 dark:via-gold-300 dark:to-gold-500">
                    Atlântico
                  </span>
                </span>
              </Link>

              <div className="hidden lg:flex items-center gap-6">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3"
                  aria-label={brandName}
                >
                  <BrandLogo
                    alt=""
                    className="h-10 w-10 shrink-0"
                    imageClassName="brightness-0 dark:invert drop-shadow-[0_0_8px_rgba(232,199,102,0.25)] dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.18)]"
                    priority
                    sizes="40px"
                  />
                  <span className="whitespace-nowrap text-[16px] font-semibold tracking-tight text-foreground">
                    HealthyTech{" "}
                    <span className="bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 bg-clip-text font-bold text-transparent dark:from-gold-200 dark:via-gold-300 dark:to-gold-500">
                      Atlântico
                    </span>
                  </span>
                </Link>
              </div>
            </div>

            {currentItem ? (
              <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2 text-sm lg:flex">
                <span className="text-gold-600 dark:text-gold-300">
                  {breadcrumbPrimary}
                </span>
                <ChevronRight className="size-3.5 text-muted-foreground/55" />
                <span className="font-normal text-navy-700 dark:text-navy-200">
                  {breadcrumbSecondary}
                </span>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCmdOpen(true)}
                    aria-haspopup="dialog"
                    className="hidden h-9 items-center gap-2 !rounded-[8px] border border-[#10243a10] bg-[#f8f9fb] px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-gold-100 dark:border-white/10 dark:bg-white/5 dark:text-navy-100 dark:hover:bg-white/10 sm:flex"
                  >
                    <Search className="size-4" />
                    <span className="whitespace-nowrap">
                      {t("commandPalette.commandLabel")}
                    </span>
                    <kbd className="ml-1 inline-flex h-5 items-center rounded border border-[#10243a15] bg-white px-1.5 text-[10px] font-medium text-navy-700 dark:border-white/15 dark:bg-white/10 dark:text-navy-200">
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

              <SyncStatusBadge />

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
                      size="icon"
                      className="hidden items-center justify-center rounded-full border-2 border-gold-500/30 hover:border-gold-500/50 hover:bg-transparent lg:flex size-8 p-0"
                    >
                      <Avatar className="size-full">
                        <AvatarFallback className="text-micro">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={10}
                    className="z-50 max-h-[calc(100vh-80px)] w-[320px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-[16px] border border-border bg-white p-2.5 shadow-[0_4px_12px_rgba(9,21,35,0.08)] dark:border-white/10 dark:bg-navy-950 dark:shadow-[0_4px_18px_rgba(0,0,0,0.22)]"
                  >
                    <div className="flex items-start gap-2.5 px-1 pb-2.5 pt-1">
                      <Avatar className="size-10 shadow-sm ring-1 ring-gold-500/20">
                        <AvatarFallback className="text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="truncate text-sm font-bold leading-tight tracking-tight text-foreground">
                          {displayName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-gold-700 dark:text-gold-200">
                          {roleLabels[user.role]}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <AccountMenuRow asChild>
                        <Link href="/perfil">
                          <AccountMenuIcon>
                            <User className="size-4" />
                          </AccountMenuIcon>
                          <span className="min-w-0 flex-1 truncate">
                            {t("nav.perfil")}
                          </span>
                        </Link>
                      </AccountMenuRow>
                    </div>

                    <div className="mt-2.5 grid gap-2">
                      <AccountMenuSectionLabel>
                        {t("nav.preferences")}
                      </AccountMenuSectionLabel>
                      <AccountMenuRow onClick={toggleTheme}>
                        <AccountMenuIcon tone="gold">
                          {theme === "light" ? (
                            <Moon className="size-4" />
                          ) : (
                            <Sun className="size-4" />
                          )}
                        </AccountMenuIcon>
                        <span className="min-w-0 flex-1 truncate">
                          {t("nav.changeTheme")}
                        </span>
                        <DropdownMenuShortcut className="text-xs font-semibold tracking-[0.16em] text-muted-foreground opacity-100">
                          {theme === "light"
                            ? t("nav.darkMode")
                            : t("nav.lightMode")}
                        </DropdownMenuShortcut>
                      </AccountMenuRow>
                      <AccountMenuRow onClick={toggleLocale}>
                        <AccountMenuIcon>
                          <Globe className="size-4" />
                        </AccountMenuIcon>
                        <span className="min-w-0 flex-1 truncate">
                          {t("nav.changeLanguage")}
                        </span>
                        <DropdownMenuShortcut className="text-xs font-bold tracking-[0.16em] text-navy-600 opacity-100 dark:text-navy-200">
                          {targetLocale}
                        </DropdownMenuShortcut>
                      </AccountMenuRow>
                      <AccountMenuRow
                      onSelect={(event) => {
                        event.preventDefault();
                        setAccessibilityOpen((value) => !value);
                      }}
                    >
                        <AccountMenuIcon>
                          <Settings2 className="size-4" />
                        </AccountMenuIcon>
                        <span className="min-w-0 flex-1 truncate">
                          {t("nav.accessibility")}
                        </span>
                        <DropdownMenuShortcut className="text-base font-semibold leading-none text-navy-600 opacity-100 dark:text-navy-200">
                        {accessibilityOpen ? "−" : "+"}
                      </DropdownMenuShortcut>
                      </AccountMenuRow>
                    {accessibilityOpen ? (
                        <div className="grid gap-2 rounded-[12px] border border-border/70 bg-background/35 p-2 dark:bg-white/[0.03]">
                          <div className="grid gap-1">
                            <AccountMenuSectionLabel>
                            {t("nav.textSize")}
                            </AccountMenuSectionLabel>
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
                                className="min-h-8 rounded-[10px] border border-transparent bg-transparent py-1.5 pl-8 pr-2.5 text-xs font-semibold text-foreground transition-colors data-[highlighted]:bg-background/65 data-[state=checked]:border-border/70 data-[state=checked]:bg-background/65 dark:data-[highlighted]:bg-white/[0.045] dark:data-[state=checked]:bg-white/[0.055] [&>span:first-child]:left-2.5 [&>span:first-child]:size-3 [&>span:first-child_svg]:size-2"
                            >
                              {t("nav.textSmall")}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value="default"
                                className="min-h-8 rounded-[10px] border border-transparent bg-transparent py-1.5 pl-8 pr-2.5 text-xs font-semibold text-foreground transition-colors data-[highlighted]:bg-background/65 data-[state=checked]:border-border/70 data-[state=checked]:bg-background/65 dark:data-[highlighted]:bg-white/[0.045] dark:data-[state=checked]:bg-white/[0.055] [&>span:first-child]:left-2.5 [&>span:first-child]:size-3 [&>span:first-child_svg]:size-2"
                            >
                              {t("nav.textDefault")}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value="large"
                                className="min-h-8 rounded-[10px] border border-transparent bg-transparent py-1.5 pl-8 pr-2.5 text-xs font-semibold text-foreground transition-colors data-[highlighted]:bg-background/65 data-[state=checked]:border-border/70 data-[state=checked]:bg-background/65 dark:data-[highlighted]:bg-white/[0.045] dark:data-[state=checked]:bg-white/[0.055] [&>span:first-child]:left-2.5 [&>span:first-child]:size-3 [&>span:first-child_svg]:size-2"
                            >
                              {t("nav.textLarge")}
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </div>
                          <DropdownMenuSeparator className="mx-1" />
                          <div className="grid gap-1">
                            <AccountMenuSectionLabel>
                            {t("nav.contrast")}
                            </AccountMenuSectionLabel>
                          <DropdownMenuRadioGroup
                            value={contrast}
                            onValueChange={(value) =>
                              setContrastMode(value as "normal" | "high")
                            }
                          >
                              <DropdownMenuRadioItem
                                value="normal"
                                className="min-h-8 rounded-[10px] border border-transparent bg-transparent py-1.5 pl-8 pr-2.5 text-xs font-semibold text-foreground transition-colors data-[highlighted]:bg-background/65 data-[state=checked]:border-border/70 data-[state=checked]:bg-background/65 dark:data-[highlighted]:bg-white/[0.045] dark:data-[state=checked]:bg-white/[0.055] [&>span:first-child]:left-2.5 [&>span:first-child]:size-3 [&>span:first-child_svg]:size-2"
                              >
                              {t("nav.contrastNormal")}
                            </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem
                                value="high"
                                className="min-h-8 rounded-[10px] border border-transparent bg-transparent py-1.5 pl-8 pr-2.5 text-xs font-semibold text-foreground transition-colors data-[highlighted]:bg-background/65 data-[state=checked]:border-border/70 data-[state=checked]:bg-background/65 dark:data-[highlighted]:bg-white/[0.045] dark:data-[state=checked]:bg-white/[0.055] [&>span:first-child]:left-2.5 [&>span:first-child]:size-3 [&>span:first-child_svg]:size-2"
                              >
                              {t("nav.contrastHigh")}
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </div>
                      </div>
                    ) : null}
                    </div>

                    <div className="mt-2.5 grid gap-2 border-t border-border/70 pt-2.5">
                      <AccountMenuRow
                        tone="danger"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                      >
                        <AccountMenuIcon tone="danger">
                          <LogOut className="size-4" />
                        </AccountMenuIcon>
                        <span className="min-w-0 flex-1 truncate">
                          {t("nav.logout")}
                        </span>
                      </AccountMenuRow>
                    </div>
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

        <div className="relative flex h-[calc(100vh-64px)] min-h-0 w-full flex-col overflow-hidden lg:flex-row">
          <aside
            aria-label={t("nav.sidebarNavigation")}
            className="z-30 hidden h-full w-[260px] shrink-0 overflow-hidden border-r border-border bg-card transition-colors duration-300 dark:border-navy-800 dark:bg-navy-950 lg:flex lg:flex-col"
          >
            <ScrollArea className="relative min-h-0 flex-1">
              <nav className="px-3 pb-10 pt-8">{sidebarNav()}</nav>
            </ScrollArea>

            <div className="relative shrink-0 border-t border-border p-3 dark:border-white/10">
              <div className="flex items-center gap-3 rounded-2xl px-3 py-2 text-foreground dark:text-white">
                <Avatar className="size-8 rounded-[14px] shadow-sm ring-1 ring-gold-500/20">
                  <AvatarFallback className="rounded-[14px] text-micro">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground dark:text-navy-200/68">
                    {roleLabels[user.role]}
                  </p>
                </div>
              </div>
            </div>
          </aside>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent
              side="left"
              data-theme="dark"
              title={t("nav.sidebarNavigation")}
              closeLabel={t("nav.closeMenu")}
              className="dark w-72 rounded-none border-r border-navy-800 p-0 transition-colors duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-navy-950" />

              <div className="relative z-10 flex h-full flex-col">
                <div className="relative flex shrink-0 items-center gap-3 border-b border-white/10 px-5 py-5">
                  <BrandLogo
                    alt={brandName}
                    className="h-12 w-12 shrink-0"
                    imageClassName="drop-shadow-[0_2px_8px_rgba(255,255,255,0.12)] brightness-0 invert"
                    sizes="48px"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold tracking-tight text-white">
                      HealthyTech <span className="text-gold-300">Atlântico</span>
                    </p>
                    <p className="text-micro font-semibold uppercase tracking-[0.22em] text-gold-300">
                      {currentItemLabel}
                    </p>
                  </div>
                </div>
                <ScrollArea className="min-h-0 flex-1">
                  <nav className="px-3 pb-8 pt-5">
                    {sidebarNav(() => setMobileOpen(false))}
                  </nav>
                </ScrollArea>
                <div className="shrink-0 border-t border-navy-200/50 p-3 dark:border-white/10">
                  <div className="rounded-[12px] border border-white/40 bg-white/50 p-3 text-navy-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 rounded-[14px] shadow-sm">
                        <AvatarFallback className="rounded-[14px] text-micro">
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
            className={cn(
              "relative mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-5 pb-6 sm:px-6 lg:p-8",
              contentWidthClassName,
            )}
          >
            {children}
          </main>

          <nav className="relative z-20 shrink-0 border-t border-white/45 bg-white/74 px-3 py-2 backdrop-blur-md transition-colors duration-300 dark:border-white/10 dark:bg-navy-950/78 lg:hidden">
            <div className="mx-auto grid max-w-xl grid-cols-5 gap-1.5">
              {mobileItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-[8px] px-2 py-1 text-micro font-semibold transition-all duration-300",
                      active
                        ? "bg-navy-100 text-navy-900 shadow-sm dark:bg-white/10 dark:text-white dark:shadow-[0_4px_18px_rgba(0,0,0,0.22)]"
                        : "text-navy-500 hover:bg-navy-50 hover:text-navy-900 dark:text-navy-300 dark:hover:bg-white/5 dark:hover:text-white",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-[8px]",
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
                  "flex flex-col items-center gap-0.5 rounded-[8px] px-2 py-1 text-micro font-semibold transition-all duration-300",
                  mobileOpen ||
                    (currentItem &&
                      !mobileItems.some(
                        (item) => item.href === currentItem.href,
                      ))
                    ? "bg-navy-100 text-navy-900 shadow-sm dark:bg-white/10 dark:text-white dark:shadow-[0_4px_18px_rgba(0,0,0,0.22)]"
                    : "text-navy-500 hover:bg-navy-50 hover:text-navy-900 dark:text-navy-300 dark:hover:bg-white/5 dark:hover:text-white",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-[8px]",
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
    </SyncProvider>
  );
}
