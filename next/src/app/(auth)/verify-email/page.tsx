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
    <div className="mx-auto w-full max-w-lg rounded-[2rem] border border-white/12 bg-white/10 p-6 text-center shadow-[0_28px_70px_rgba(5,14,24,0.34)] backdrop-blur-md sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-200/90">
        {t("eyebrow")}
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white">
        {t(copy.title)}
      </h1>
      <p className="mt-3 text-sm leading-7 text-white/72">
        {t(copy.description)}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
        <Link
          href="/login"
          className="font-semibold text-gold-200 transition-colors hover:text-gold-100"
        >
          {t("loginLink")}
        </Link>
        <Link
          href="/register"
          className="font-semibold text-white/72 transition-colors hover:text-white"
        >
          {t("registerLink")}
        </Link>
      </div>
    </div>
  );
}
