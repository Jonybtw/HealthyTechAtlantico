"use client";

import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delayMs` of
 * stability. Use this for query-key dependencies that would otherwise re-fetch
 * on every keystroke.
 *
 * Always pass a primitive or a stable reference to avoid unnecessary resets.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // Even for `delayMs <= 0` we go through setTimeout(_, 0) so the update
    // happens on a microtask tick — this avoids the "setState in effect" lint
    // rule and the cascading-render anti-pattern.
    const handle = setTimeout(() => setDebounced(value), Math.max(0, delayMs));
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
