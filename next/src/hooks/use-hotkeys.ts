"use client";

import { useEffect, useCallback, useRef } from "react";

type HotkeyHandler = (e: KeyboardEvent) => void;
type HotkeyMod = "ctrl" | "meta" | "shift" | "alt";

interface Hotkey {
  key: string;
  mods?: HotkeyMod[];
  handler: HotkeyHandler;
}

function matchesHotkey(e: KeyboardEvent, hotkey: Hotkey): boolean {
  if (e.key.toLowerCase() !== hotkey.key.toLowerCase()) return false;

  const mods = hotkey.mods ?? [];
  const wantCtrl = mods.includes("ctrl");
  const wantMeta = mods.includes("meta");
  const wantShift = mods.includes("shift");
  const wantAlt = mods.includes("alt");

  // On Mac, Cmd maps to metaKey; on Windows/Linux, Ctrl maps to ctrlKey.
  // If either ctrl or meta is specified, match either one.
  const cmdOrCtrl = wantCtrl || wantMeta;
  const hasCmdOrCtrl = e.ctrlKey || e.metaKey;

  if (cmdOrCtrl && !hasCmdOrCtrl) return false;
  if (!cmdOrCtrl && hasCmdOrCtrl) return false;
  if (wantShift !== e.shiftKey) return false;
  if (wantAlt !== e.altKey) return false;

  return true;
}

/**
 * Register global keyboard shortcuts. Automatically ignores events
 * originating from input/textarea/select/contenteditable elements.
 */
export function useHotkeys(hotkeys: Hotkey[]) {
  const hotkeysRef = useRef(hotkeys);
  hotkeysRef.current = hotkeys;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const tag = target.tagName;

    // Don't intercept typing in form fields
    if (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      target.isContentEditable
    ) {
      return;
    }

    for (const hotkey of hotkeysRef.current) {
      if (matchesHotkey(e, hotkey)) {
        e.preventDefault();
        hotkey.handler(e);
        break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
