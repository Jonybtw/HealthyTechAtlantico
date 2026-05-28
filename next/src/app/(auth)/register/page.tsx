import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("registerLanding");

  return {
    title: t("title"),
  };
}

export default async function RegisterLandingPage() {
  const t = await getTranslations("registerLanding");

  const options = [
    {
      href: "/register/student",
      icon: GraduationCap,
      title: t("studentTitle"),
      description: t("studentDescription"),
    },
    {
      href: "/register/guardian",
      icon: Users,
      title: t("guardianTitle"),
      description: t("guardianDescription"),
    },
  ] as const;

  return (
    <div className="relative w-full overflow-hidden rounded-[24px] border border-white/20 bg-white/60 shadow-[0_20px_60px_rgba(5,14,24,0.09)] backdrop-blur-md dark:border-white/10 dark:bg-navy-950/60 dark:shadow-[0_20px_60px_rgba(5,14,24,0.32)]">
      {/* Gold gradient top line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
      {/* Radial gold glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(244,211,94,0.08),transparent_44%)]" />
      {/* Header */}
      <div className="relative border-b border-white/20 px-5 py-5 dark:border-white/10 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
          {t("eyebrow")}
        </p>
        <h1 className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
          {t("description")}
        </p>
      </div>

      {/* Option cards */}
      <div className="grid gap-3 p-5">
        {options.map((option) => {
          const Icon = option.icon;

          return (
            <Link
              key={option.href}
              href={option.href}
              className="group relative flex items-start gap-4 rounded-[18px] border border-white/20 bg-white/40 p-4 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-300/40 hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/[0.08]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[16px] border border-white/20 bg-white/40 text-gold-600 dark:border-white/10 dark:bg-black/20 dark:text-gold-400">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  {option.title}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {option.description}
                </p>
              </div>
              <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-gold-600 dark:group-hover:text-gold-400" />
            </Link>
          );
        })}
      </div>

      {/* Footer link */}
      <div className="relative border-t border-white/20 px-5 py-4 text-sm dark:border-white/10 sm:px-6">
        <Link
          href="/login"
          className="text-sm font-semibold text-gold-600 transition-colors hover:text-gold-500 dark:text-gold-400 dark:hover:text-gold-300"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}
