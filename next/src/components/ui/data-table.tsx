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
  emptyMessage?: string;
  emptyStateIcon?: LucideIcon;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
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
  emptyMessage = "Sem registos.",
  emptyStateIcon: EmptyIcon = Search,
  onRowClick,
  rowKey,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
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
  }, [columns, data, deferredSearch]);

  const sorted = useMemo(() => {
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
  }, [filtered, sortDir, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  return (
    <div className="animate-fade-in-up flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-white/20 bg-white/72 shadow-card dark:border-white/10 dark:bg-navy-950/60">
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
                  {filtered.length} resultado
                  {filtered.length === 1 ? "" : "s"}
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
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder={searchPlaceholder}
                    className="h-10 w-full rounded-full border border-input bg-background/75 py-2 pl-9 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-muted/50">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    onClick={
                      column.sortable ? () => toggleSort(column.key) : undefined
                    }
                    className={`px-5 py-3.5 text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground ${
                      column.sortable
                        ? "cursor-pointer transition-colors hover:text-foreground"
                        : ""
                    } ${column.className ?? ""}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {column.header}
                      {column.sortable ? (
                        sortKey === column.key ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )
                        ) : (
                          <ChevronUp className="size-3.5 opacity-30" />
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
                    className={cn(
                      "group border-b border-border/50 transition-colors last:border-0",
                      onRowClick &&
                        "cursor-pointer hover:bg-accent/8 focus-within:bg-accent/8",
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
                {Math.min(sorted.length, safePage * pageSize)}
              </span>{" "}
              de{" "}
              <span className="font-bold text-foreground">{sorted.length}</span>{" "}
              resultados
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => current - 1)}
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
                    onClick={() => setPage(p)}
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
                onClick={() => setPage((current) => current + 1)}
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
