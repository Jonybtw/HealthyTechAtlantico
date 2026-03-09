"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import type { Role } from "@prisma/client";
import {
  Activity,
  BarChart3,
  BookOpen,
  ClipboardList,
  FileText,
  FileSearch,
  Globe,
  Heart,
  Home,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
  User,
  UserCheck,
  Users,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "nav.dashboard", icon: <Home size={18} />, roles: ["ADMIN", "PROFESSOR", "ALUNO", "PSICOLOGO", "PAIS"] },
  { href: "/biometria", label: "nav.biometria", icon: <Activity size={18} />, roles: ["ADMIN", "ALUNO", "PROFESSOR"] },
  { href: "/testes", label: "nav.testes", icon: <ClipboardList size={18} />, roles: ["ADMIN", "ALUNO", "PROFESSOR"] },
  { href: "/questionarios", label: "nav.questionarios", icon: <BookOpen size={18} />, roles: ["ALUNO"] },
  { href: "/sos", label: "nav.sos", icon: <AlertTriangle size={18} />, roles: ["ADMIN", "ALUNO", "PROFESSOR", "PSICOLOGO"] },
  { href: "/relatorio", label: "nav.relatorio", icon: <FileText size={18} />, roles: ["ADMIN", "ALUNO", "PROFESSOR", "PAIS"] },
  { href: "/analise", label: "nav.analise", icon: <BarChart3 size={18} />, roles: ["ADMIN", "PROFESSOR"] },
  { href: "/turma", label: "nav.turma", icon: <Users size={18} />, roles: ["ADMIN", "PROFESSOR"] },
  { href: "/dispensas", label: "nav.dispensas", icon: <Shield size={18} />, roles: ["ADMIN", "PROFESSOR"] },
  { href: "/protocolos", label: "nav.protocolos", icon: <Heart size={18} />, roles: ["ADMIN", "ALUNO", "PROFESSOR", "PAIS"] },
  { href: "/alunos", label: "nav.alunos", icon: <Users size={18} />, roles: ["ADMIN", "PROFESSOR"] },
  { href: "/perfil", label: "nav.perfil", icon: <User size={18} />, roles: ["ADMIN", "PROFESSOR", "ALUNO", "PSICOLOGO", "PAIS"] },
  { href: "/guardioes", label: "nav.guardioes", icon: <UserCheck size={18} />, roles: ["ADMIN", "PROFESSOR"] },
  { href: "/admin", label: "nav.admin", icon: <Settings size={18} />, roles: ["ADMIN"] },
  { href: "/auditoria", label: "nav.auditoria", icon: <FileSearch size={18} />, roles: ["ADMIN"] },
];

interface AppShellProps {
  user: { id: string; email: string; role: Role };
  children: React.ReactNode;
}

function getInitialTheme(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-theme") === "dark";
}

