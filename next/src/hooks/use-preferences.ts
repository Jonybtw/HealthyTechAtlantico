"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale as useNextIntlLocale } from "next-intl";
import { getNextLocale, normalizeLocale, writeLocale } from "@/lib/locale";
import { useTheme, writeTheme } from "@/lib/theme";
import {
  useContrastMode,
  useFontScale,
  writeContrastMode,
  writeFontScale,
} from "@/lib/accessibility";

export function usePreferences() {
  const router = useRouter();
  const theme = useTheme();
  const contrast = useContrastMode();
  const fontScale = useFontScale();
  const locale = normalizeLocale(useNextIntlLocale());

  const toggleTheme = useCallback(() => {
    writeTheme(theme === "light" ? "dark" : "light");
  }, [theme]);

  const toggleLocale = useCallback(() => {
    writeLocale(getNextLocale(locale));
    router.refresh();
  }, [locale, router]);

  const setFontScale = useCallback((scale: "small" | "default" | "large") => {
    writeFontScale(scale);
  }, []);

  const setContrastMode = useCallback((value: "normal" | "high") => {
    writeContrastMode(value);
  }, []);

  return {
    theme,
    locale,
    contrast,
    fontScale,
    toggleTheme,
    toggleLocale,
    setFontScale,
    setContrastMode,
  };
}