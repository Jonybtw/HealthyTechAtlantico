"use client";

import { useEffect, useState } from "react";

type NetworkInformationLike = {
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function getNetworkInformation(): NetworkInformationLike | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  return ("connection" in navigator
    ? (navigator as Navigator & { connection?: NetworkInformationLike })
        .connection
    : null) ?? null;
}

function readReducedEffectsPreference() {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const compactViewport = window.matchMedia("(max-width: 1024px)").matches;
  const connection = getNetworkInformation();
  const saveData = Boolean(connection && connection.saveData);
  const lowConcurrency =
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency > 0 &&
    navigator.hardwareConcurrency <= 4;

  return prefersReducedMotion || compactViewport || saveData || lowConcurrency;
}

export function useReducedEffects() {
  const [reducedEffects, setReducedEffects] = useState(
    readReducedEffectsPreference,
  );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const reducedMotionMedia = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const compactViewportMedia = window.matchMedia("(max-width: 1024px)");

    const update = () => {
      setReducedEffects(readReducedEffectsPreference());
    };

    const addMediaListener = (
      media: MediaQueryList,
      handler: () => void,
    ) => {
      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", handler);
        return () => media.removeEventListener("change", handler);
      }

      media.addListener(handler);
      return () => media.removeListener(handler);
    };

    const removeReducedMotionListener = addMediaListener(
      reducedMotionMedia,
      update,
    );
    const removeViewportListener = addMediaListener(compactViewportMedia, update);

    const connection = getNetworkInformation();
    let removeConnectionListener = () => {};

    if (connection && typeof connection.addEventListener === "function") {
      connection.addEventListener("change", update);
      removeConnectionListener = () =>
        connection.removeEventListener?.("change", update);
    }

    return () => {
      removeReducedMotionListener();
      removeViewportListener();
      removeConnectionListener();
    };
  }, []);

  return reducedEffects;
}
