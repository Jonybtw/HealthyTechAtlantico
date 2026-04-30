import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

const OPTION_STYLES = [
  "from-sky-500/15 via-sky-500/10 to-transparent border-sky-400/20",
  "from-emerald-500/15 via-emerald-500/10 to-transparent border-emerald-400/20",
] as const;

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
    <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-white/12 bg-white/10 p-6 shadow-[0_28px_70px_rgba(5,14,24,0.34)] backdrop-blur-md sm:p-8">
      <div className="text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-200/90">
          {t("eyebrow")}
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
          {t("description")}
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {options.map((option, index) => {
          const Icon = option.icon;

          return (
            <Link
              key={option.href}
              href={option.href}
              className={`group rounded-[1.75rem] border bg-gradient-to-br p-5 text-left text-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-gold-300/35 hover:bg-white/12 ${OPTION_STYLES[index]}`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-gold-200">
                  <Icon className="size-5" />
                </span>
                <ArrowRight className="size-4 text-white/60 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-gold-200" />
              </div>
              <h2 className="mt-6 text-lg font-semibold tracking-tight">
                {option.title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-white/70">
                {option.description}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/login"
          className="text-sm font-semibold text-gold-200 transition-colors hover:text-gold-100"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}
