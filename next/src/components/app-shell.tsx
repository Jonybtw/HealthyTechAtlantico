"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import {
  Activity,
  BarChart3,
  BookOpen,
  ClipboardList,
  FileText,
  Heart,
  Home,
  LogOut,
  Moon,
  Shield,
  Sun,
  User,
  Users,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <Home size={20} />,
    roles: ["PROFESSOR"],
  },
  {
    href: "/biometria",
    label: "Biometria",
    icon: <Activity size={20} />,
    roles: ["ALUNO", "PROFESSOR"],
  },
  {
    href: "/testes",
    label: "Testes",
    icon: <ClipboardList size={20} />,
    roles: ["ALUNO", "PROFESSOR"],
  },
  {
    href: "/questionarios",
    label: "Questionários",
    icon: <BookOpen size={20} />,
    roles: ["ALUNO"],
  },
  {
    href: "/sos",
    label: "SOS",
    icon: <AlertTriangle size={20} />,
    roles: ["ALUNO", "PROFESSOR", "PSICOLOGO"],
  },
  {
    href: "/relatorio",
    label: "Relatório",
    icon: <FileText size={20} />,
    roles: ["ALUNO", "PROFESSOR", "PAIS"],
  },
  {
    href: "/analise",
    label: "Análise",
    icon: <BarChart3 size={20} />,
    roles: ["PROFESSOR"],
  },
  {
    href: "/turma",
    label: "Turma",
    icon: <Users size={20} />,
    roles: ["PROFESSOR"],
  },
  {
    href: "/dispensas",
    label: "Dispensas",
    icon: <Shield size={20} />,
    roles: ["PROFESSOR"],
  },
  {
    href: "/protocolos",
    label: "Protocolos",
    icon: <Heart size={20} />,
    roles: ["ALUNO", "PROFESSOR", "PAIS"],
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon: <User size={20} />,
    roles: ["ALUNO", "PROFESSOR", "PSICOLOGO", "PAIS"],
  },
];

interface AppShellProps {
  user: {
    id: string;
    email: string;
    role: Role;
  };
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role)
  );

  const roleLabels: Record<Role, string> = {
    PROFESSOR: "Professor",
    ALUNO: "Aluno",
    PSICOLOGO: "Psicólogo",
    PAIS: "Enc. Educação",
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar (desktop) ─────────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-card border-r border-border fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-navy-800 flex items-center justify-center">
            <span className="text-gold-400 font-bold text-sm">AF</span>
          </div>
          <span className="font-display text-lg text-foreground">
            AtlanticoFit
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-navy-800 text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-navy-100 flex items-center justify-center text-xs font-bold text-navy-800">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                {roleLabels[user.role]}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
              title="Alternar tema"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-md hover:bg-danger-50 text-muted-foreground hover:text-danger-600"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-navy-800 flex items-center justify-center">
              <span className="text-gold-400 font-bold text-xs">AF</span>
            </div>
            <span className="font-display text-base">AtlanticoFit</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border z-20 shadow-nav">
          <div className="flex items-center justify-around py-1">
            {visibleItems.slice(0, 5).map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] rounded-lg transition-colors ${
                    active
                      ? "text-navy-800 font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Link
              href="/perfil"
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] rounded-lg transition-colors ${
                pathname === "/perfil"
                  ? "text-navy-800 font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              <User size={20} />
              <span>Perfil</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
