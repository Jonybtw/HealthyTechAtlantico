"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale as useNextIntlLocale } from "next-intl";
import { getNextLocale, normalizeLocale, writeLocale } from "@/lib/locale";
import { useTheme, writeTheme } from "@/lib/theme";

export function usePreferences() {
  const router = useRouter();
  const theme = useTheme();
  const locale = normalizeLocale(useNextIntlLocale());

  const toggleTheme = useCallback(() => {
    writeTheme(theme === "light" ? "dark" : "light");
  }, [theme]);

  const toggleLocale = useCallback(() => {
    writeLocale(getNextLocale(locale));
    router.refresh();
  }, [locale, router]);

  return {
    theme,
    locale,
    toggleTheme,
    toggleLocale,
  };
}