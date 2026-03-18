"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Activity, ShieldCheck, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

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
  variant = "card",
}: {
  images: string[];
  intervalMs?: number;
  variant?: "card" | "background";
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
    <section
      className={[
        "w-full",
        variant === "background" ? "fixed inset-0 h-screen w-screen" : "",
      ].join(" ")}
    >
      <div
        className={[
          "relative w-full overflow-hidden",
          variant === "background"
            ? "h-full rounded-none border-0 bg-transparent shadow-none"
            : "h-[240px] rounded-[20px] border border-white/15 bg-white/5 shadow-[0_28px_80px_-28px_rgba(0,0,0,0.60)]",
        ].join(" ")}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeSrc}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Image
              src={activeSrc}
              alt="Ambiente do Colégio Atlântico"
              fill
              sizes={variant === "background" ? "100vw" : "(max-width: 640px) 92vw, 500px"}
              className="object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>

        {/* Readability overlays */}
        <div
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-0",
            variant === "background"
              ? "bg-gradient-to-t from-[#091523]/85 via-[#091523]/30 to-[#091523]/15"
              : "bg-gradient-to-t from-[#091523]/75 via-transparent to-transparent",
          ].join(" ")}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_10%,rgba(217,166,28,0.18),transparent)]"
        />

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1.5 backdrop-blur">
          {safeImages.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Ver foto ${i + 1} de ${safeImages.length}`}
              onClick={() => setIndex(i)}
              className="p-1"
            >
              <span
                className={[
                  "block h-1.5 rounded-full transition-all duration-300",
                  i === (index % safeImages.length) ? "w-5 bg-gold-300" : "w-1.5 bg-white/40 hover:bg-white/60",
                ].join(" ")}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      {variant === "background" ? null : safeImages.length > 1 ? (
        <div className="mt-3 grid grid-cols-6 gap-2">
          {safeImages.slice(0, 6).map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              className={[
                "relative h-10 overflow-hidden rounded-xl border transition",
                i === (index % safeImages.length)
                  ? "border-gold-300/70 ring-2 ring-gold-300/30"
                  : "border-white/10 hover:border-white/25",
              ].join(" ")}
              aria-label={`Selecionar foto ${i + 1}`}
            >
              <Image src={src} alt="" fill sizes="92px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("authLayout");
  const pathname = usePathname();

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-[linear-gradient(160deg,#091523_0%,#14304c_60%,#203f56_100%)]">
      {/* Ambient floating orbs */}
      <div aria-hidden="true" className="animate-float-a pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full bg-gold-300/6 blur-3xl" />
      <div aria-hidden="true" className="animate-float-b pointer-events-none absolute -bottom-40 -left-20 size-[500px] rounded-full bg-white/4 blur-3xl" />
      {/* Gold glow decorative */}
      <div
        aria-hidden="true"
        role="presentation"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(217,166,28,0.18),transparent)]"
      />

      {pathname === "/login" ? (
        <div className="relative min-h-screen">
          {/* Fullscreen background slideshow */}
          <div aria-hidden="true" className="fixed inset-0">
            <LoginHeroCarousel images={COLEGIO_IMAGES} variant="background" />
          </div>

          {/* Foreground content */}
          <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-6 sm:py-8 lg:px-8 lg:py-8">
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:items-center lg:gap-8">
              {/* Left: branding copy */}
              <div className="order-2 hidden space-y-6 lg:order-1 lg:block">
                <div className="flex items-center gap-4">
                  <Image
                    src="/logo.png"
                    alt="HealthyTech Atlantico"
                    width={160}
                    height={40}
                    className="object-contain brightness-0 invert"
                    priority
                  />
                </div>

                <div className="space-y-3">
                  <h1 className="font-display text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl lg:text-[26px]">
                    {t("headline")}
                  </h1>
                  <p className="max-w-xl text-[13px] leading-relaxed text-navy-100/75 sm:text-sm lg:text-base">
                    {t("subtitle")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {HIGHLIGHTS.map(({ icon: Icon, titleKey }) => (
                    <span
                      key={titleKey}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/85 backdrop-blur"
                    >
                      <Icon className="size-3.5 text-gold-300" />
                      {t(titleKey)}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-navy-200/55">
                  {t("copyright", { year: new Date().getFullYear() })}
                </p>
              </div>

              {/* Right: big login card */}
              <div className="order-1 flex w-full justify-center lg:order-2 lg:justify-end">
                <div className="w-full max-w-md">
                  {/* Mobile compact header */}
                  <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
                    <div className="flex items-center gap-3">
                      <Image
                        src="/logo.png"
                        alt="HealthyTech Atlantico"
                        width={112}
                        height={30}
                        className="object-contain brightness-0 invert"
                        priority
                      />
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-white/15 bg-white/10 p-4 shadow-[0_32px_92px_-40px_rgba(0,0,0,0.75)] backdrop-blur-md sm:p-5">
                    {children}
                  </div>

                  {/* Mobile compact footer */}
                  <p className="mt-4 text-center text-xs text-navy-200/55 lg:hidden">
                    {t("copyright", { year: new Date().getFullYear() })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative mx-auto flex w-full max-w-md flex-col items-center gap-7 px-4 py-12 pb-16">
          {/* Logo */}
          <Image
            src="/logo.png"
            alt="HealthyTech Atlantico"
            width={124}
            height={32}
            className="object-contain brightness-0 invert"
            priority
          />

          {/* Headline */}
          <div className="space-y-2 text-center">
            <h1 className="font-display text-xl font-semibold leading-tight tracking-tight text-white">
              {t("headline")}
            </h1>
            <p className="text-[13px] leading-relaxed text-navy-100/65">
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

          <div className="mt-4 grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
            {COLEGIO_IMAGES.map((src, idx) => (
              <div
                key={src}
                className="group relative aspect-square w-full overflow-hidden rounded-[20px] border border-white/10 bg-white/5 shadow-sm transition-all duration-300 hover:scale-105 hover:border-white/25 hover:shadow-lg hover:shadow-white/5"
              >
                <Image
                  src={src}
                  alt={`Ambiente do Colégio Atlântico - ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,#091523_0%,transparent_50%)] opacity-0 transition-opacity duration-300 group-hover:opacity-80" />
              </div>
            ))}
          </div>

          {/* Form card */}
          <div className="w-full">{children}</div>

          {/* Footer */}
          <p className="text-center text-xs text-navy-200/45">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      )}
    </main>
  );
}
