"use client";

import { useEffect, useRef } from "react";

/**
 * Animates the document title when the tab loses visibility, then restores
 * it when the tab is focused again. Useful for unread / dirty-state cues.
 */
export function useDocumentTitle({
  idle,
  unread,
}: {
  idle: string;
  unread?: string;
}) {
  const baseline = useRef<string>("");
  const lastUnread = useRef<string | null>(null);

  useEffect(() => {
    baseline.current = document.title;
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    function handleVisibility() {
      if (document.visibilityState === "hidden" && unread) {
        lastUnread.current = unread;
        document.title = unread;
      } else if (document.visibilityState === "visible") {
        document.title = baseline.current || idle;
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [idle, unread]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.visibilityState === "visible" && lastUnread.current === unread) {
      document.title = baseline.current || idle;
    }
  }, [idle, unread]);
}