function getInitialLocale(): string {
  if (typeof document === "undefined") return "pt";
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  return match?.[1] ?? "pt";
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const [dark, setDark] = useState(getInitialTheme);
  const [locale, setLocale] = useState(getInitialLocale);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const toggleLocale = () => {
    const next = locale === "pt" ? "en" : "pt";
    setLocale(next);
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000`;
    router.refresh();
  };

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  const roleLabels: Record<Role, string> = {
    ADMIN: t("roles.ADMIN"),
    PROFESSOR: t("roles.PROFESSOR"),
    ALUNO: t("roles.ALUNO"),
    PSICOLOGO: t("roles.PSICOLOGO"),
    PAIS: t("roles.PAIS"),
  };

  const initials = user.email.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background relative z-0">
      <div className="bg-mesh" />
      <div className="bg-noise" />
      {/* ── Sidebar (desktop) ─────────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 fixed inset-y-0 left-0 z-30
                        bg-navy-950 border-r border-navy-800/40 shadow-float">
        {/* Logo area */}
        <div className="flex items-center px-5 py-6 border-b border-navy-800/40 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
          <Image
            src="/logo.png"
            alt="HealthyTech Atlântico"
            width={148}
            height={38}
            className="object-contain brightness-0 invert opacity-95 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          />
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {visibleItems.map((item, i) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`animate-slide-left group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden ${active
                  ? "bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] shadow-inner ring-1 ring-white/5"
                  : "text-navy-300 hover:text-white"
                  }`}
                style={{ animationDelay: `${i * 25}ms`, animationFillMode: "both" }}
              >
                {/* Spotlight Hover Effect */}
                {!active && (
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
                )}

                {/* Active indicator */}
                {active && (
                  <span className="absolute left-0 h-8 w-1 rounded-r-full bg-gradient-to-b from-gold-300 to-gold-500 ml-0 shadow-[0_0_8px_rgba(224,180,40,0.5)]" />
                )}
                <span className={`relative z-10 transition-all duration-300 ${active ? "text-gold-400 drop-shadow-[0_0_4px_rgba(224,180,40,0.4)]" : "text-navy-400 group-hover:text-gold-400/50"}`}>
                  {item.icon}
                </span>
                <span className="relative z-10">{t(item.label as Parameters<typeof t>[0])}</span>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-navy-800/40 px-4 py-5 flex flex-col gap-4 relative">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          {/* Avatar row */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-gold-600
                            flex items-center justify-center text-sm font-bold text-navy-950 shadow-[0_0_12px_rgba(224,180,40,0.3)] ring-2 ring-navy-950">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight tracking-wide">{user.email}</p>
              <p className="text-xs text-gold-200/70 font-medium leading-tight mt-0.5">{roleLabels[user.role]}</p>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-navy-300
                         hover:bg-white/10 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
              title={t("nav.changeTheme")}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={toggleLocale}
              className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-navy-300
                         hover:bg-white/10 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
              title={t("nav.changeLanguage")}
            >
              <Globe size={16} />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-navy-300
                         hover:bg-danger-500/20 hover:text-danger-400 transition-all duration-300 hover:scale-105 active:scale-95"
              title={t("nav.logout")}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <header
          className="lg:hidden flex items-center justify-between px-5 py-3.5
                     bg-navy-950 border-b border-navy-800/40 sticky top-0 z-20 shadow-sm"
          style={{ animation: "slideDown 0.3s ease both" }}
        >
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <Image
            src="/logo.png"
            alt="HealthyTech Atlântico"
            width={120}
            height={32}
            className="object-contain brightness-0 invert opacity-95 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-navy-300 hover:bg-white/10 hover:text-white transition-all duration-150"
              title={t("nav.changeTheme")}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={toggleLocale}
              className="p-2 rounded-lg text-navy-300 hover:bg-white/10 hover:text-white transition-all duration-150"
              title={t("nav.changeLanguage")}
            >
              <Globe size={16} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 page-enter">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20
                        bg-navy-950 border-t border-navy-800/40 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="flex items-center justify-around px-2 py-2">
            {visibleItems.slice(0, 5).map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl
                              text-[10px] font-medium transition-all duration-300 ${active
                      ? "text-white bg-white/5"
                      : "text-navy-400 hover:text-navy-200"
                    }`}
                >
                  {active && (
                    <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-b-full bg-gradient-to-r from-gold-300 to-gold-500 shadow-[0_2px_8px_rgba(224,180,40,0.5)]" />
                  )}
                  <span className={`transition-all duration-300 ${active ? "text-gold-400 drop-shadow-[0_0_4px_rgba(224,180,40,0.4)] scale-110" : "scale-100"}`}>{item.icon}</span>
                  <span className="tracking-wide">{t(item.label as Parameters<typeof t>[0])}</span>
                </Link>
              );
            })}
            <Link
              href="/perfil"
              className={`relative flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl
                          text-[10px] font-medium transition-all duration-300 ${pathname === "/perfil"
                  ? "text-white bg-white/5"
                  : "text-navy-400 hover:text-navy-200"
                }`}
            >
              {pathname === "/perfil" && (
                <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-b-full bg-gradient-to-r from-gold-300 to-gold-500 shadow-[0_2px_8px_rgba(224,180,40,0.5)]" />
              )}
              <span className={`transition-all duration-300 ${pathname === "/perfil" ? "text-gold-400 drop-shadow-[0_0_4px_rgba(224,180,40,0.4)] scale-110" : "scale-100"}`}><User size={18} /></span>
              <span className="tracking-wide">{t("nav.perfil")}</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
