"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Search,
} from "lucide-react";

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
  onRowClick,
  rowKey,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return data;
    }

    const query = search.toLowerCase();
    return data.filter((row) =>
      columns.some((column) => {
        const value = Reflect.get(row, column.key);
        return (
          value !== null &&
          value !== undefined &&
          String(value).toLowerCase().includes(query)
        );
      })
    );
  }, [columns, data, search]);

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
      {searchable || toolbarTitle || toolbarSummary || toolbarActions ? (       
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {toolbarTitle}
            </p>
            <p className="text-[13px] text-foreground sm:text-sm font-medium">
              {toolbarSummary ?? (
                <>
                  {filtered.length} resultado{filtered.length === 1 ? "" : "s"} 
                </>
              )}
            </p>
          </div>
          <div className="flex w-full items-center justify-end gap-2 sm:max-w-xs">
            {toolbarActions ? <div className="flex flex-wrap items-center gap-2">{toolbarActions}</div> : null}
            {searchable ? (
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder={searchPlaceholder}
                    className="h-[42px] w-full rounded-[14px] border border-border/80 bg-card py-2 pl-9 pr-4 text-sm text-foreground shadow-sm outline-none backdrop-blur-md transition-all focus:border-gold-500/50 focus:bg-card focus:ring-4 focus:ring-gold-400/10 placeholder:text-muted-foreground/60"
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="surface-secondary overflow-hidden rounded-[20px]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/70 bg-muted/28">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    onClick={
                      column.sortable ? () => toggleSort(column.key) : undefined
                    }
                    className={`px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground ${
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
            <tbody className="divide-y divide-border/55">
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-5 py-8 text-center text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paged.map((row, index) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`transition-colors ${
                      onRowClick ? "cursor-pointer hover:bg-muted/28" : ""
                    } ${index % 2 === 0 ? "bg-transparent" : "bg-card/35"}`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 align-middle text-foreground ${column.className ?? ""}`}
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
      </div>

      {totalPages > 1 ? (
        <div className="surface-utility flex items-center justify-between rounded-[16px] px-3 py-2 text-sm text-muted-foreground">
          <span className="text-[13px] sm:text-sm">
            {sorted.length} resultado{sorted.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-border/70 bg-card/70 p-1.5 transition-colors hover:bg-card disabled:opacity-35"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-14 text-center text-[10px] font-semibold uppercase tracking-[0.16em]">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-border/70 bg-card/70 p-1.5 transition-colors hover:bg-card disabled:opacity-35"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
