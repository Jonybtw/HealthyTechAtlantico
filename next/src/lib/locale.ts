type AppLocale = "pt" | "en";

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export function normalizeLocale(locale: string | null | undefined): AppLocale {
  return locale === "en" ? "en" : "pt";
}

export function getNextLocale(locale: AppLocale): AppLocale {
  return locale === "pt" ? "en" : "pt";
}

export function writeLocale(locale: AppLocale) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`;
}
