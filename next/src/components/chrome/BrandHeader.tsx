"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

const BRAND_NAME = "HealthyTech Atlântico";

export function BrandHeader({
  className,
  brandClassName,
  imageClassName,
  showText = true,
  size = "md",
}: {
  className?: string;
  brandClassName?: string;
  imageClassName?: string;
  showText?: boolean;
  size?: "sm" | "md";
}) {
  const logoSize = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const textSize = size === "sm" ? "text-[15px]" : "text-[16px]";

  return (
    <Link
      href="/dashboard"
      className={cn("flex items-center gap-2.5", className)}
      aria-label={BRAND_NAME}
    >
      <BrandLogo
        alt=""
        className={cn("shrink-0", logoSize)}
        imageClassName={imageClassName ?? "brightness-0 dark:invert"}
        priority
        sizes={size === "sm" ? "36px" : "40px"}
      />
      {showText ? (
        <span
          className={cn(
            "whitespace-nowrap font-semibold tracking-tight text-foreground",
            textSize,
            brandClassName,
          )}
        >
          HealthyTech{" "}
          <span className="bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 bg-clip-text font-bold text-transparent dark:from-gold-200 dark:via-gold-300 dark:to-gold-500">
            Atlântico
          </span>
        </span>
      ) : null}
    </Link>
  );
}

export { BRAND_NAME };
