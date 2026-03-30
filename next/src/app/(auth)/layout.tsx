"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Activity, ClipboardList, FileText, Sun, Moon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
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
  intervalMs = Math.max(5200, 10000),
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
    <div className="absolute inset-0 h-full w-full">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeSrc}
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={activeSrc}
            alt="Ambiente do Colégio Atlântico"
            fill
            sizes="100vw"
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
    <main className="relative flex min-h-screen w-full flex-col justify-center items-center bg-navy-950 overflow-hidden">
      {/* Fullscreen Background Slideshow */}
      <LoginHeroCarousel images={COLEGIO_IMAGES} />

      {/* Overlay to ensure form readability over varied images */}
      <div className="absolute inset-0 bg-navy-900/60 dark:bg-navy-950/70  z-0" />

      {/* Preferences Controls (Absolute top-right) */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <Button
          onClick={toggleTheme}
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full border-white/25 bg-white/18 text-white shadow-card hover:bg-white/24 dark:border-white/12 dark:bg-navy-900/60 dark:text-white dark:hover:bg-navy-800"
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
        </Button>
        <Button
          onClick={toggleLocale}
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full border-white/25 bg-white/18 text-xs font-semibold tracking-widest text-white uppercase shadow-card hover:bg-white/24 dark:border-white/12 dark:bg-navy-900/60 dark:text-white dark:hover:bg-navy-800"
          aria-label="Toggle language"
        >
          {locale}
        </Button>
      </div>

      {/* Main Foreground Layout */}
      <div className="relative z-10 flex w-full max-w-6xl flex-col md:flex-row items-center justify-center gap-12 lg:gap-24 px-6 py-12">
        {/* Left Side: Logo, Text and Highlights */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left text-white max-w-lg">
          <div className="mb-8">
            <BrandLogo
              className="h-[140px] w-[140px] md:h-[180px] md:w-[180px]"
              imageClassName="brightness-0 invert drop-shadow-md"
              priority
            />
          </div>

          <h1 className="font-display text-3xl md:text-3xl font-extrabold tracking-tight mb-4 drop-shadow-md leading-tight">
            Excelência no <br className="hidden md:block" />
            Cuidado Educacional.
          </h1>
          <p className="text-sm md:text-lg font-light text-white/90 leading-relaxed drop-shadow-md mb-8">
            A plataforma integrada de saúde do Atlântico, unindo tecnologia
            clínica e bem-estar estudantil num ambiente digital seguro.
          </p>

          <div className="mb-8 inline-flex items-center rounded-full border border-white/18 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-200 shadow-sm backdrop-blur-md md:text-sm">
            Departamento de Educação Física
          </div>

          {/* Highlights/Tags */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-8 md:mb-0">
            {HIGHLIGHTS.map(({ icon: Icon, titleKey }) => (
              <span
                key={titleKey}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/20 px-4 py-2 text-xs md:text-sm font-medium text-white/90  shadow-sm"
              >
                <Icon className="size-4 text-gold-300" />
                {t(titleKey)}
              </span>
            ))}
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="w-full relative z-10">{children}</div>

          {/* Footer */}
          <div className="mt-8 text-center md:text-left w-full pl-2">
            <p className="text-micro md:text-xs font-medium uppercase tracking-[0.15em] text-white/60 mb-1 drop-shadow-md">
              Uso Exclusivo Escolar - Atlântico
            </p>
            <p className="text-micro md:text-xs text-white/40 drop-shadow-md">
              {t("copyright", { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
