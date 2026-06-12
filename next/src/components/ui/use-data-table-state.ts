"use client";

import { useDeferredValue, useMemo, useState } from "react";

/**
 * State shape for the data table. Owned externally so consumers can
 * persist it (URL search params, TanStack Query state, etc.) or drive
 * it from a server pagination flow.
 */
export interface DataTableState {
  search: string;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  page: number;
}

export interface DataTableStateSetters {
  setSearch: (value: string) => void;
  setSortKey: (key: string | null) => void;
  setSortDir: (dir: "asc" | "desc") => void;
  setPage: (page: number) => void;
  reset: () => void;
}

const DEFAULT_PAGE_SIZE = 15;

export function useDataTableState(
  options: { defaultPage?: number; initial?: Partial<DataTableState> } = {},
): [DataTableState, DataTableStateSetters] {
  const [search, setSearch] = useState(options.initial?.search ?? "");
  const [sortKey, setSortKey] = useState<string | null>(options.initial?.sortKey ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(options.initial?.sortDir ?? "asc");
  const [page, setPage] = useState(options.initial?.page ?? options.defaultPage ?? 1);

  return useMemo(
    () => [
      { search, sortKey, sortDir, page },
      {
        setSearch,
        setSortKey,
        setSortDir,
        setPage,
        reset: () => {
          setSearch("");
          setSortKey(null);
          setSortDir("asc");
          setPage(options.defaultPage ?? 1);
        },
      },
    ],
    [search, sortKey, sortDir, page, options.defaultPage],
  );
}

/**
 * Re-export of the default page size for callers that don't want to
 * peek into the data-table internals.
 */
export const DEFAULT_DATA_TABLE_PAGE_SIZE = DEFAULT_PAGE_SIZE;

/**
 * Re-export of the deferred-search helper so consumers using a custom
 * state container can apply the same heuristic.
 */
export function useDeferredDataTableSearch(search: string): string {
  return useDeferredValue(search);
}

export function useFilteredAndSortedRows<T extends object>(args: {
  data: T[];
  state: DataTableState;
  columns: { key: string }[];
}): T[] {
  const { data, state, columns } = args;
  const deferredSearch = useDeferredValue(state.search);

  const filtered = useMemo(() => {
    if (!deferredSearch.trim()) return data;
    const query = deferredSearch.toLowerCase();
    return data.filter((row) =>
      columns.some((column) => {
        const value = Reflect.get(row, column.key);
        return (
          value !== null &&
          value !== undefined &&
          String(value).toLowerCase().includes(query)
        );
      }),
    );
  }, [data, columns, deferredSearch]);

  const sorted = useMemo(() => {
    if (!state.sortKey) return filtered;
    const sortedRows = [...filtered];
    sortedRows.sort((left, right) => {
      const leftValue = Reflect.get(left, state.sortKey as string) ?? "";
      const rightValue = Reflect.get(right, state.sortKey as string) ?? "";
      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return state.sortDir === "asc"
          ? leftValue - rightValue
          : rightValue - leftValue;
      }
      return state.sortDir === "asc"
        ? String(leftValue).localeCompare(String(rightValue), "pt")
        : String(rightValue).localeCompare(String(leftValue), "pt");
    });
    return sortedRows;
  }, [filtered, state.sortDir, state.sortKey]);

  return sorted;
}

export function paginateRows<T>(args: {
  rows: T[];
  page: number;
  pageSize: number;
  totalItems?: number;
}): { paged: T[]; totalPages: number; safePage: number; totalItemsCount: number } {
  const { rows, page, pageSize, totalItems } = args;
  const totalItemsCount = totalItems ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItemsCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paged = (totalItems !== undefined ? rows : rows.slice((safePage - 1) * pageSize, safePage * pageSize));
  return { paged, totalPages, safePage, totalItemsCount };
}
