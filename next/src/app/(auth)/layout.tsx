"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Activity, ClipboardList, FileText, Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/hooks/use-preferences";
import { useReducedEffects } from "@/hooks/use-reduced-effects";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  { icon: ClipboardList, titleKey: "highlightSecurity" as const },
  { icon: Activity, titleKey: "highlightMonitoring" as const },
  { icon: FileText, titleKey: "highlightExperience" as const },
];

const SLIDE_INTERVAL_MS = 5800;

const IMAGE_CONFIG = [
  { src: "/fotosColegio/1.webp", objectPosition: "center 40%" },
  { src: "/fotosColegio/2.webp", objectPosition: "center 35%" },
  { src: "/fotosColegio/3.webp", objectPosition: "center 55%" },
  { src: "/fotosColegio/4.webp", objectPosition: "center 25%" },
  { src: "/fotosColegio/5.webp", objectPosition: "center 40%" },
  { src: "/fotosColegio/6.webp", objectPosition: "center 50%" },
];

function LoginHeroCarousel({
  index,
  reducedEffects,
}: {
  index: number;
  reducedEffects: boolean;
}) {
  const active = IMAGE_CONFIG[index % IMAGE_CONFIG.length];

  if (reducedEffects) {
    return (
      <div className="absolute inset-0 h-full w-full">
        <Image
          src={active.src}
          alt="Ambiente do Colégio Atlântico"
          fill
          sizes="60vw"
          className="object-cover"
          style={{ objectPosition: active.objectPosition }}
          priority
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 h-full w-full">
      <AnimatePresence initial={false}>
        <motion.div
          key={active.src}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Ken Burns zoom layer */}
          <motion.div
            initial={{ scale: 1.0 }}
            animate={{ scale: 1.09 }}
            transition={{ duration: SLIDE_INTERVAL_MS / 1000 + 1.4, ease: "linear" }}
            className="absolute inset-0"
          >
            <Image
              src={active.src}
              alt="Ambiente do Colégio Atlântico"
              fill
              sizes="60vw"
              className="object-cover"
              style={{ objectPosition: active.objectPosition }}
              priority
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("authLayout");
  const { theme, locale, toggleTheme, toggleLocale } = usePreferences();
  const reducedEffects = useReducedEffects();
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (reducedEffects) return;
    const id = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % IMAGE_CONFIG.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reducedEffects]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_480px]">

      {/* ── Left: cinematic image panel (desktop only) ── */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col">
        <LoginHeroCarousel index={slideIndex} reducedEffects={reducedEffects} />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 z-10 bg-[linear-gradient(150deg,rgba(9,21,35,0.65),rgba(9,21,35,0.35)_50%,rgba(9,21,35,0.72))]" />
        {/* Gold radial accent */}
        <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_20%_28%,rgba(244,211,94,0.14),transparent_42%)]" />
        {/* Gold gradient top line */}
        <div className="absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />

        {/* Branding content */}
        <div className="relative z-20 flex flex-1 flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="flex items-center gap-4 self-start opacity-90 transition-opacity hover:opacity-100">
            <BrandLogo
              className="h-14 w-14 shrink-0"
              imageClassName="brightness-0 invert drop-shadow-[0_0_16px_rgba(232,199,102,0.35)]"
              priority
              sizes="56px"
            />
            <span className="font-display text-[2.4rem] font-semibold leading-none tracking-tight text-white">
              HealthyTech{" "}
              <span className="bg-gradient-to-r from-gold-200 via-gold-300 to-gold-500 bg-clip-text font-bold text-transparent">
                Atlântico
              </span>
            </span>
          </Link>

          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-300">
              {t("department")}
            </p>

            <h2 className="font-display text-[2.6rem] font-semibold leading-[0.92] tracking-[-0.04em] text-white drop-shadow-md xl:text-[3.2rem]">
              {t("headline")}
            </h2>

            <p className="mt-5 max-w-[34rem] text-base leading-8 text-white/80">
              {t("subtitle")}
            </p>

            <div className="mt-8 grid max-w-[400px] gap-2">
              {HIGHLIGHTS.map(({ icon: Icon, titleKey }) => (
                <div
                  key={titleKey}
                  className="flex items-center gap-3 rounded-[16px] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium text-white/90 backdrop-blur-sm"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] border border-white/15 bg-white/10 text-gold-300">
                    <Icon className="size-4" />
                  </span>
                  <span className="leading-snug">{t(titleKey)}</span>
                </div>
              ))}
            </div>

            {/* Slide progress dots */}
            <div className="mt-6 flex items-center gap-2">
              {IMAGE_CONFIG.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    i === slideIndex
                      ? "w-5 bg-gold-400"
                      : "w-1.5 bg-white/30 hover:bg-white/60",
                  )}
                />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex min-h-screen flex-col bg-navy-950/80 backdrop-blur-xl">
        {/* Top bar — matches app shell header */}
        <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-transparent px-4 sm:px-6">
          {/* Logo + text (mobile) */}
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <BrandLogo
              className="h-9 w-9"
              imageClassName="brightness-0 invert dark:brightness-0 dark:invert-0"
              priority
              sizes="36px"
            />
            <span className="text-base font-bold tracking-tight text-white">
              HealthyTech <span className="text-gold-300">Atlântico</span>
            </span>
          </Link>
          <div className="hidden lg:block" />
          {/* Theme + locale toggles */}
          <div className="flex items-center gap-1.5">
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="icon"
              className="size-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t("toggleThemeLabel")}
              title={
                theme === "light"
                  ? "Mudar para modo escuro"
                  : "Mudar para modo claro"
              }
            >
              {theme === "light" ? (
                <Moon className="size-4" />
              ) : (
                <Sun className="size-4" />
              )}
            </Button>
            <Button
              onClick={toggleLocale}
              variant="ghost"
              size="icon"
              className="size-9 rounded-full text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t("toggleLanguageLabel")}
            >
              {locale}
            </Button>
          </div>
        </header>

        {/* Scrollable form area */}
        <div className="relative flex flex-1 items-center justify-center px-5 py-8 sm:px-6">
          {/* Subtle radial gold glow at top */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_50%_0%,rgba(244,211,94,0.06),transparent_60%)]" />
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 pb-6 text-center sm:px-6">
          <p className="text-[11px] text-muted-foreground/40">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </div>
  );
}
