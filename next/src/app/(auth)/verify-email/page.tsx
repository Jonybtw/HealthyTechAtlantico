import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

type VerifyStatus = "missing" | "invalid" | "expired" | "student_not_found";

const STATUS_KEYS: Record<
  VerifyStatus,
  { title: string; description: string }
> = {
  missing: {
    title: "missingTitle",
    description: "missingDescription",
  },
  invalid: {
    title: "invalidTitle",
    description: "invalidDescription",
  },
  expired: {
    title: "expiredTitle",
    description: "expiredDescription",
  },
  student_not_found: {
    title: "studentTitle",
    description: "studentDescription",
  },
};

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("verifyEmail");

  return {
    title: t("title"),
  };
}

/**
 * Rota: /verify-email
 *
 * Página pública de apoio à confirmação de email. Quando recebe token na query
 * string, encaminha para a API que valida o token e atualiza a base de dados.
 */
export default async function VerifyEmailPage({ searchParams }: Props) {
  const t = await getTranslations("verifyEmail");
  const resolvedSearchParams = await searchParams;
  const token = typeof resolvedSearchParams.token === "string"
    ? resolvedSearchParams.token
    : "";
  const status = typeof resolvedSearchParams.status === "string"
    ? (resolvedSearchParams.status as VerifyStatus)
    : "missing";

  if (token) {
    redirect(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  }

  const copy = STATUS_KEYS[status] ?? STATUS_KEYS.missing;

  return (
    <div className="relative w-full overflow-hidden rounded-[24px] border border-white/20 bg-white/60 shadow-[0_20px_60px_rgba(5,14,24,0.09)] backdrop-blur-md dark:border-white/10 dark:bg-navy-950/60 dark:shadow-[0_20px_60px_rgba(5,14,24,0.32)]">
      {/* Gold gradient top line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
      {/* Radial gold glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(244,211,94,0.08),transparent_44%)]" />
      <div className="relative border-b border-white/20 px-5 py-5 text-center dark:border-white/10 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-xl font-semibold tracking-tight text-foreground">
          {t(copy.title)}
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
          {t(copy.description)}
        </p>
      </div>

      <div className="relative flex flex-wrap justify-center gap-4 px-5 py-5 text-sm sm:px-6">
        <Link
          href="/login"
          className="font-semibold text-gold-600 transition-colors hover:text-gold-500 dark:text-gold-400 dark:hover:text-gold-300"
        >
          {t("loginLink")}
        </Link>
        <Link
          href="/register"
          className="font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("registerLink")}
        </Link>
      </div>
    </div>
  );
}
