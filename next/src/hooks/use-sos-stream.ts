"use client";

import { useEffect, useState } from "react";

export type SosStreamStatus = "connecting" | "open" | "closed" | "error";

export interface SosStreamResult<T = unknown> {
  data: T | null;
  status: SosStreamStatus;
  lastUpdated: Date | null;
}

/**
 * Subscribes to `/api/sos/stream` via the browser-native `EventSource`.
 * Returns the most recent payload and the connection status.
 *
 *   const { data, status } = useSosStream<NormalizedSosAlert[]>();
 *
 * EventSource auto-reconnects on errors; we surface the status so
 * consumers can show a banner while the feed is offline.
 */
export function useSosStream<T = unknown>(
  endpoint = "/api/sos/stream",
  options: { enabled?: boolean; key?: number | string } = {},
): SosStreamResult<T> {
  const enabled = options.enabled ?? true;
  const subscriptionKey = options.key ?? 0;
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<SosStreamStatus>("connecting");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !enabled) return;
    const source = new EventSource(endpoint, { withCredentials: true });

    function handleOpen() {
      setStatus("open");
    }
    function handleMessage(event: MessageEvent<string>) {
      try {
        const parsed = JSON.parse(event.data) as T;
        setData(parsed);
        setLastUpdated(new Date());
      } catch {
        // Bad payload — close the stream so the browser doesn't keep
        // replaying it on reconnect.
        source.close();
        setStatus("error");
      }
    }
    function handleError() {
      setStatus((current) => (current === "connecting" ? "connecting" : "error"));
    }

    source.addEventListener("open", handleOpen);
    source.addEventListener("message", handleMessage);
    source.addEventListener("error", handleError);

    return () => {
      source.close();
      setStatus("closed");
    };
  }, [endpoint, enabled, subscriptionKey]);

  return { data, status, lastUpdated };
}
