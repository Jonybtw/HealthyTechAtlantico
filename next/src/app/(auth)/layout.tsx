"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Activity, ClipboardList, FileText, Sun, Moon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { BrandLogo } from "@/components/brand-logo";
import { usePreferences } from "@/hooks/use-preferences";

const HIGHLIGHTS = [
  {
    icon: ClipboardList,
    titleKey: "highlightSecurity" as const,
  },
  {
    icon: Activity,
    titleKey: "highlightMonitoring" as const,
  },
  {
    icon: FileText,
    titleKey: "highlightExperience" as const,
  },
];

const COLEGIO_IMAGES = [
  "/fotosColegio/1.jpeg",
  "/fotosColegio/2.jpeg",
  "/fotosColegio/3.jpeg",
  "/fotosColegio/4.jpeg",
  "/fotosColegio/5.jpeg",
  "/fotosColegio/6.jpeg",
];

function LoginHeroCarousel({
  images,
  intervalMs = 5200,
}: {
  images: string[];
  intervalMs?: number;
}) {
  const safeImages = images.length ? images : ["/logo.png"];
  const [index, setIndex] = useState(0);
  const activeSrc = safeImages[index % safeImages.length];

  useEffect(() => {
    if (safeImages.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % safeImages.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, safeImages.length]);

  return (
    <div className="absolute inset-0 h-full w-full opacity-30 mix-blend-overlay">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeSrc}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={activeSrc}
            alt="Ambiente do Colégio Atlântico"
            fill
            sizes="50vw"
            className="object-cover"
            priority
          />
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

  return (
    <main className="flex min-h-screen w-full flex-col bg-navy-50 dark:bg-navy-950/40 md:h-screen md:flex-row md:overflow-hidden">
      {/* Preferences Controls (Absolute top-right) */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-navy-900/60 text-navy-900 dark:text-white transition-all hover:bg-white dark:hover:bg-navy-800 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm"
          aria-label="Toggle theme"
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
        </button>
        <button
          type="button"
          onClick={toggleLocale}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-navy-900/60 text-navy-950 dark:text-white transition-all hover:bg-white dark:hover:bg-navy-800 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm font-semibold text-xs tracking-widest uppercase"
          aria-label="Toggle language"
        >
          {locale}
        </button>
      </div>

      {/* Left Side: Visual Anchor (Slideshow + Brand) */}
      <section className="hidden md:flex md:w-1/2 bg-gradient-to-br from-navy-800 via-navy-700 to-navy-900 relative flex-col justify-between p-12 lg:p-20 overflow-hidden">
        <LoginHeroCarousel images={COLEGIO_IMAGES} />

        {/* Brand Logo Top */}
        <div className="relative z-10">
          <BrandLogo
            className="h-[80px] w-[80px] lg:h-[100px] lg:w-[100px]"
            imageClassName="brightness-0 invert"
            priority
          />
        </div>

        {/* Copy Bottom */}
        <div className="relative z-10 max-w-lg text-white mt-auto">
          <h1 className="font-display text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Excelência no <br />
            Cuidado Educacional.
          </h1>
          <p className="text-lg lg:text-xl font-light text-navy-100 leading-relaxed max-w-md">
            A plataforma integrada de saúde do Atlântico, unindo tecnologia
            clínica e bem-estar estudantil num ambiente digital seguro.
          </p>

          <div className="flex flex-wrap gap-2 mt-8">
            {HIGHLIGHTS.map(({ icon: Icon, titleKey }) => (
              <span
                key={titleKey}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md"
              >
                <Icon className="size-4 text-gold-300" />
                {t(titleKey)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Right Side: Interaction Canvas */}
      <section className="relative flex w-full flex-col items-center justify-start overflow-y-auto bg-navy-50/50 px-6 pb-10 pt-24 dark:bg-navy-950/20 sm:px-8 sm:pb-12 sm:pt-28 md:w-1/2 md:px-12 md:pb-12 md:pt-12 lg:px-24 lg:pb-16 lg:pt-16">
        {/* Ambient orbs */}
        <div
          className="pointer-events-none absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] -z-10"
          style={{ background: "rgba(5,41,122,0.1)" }}
        />
        <div
          className="pointer-events-none absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] -z-10"
          style={{ background: "rgba(216,173,52,0.1)" }}
        />
        <div
          className="pointer-events-none absolute top-2/3 right-1/3 w-64 h-64 rounded-full blur-[100px] -z-10"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
        <div className="mb-8 flex justify-center md:hidden">
          <BrandLogo className="h-[72px] w-[72px]" priority />
        </div>

        <div className="relative z-10 flex w-full flex-col items-center">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-8 w-full max-w-md text-center md:mt-10">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-navy-400 dark:text-navy-600 mb-1">
            Uso Exclusivo Escolar - Atlântico
          </p>
          <p className="text-xs text-navy-400/80 dark:text-navy-600/80">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </section>
    </main>
  );
}
