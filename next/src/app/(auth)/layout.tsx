"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Activity, ShieldCheck, Sparkles } from "lucide-react";

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
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[linear-gradient(160deg,#091523_0%,#14304c_60%,#203f56_100%)]">
      {/* Gold glow — decorative */}
      <div
        aria-hidden="true"
        role="presentation"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(217,166,28,0.18),transparent)]"
      />

      <div className="relative mx-auto flex w-full max-w-sm flex-col items-center gap-7 px-4 py-12">
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
