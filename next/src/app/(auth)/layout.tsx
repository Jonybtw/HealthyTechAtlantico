"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Activity, ClipboardList, FileText, Moon, Sun } from "lucide-react";
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
  "/fotosColegio/1.webp",
  "/fotosColegio/2.webp",
  "/fotosColegio/3.webp",
  "/fotosColegio/4.webp",
  "/fotosColegio/5.webp",
  "/fotosColegio/6.webp",
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
    <main className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-navy-950">
      <LoginHeroCarousel images={COLEGIO_IMAGES} />

      <div className="absolute inset-0 z-0 bg-[linear-gradient(112deg,rgba(9,21,35,0.9),rgba(9,21,35,0.68)_45%,rgba(9,21,35,0.84))] dark:bg-[linear-gradient(112deg,rgba(4,10,20,0.95),rgba(4,10,20,0.8)_45%,rgba(4,10,20,0.9))]" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_24%,rgba(244,211,94,0.12),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.1),transparent_26%)]" />

      <div className="absolute right-4 top-4 z-50 flex items-center gap-3 sm:right-6 sm:top-6">
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
          className="h-10 w-10 rounded-full border-white/25 bg-white/18 text-xs font-semibold uppercase tracking-widest text-white shadow-card hover:bg-white/24 dark:border-white/12 dark:bg-navy-900/60 dark:text-white dark:hover:bg-navy-800"
          aria-label="Toggle language"
        >
          {locale}
        </Button>
      </div>

      <div className="relative z-10 grid w-full max-w-[1240px] items-center gap-6 px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:gap-12 lg:px-10 xl:gap-16">
        <div className="order-2 mx-auto w-full max-w-[600px] lg:order-1">
          <section className="rounded-[32px] border border-white/12 bg-white/8 p-6 shadow-[0_28px_70px_rgba(5,14,24,0.34)] backdrop-blur-md sm:p-8 lg:p-10">
            <div className="flex flex-col items-center text-center text-white lg:items-start lg:text-left">
              <div className="mb-6">
                <BrandLogo
                  className="h-[128px] w-[220px] sm:h-[144px] sm:w-[248px]"
                  imageClassName="brightness-0 invert drop-shadow-md"
                  priority
                />
              </div>

              <h1 className="max-w-[11ch] font-display text-4xl font-semibold leading-[0.94] tracking-[-0.06em] text-white drop-shadow-md sm:text-[3.2rem] xl:text-[3.6rem]">
                Excelência no Acompanhamento Escolar.
              </h1>

              <p className="mt-5 max-w-[35rem] text-base leading-8 text-white/84 drop-shadow-md sm:text-lg">
                A plataforma digital integrada do Colégio Atlântico que alia a
                avaliação física ao bem-estar dos alunos, num ambiente seguro e
                transparente.
              </p>

              <div className="mt-8 inline-flex items-center rounded-full border border-white/18 bg-white/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-200 shadow-sm backdrop-blur-md sm:text-xs">
                Departamento de Educação Física
              </div>

              <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
                {HIGHLIGHTS.map(({ icon: Icon, titleKey }) => (
                  <div
                    key={titleKey}
                    className="inline-flex min-h-[56px] items-center gap-3 rounded-2xl border border-white/12 bg-navy-950/28 px-4 py-3 text-left text-sm font-medium text-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-gold-300/22 bg-gold-300/10 text-gold-200">
                      <Icon className="size-4" />
                    </span>
                    <span className="leading-snug">{t(titleKey)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="order-1 mx-auto flex w-full max-w-[430px] flex-col items-center lg:order-2">
          <div className="relative z-10 w-full">{children}</div>

          <div className="mt-6 w-full text-center lg:text-left">
            <p className="mb-1 text-micro font-medium uppercase tracking-[0.15em] text-white/60 drop-shadow-md md:text-xs">
              Uso Exclusivo Escolar - Atlântico
            </p>
            <p className="text-micro text-white/40 drop-shadow-md md:text-xs">
              {t("copyright", { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
