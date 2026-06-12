"use client";

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api-client";

/**
 * Per-query flag: set `meta: { silent: true }` to keep an expected error
 * (e.g. 404 for "entity not found") out of the global log.
 *
 * Implemented as a `Register` augmentation (TanStack Query v5) so it composes
 * cleanly with the library's `QueryMeta` type union.
 */
declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      silent?: boolean;
    };
  }
}

function defaultQueryOnError(error: unknown, query: { meta?: { silent?: boolean } }) {
  if (query.meta?.silent) return;
  if (error instanceof ApiError && error.status === 401) {
    // Auth layer redirects on 401; don't double-toast.
    return;
  }
  if (process.env.NODE_ENV === "production") {
    console.error("[query]", error);
  }
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: defaultQueryOnError }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
            placeholderData: (previousData: unknown) => previousData,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
