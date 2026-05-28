"use client";

import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("common");
  const label = t("loading");

  return (
    <div
      role="status"
      aria-label={label}
      className="fixed inset-0 z-[25] overflow-hidden animate-fade-in"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/88 backdrop-blur-[2px] dark:bg-navy-950/88" />
      {/* Radial gold glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_35%_at_50%_50%,rgba(217,166,28,0.10),transparent)]" />

      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <div className="flex animate-fade-in-up flex-col items-center gap-5">
          {/* Spinning arc ring */}
          <div className="relative flex items-center justify-center">
            <div className="absolute size-14 rounded-full bg-gold-400/10 blur-2xl" />
            <svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              fill="none"
              aria-hidden="true"
              className="animate-spin"
              style={{
                animationDuration: "1.1s",
                animationTimingFunction: "linear",
              }}
            >
              {/* Track ring */}
              <circle
                cx="28"
                cy="28"
                r="22"
                strokeWidth="3"
                className="stroke-navy-200 dark:stroke-white/15"
              />
              {/* Gold arc */}
              <circle
                cx="28"
                cy="28"
                r="22"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="90 48"
                className="stroke-gold-500 dark:stroke-gold-400"
              />
            </svg>
          </div>

          {/* Staggered pulse dots */}
          <div className="flex items-center gap-1.5">
            {([0, 0.18, 0.36] as const).map((delay, i) => (
              <div
                key={i}
                className="size-1.5 animate-pulse rounded-full bg-gold-500 dark:bg-gold-400"
                style={{ animationDelay: `${delay}s` }}
              />
            ))}
          </div>

          {/* Label */}
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground/60">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
