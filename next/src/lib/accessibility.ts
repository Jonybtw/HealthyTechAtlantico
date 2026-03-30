"use client";

import { useSyncExternalStore } from "react";

export type FontScale = "small" | "default" | "large";
export type ContrastMode = "normal" | "high";

const FONT_SCALE_KEY = "healthytech:font-scale";
const CONTRAST_MODE_KEY = "healthytech:contrast-mode";
const ACCESSIBILITY_EVENT = "healthytech:accessibility-change";

function updateRootClasses({
  fontScale,
  contrast,
}: {
  fontScale: FontScale;
  contrast: ContrastMode;
}) {
  if (typeof document === "undefined") return;

  document.documentElement.classList.remove(
    "font-size-small",
    "font-size-default",
    "font-size-large",
  );
  document.documentElement.classList.add(`font-size-${fontScale}`);

  if (contrast === "high") {
    document.documentElement.classList.add("high-contrast");
  } else {
    document.documentElement.classList.remove("high-contrast");
  }
}

export function readFontScale(): FontScale {
  if (typeof window === "undefined") return "default";
  const raw = window.localStorage.getItem(FONT_SCALE_KEY) as FontScale | null;
  return raw === "small" || raw === "large" ? raw : "default";
}

export function writeFontScale(fontScale: FontScale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FONT_SCALE_KEY, fontScale);
  updateRootClasses({ fontScale, contrast: readContrastMode() });
  window.dispatchEvent(new Event(ACCESSIBILITY_EVENT));
}

export function readContrastMode(): ContrastMode {
  if (typeof window === "undefined") return "normal";
  const raw = window.localStorage.getItem(
    CONTRAST_MODE_KEY,
  ) as ContrastMode | null;
  return raw === "high" ? "high" : "normal";
}

export function writeContrastMode(contrastMode: ContrastMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONTRAST_MODE_KEY, contrastMode);
  updateRootClasses({ fontScale: readFontScale(), contrast: contrastMode });
  window.dispatchEvent(new Event(ACCESSIBILITY_EVENT));
}

export function useFontScale(): FontScale {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => undefined;
      window.addEventListener(ACCESSIBILITY_EVENT, callback);
      window.addEventListener("storage", callback);
      return () => {
        window.removeEventListener(ACCESSIBILITY_EVENT, callback);
        window.removeEventListener("storage", callback);
      };
    },
    readFontScale,
    () => "default",
  );
}

export function useContrastMode(): ContrastMode {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => undefined;
      window.addEventListener(ACCESSIBILITY_EVENT, callback);
      window.addEventListener("storage", callback);
      return () => {
        window.removeEventListener(ACCESSIBILITY_EVENT, callback);
        window.removeEventListener("storage", callback);
      };
    },
    readContrastMode,
    () => "normal",
  );
}

// Initialize if we are running client side and settings exist
if (typeof window !== "undefined") {
  updateRootClasses({
    fontScale: readFontScale(),
    contrast: readContrastMode(),
  });
}
