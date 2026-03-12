"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Activity, Globe, Moon, ShieldCheck, Sparkles, Sun } from "lucide-react";
import { useTheme, writeTheme } from "@/lib/theme";

function getInitialLocale() {
  if (typeof document === "undefined") return "pt";
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  return match?.[1] ?? "pt";
}

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    titleKey: "highlightSecurity" as const,
  },
  {
    icon: Activity,
    titleKey: "highlightMonitoring" as const,
  },
  {
    icon: Sparkles,
    titleKey: "highlightExperience" as const,
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("authLayout");
  const tNav = useTranslations("nav");
  const theme = useTheme();
  const router = useRouter();
  const [locale, setLocale] = useState(getInitialLocale);

  const toggleTheme = () => {
    writeTheme(theme === "light" ? "dark" : "light");
  };

  const toggleLocale = () => {
    const nextLocale = locale === "pt" ? "en" : "pt";
    setLocale(nextLocale);
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-[linear-gradient(160deg,#091523_0%,#14304c_60%,#203f56_100%)]">
      {/* Ambient floating orbs */}
      <div aria-hidden="true" className="animate-float-a pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full bg-gold-300/6 blur-3xl" />
      <div aria-hidden="true" className="animate-float-b pointer-events-none absolute -bottom-40 -left-20 size-[500px] rounded-full bg-white/4 blur-3xl" />
      {/* Gold glow — decorative */}
      <div
        aria-hidden="true"
        role="presentation"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(217,166,28,0.18),transparent)]"
      />

      {/* Top-right: theme + language toggles */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={tNav("changeTheme")}
          className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white/70 transition hover:bg-white/15 hover:text-white"
        >
          {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
        <button
          type="button"
          onClick={toggleLocale}
          aria-label={tNav("changeLanguage")}
          className="flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 text-xs font-medium text-white/70 transition hover:bg-white/15 hover:text-white"
        >
          <Globe className="size-3.5" />
          {locale.toUpperCase()}
        </button>
      </div>

      <div className="relative mx-auto flex w-full max-w-sm flex-col items-center gap-7 px-4 py-12 pb-16">
        {/* Logo */}
        <Image
          src="/logo.png"
          alt="HealthyTech Atlantico"
          width={152}
          height={40}
          className="object-contain brightness-0 invert"
          priority
        />

        <p className="text-center text-[11px] font-medium uppercase tracking-[0.22em] text-navy-100/50">
          {t("department")}
        </p>

        {/* Headline */}
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-white">
            {t("headline")}
          </h1>
          <p className="text-sm leading-relaxed text-navy-100/65">
            {t("subtitle")}
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {HIGHLIGHTS.map(({ icon: Icon, titleKey }) => (
            <span
              key={titleKey}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-medium text-white/80"
            >
              <Icon className="size-3.5 text-gold-300" />
              {t(titleKey)}
            </span>
          ))}
        </div>

        {/* Form card */}
        <div className="w-full">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-navy-200/45">
          {t("copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </main>
  );
}
