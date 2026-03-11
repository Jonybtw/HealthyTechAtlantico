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
      {searchable ? (
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full rounded-full border border-border/80 bg-card/75 py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-all focus:border-gold-500/50 focus:ring-4 focus:ring-gold-400/10"
          />
        </div>
      ) : null}

      <div className="glass overflow-hidden rounded-[30px] shadow-card">
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
                    className={`px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground ${
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
                    className="px-6 py-16 text-center text-sm text-muted-foreground"
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
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
          <span>
            {sorted.length} resultado{sorted.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-full border border-border/70 bg-card/70 p-2 transition-colors hover:bg-card disabled:opacity-35"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-16 text-center text-xs font-semibold uppercase tracking-[0.16em]">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-full border border-border/70 bg-card/70 p-2 transition-colors hover:bg-card disabled:opacity-35"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
