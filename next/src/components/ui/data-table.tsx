"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  searchable?: boolean;
  toolbarTitle?: string;
  toolbarSummary?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  emptyMessage?: string;
  emptyStateIcon?: LucideIcon;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  tableClassName?: string;
  scrollAreaClassName?: string;

  /* Server pagination optional props */
  serverTotalItems?: number;
  serverPage?: number;
  onServerPageChange?: (page: number) => void;
  onServerSearch?: (query: string) => void;
}

export function DataTable<T extends object>({
  columns,
  data,
  pageSize = 15,
  searchable = true,
  toolbarTitle = "Data view",
  toolbarSummary,
  toolbarActions,
  searchPlaceholder = "Pesquisar...",
  searchValue,
  emptyMessage = "Sem registos.",
  emptyStateIcon: EmptyIcon = Search,
  onRowClick,
  rowKey,
  tableClassName,
  scrollAreaClassName,
  serverTotalItems,
  serverPage,
  onServerPageChange,
  onServerSearch,
}: DataTableProps<T>) {
  const isSearchControlled = searchValue !== undefined;
  const [internalSearch, setInternalSearch] = useState("");
  const search = isSearchControlled ? (searchValue ?? "") : internalSearch;
  const deferredSearch = useDeferredValue(search);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [internalPage, setPage] = useState(1);

  const page = serverPage ?? internalPage;

  const filtered = useMemo(() => {
    if (serverTotalItems !== undefined) return data;
    if (!deferredSearch.trim()) {
      return data;
    }

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
  }, [columns, data, deferredSearch, serverTotalItems]);

  const sorted = useMemo(() => {
    if (serverTotalItems !== undefined) return filtered;
    if (!sortKey) {
      return filtered;
    }

    const sortedRows = [...filtered];
    sortedRows.sort((left, right) => {
      const leftValue = Reflect.get(left, sortKey) ?? "";
      const rightValue = Reflect.get(right, sortKey) ?? "";

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return sortDir === "asc"
          ? leftValue - rightValue
          : rightValue - leftValue;
      }

      return sortDir === "asc"
        ? String(leftValue).localeCompare(String(rightValue), "pt")
        : String(rightValue).localeCompare(String(leftValue), "pt");
    });

    return sortedRows;
  }, [filtered, sortDir, sortKey, serverTotalItems]);

  const totalItemsCount = serverTotalItems ?? sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItemsCount / pageSize));
  const safePage = Math.min(page, totalPages);

  // Memoized so the table body doesn't re-render on unrelated parent
  // re-renders (e.g. when the SOS page polls).
  const paged = useMemo(
    () =>
      serverTotalItems !== undefined
        ? data
        : sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [data, sorted, safePage, pageSize, serverTotalItems],
  );

  function handlePageChange(newPage: number) {
    if (onServerPageChange) {
      onServerPageChange(newPage);
    } else {
      setPage(newPage);
    }
  }

  function handleSearchChange(val: string) {
    if (!isSearchControlled) {
      setInternalSearch(val);
    }
    if (onServerSearch) {
      onServerSearch(val);
    } else {
      setPage(1);
    }
  }

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    handlePageChange(1);
  }

  return (
    <div className="animate-fade-in-up flex flex-col gap-4">
      <div className="overflow-hidden rounded-[16px] border border-border bg-surface-secondary shadow-card">
        {searchable || toolbarTitle || toolbarSummary || toolbarActions ? (
          <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {toolbarTitle}
              </p>
              {toolbarSummary ? (
                <div className="text-sm font-semibold text-foreground">
                  {toolbarSummary}
                </div>
              ) : (
                <p className="text-sm font-semibold text-foreground">
                  {totalItemsCount} resultado
                  {totalItemsCount === 1 ? "" : "s"}
                </p>
              )}
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              {toolbarActions ? (
                <div className="flex flex-wrap items-center gap-2">
                  {toolbarActions}
                </div>
              ) : null}
              {searchable ? (
                <div className="relative w-full sm:w-56 lg:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-10 w-full rounded-full border border-input bg-background/75 py-2 pl-9 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className={cn("overflow-x-auto", scrollAreaClassName)}>
          <table className={cn("w-full text-left text-sm", tableClassName)}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/60 backdrop-blur-sm">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    onClick={
                      column.sortable ? () => toggleSort(column.key) : undefined
                    }
                    onKeyDown={
                      column.sortable
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              toggleSort(column.key);
                            }
                          }
                        : undefined
                    }
                    tabIndex={column.sortable ? 0 : undefined}
                    role={column.sortable ? "button" : undefined}
                    aria-sort={
                      column.sortable && sortKey === column.key
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : column.sortable
                          ? "none"
                          : undefined
                    }
                    className={`px-5 py-3.5 text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground ${
                      column.sortable
                        ? "cursor-pointer transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60"
                        : ""
                    } ${column.className ?? ""}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {column.header}
                      {column.sortable ? (
                        sortKey === column.key ? (
                          sortDir === "asc" ? (
                            <ChevronUp aria-hidden="true" className="size-3.5" />
                          ) : (
                            <ChevronDown aria-hidden="true" className="size-3.5" />
                          )
                        ) : (
                          <ChevronUp aria-hidden="true" className="size-3.5 opacity-30" />
                        )
                      ) : null}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="border-t border-border/60">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <div className="p-6">
                      <EmptyState
                        icon={EmptyIcon}
                        title="Sem resultados"
                        description={emptyMessage}
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "link" : undefined}
                    className={cn(
                      "group border-b border-border/50 transition-colors last:border-0",
                      onRowClick &&
                        "cursor-pointer hover:bg-accent/8 focus-visible:bg-accent/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60",
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-5 py-4 align-middle text-foreground ${column.className ?? ""}`}
                      >
                        {column.render
                          ? column.render(row)
                          : (Reflect.get(row, column.key) as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="flex flex-col gap-3 border-t border-border/60 bg-background/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Exibindo{" "}
              <span className="font-bold text-foreground">
                {Math.min(totalItemsCount, safePage * pageSize)}
              </span>{" "}
              de{" "}
              <span className="font-bold text-foreground">{totalItemsCount}</span>{" "}
              resultado{totalItemsCount === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={safePage <= 1}
                onClick={() => handlePageChange(safePage - 1)}
                className="size-8"
              >
                <ChevronLeft className="size-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const p = i + 1;
                return (
                  <Button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    variant={safePage === p ? "primary" : "outline"}
                    size="icon"
                    className="size-8 text-xs"
                  >
                    {p}
                  </Button>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={safePage >= totalPages}
                onClick={() => handlePageChange(safePage + 1)}
                className="size-8"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
