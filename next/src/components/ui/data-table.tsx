"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Search,
  SlidersHorizontal,
  type LucideIcon,
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
    <div className="animate-fade-in-up flex flex-col gap-6">
      {/* Glass Table Container */}
      <div
        className="overflow-hidden rounded-[24px] shadow-xl shadow-blue-900/5"
        style={{
          background: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
        }}
      >
        {/* Toolbar */}
        {(searchable || toolbarTitle || toolbarSummary || toolbarActions) ? (
          <div
            className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.3)" }}
          >
            {/* Left: title + summary */}
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {toolbarTitle}
              </p>
              <p className="text-sm font-semibold text-[#00236f]">
                {toolbarSummary ?? (
                  <>
                    {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
                  </>
                )}
              </p>
            </div>
            {/* Right: search + actions */}
            <div className="flex w-full items-center gap-2 sm:max-w-sm">
              {toolbarActions ? (
                <div className="flex flex-wrap items-center gap-2">{toolbarActions}</div>
              ) : null}
              {searchable ? (
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder={searchPlaceholder}
                    className="h-10 w-full rounded-2xl border border-blue-100/50 bg-white/80 py-2 pl-9 pr-4 text-sm text-[#141d21] placeholder:text-slate-400 outline-none transition-all focus:border-blue-300/60 focus:ring-2 focus:ring-blue-200/30 shadow-sm"
                  />
                </div>
              ) : null}
              <button
                type="button"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-100/70 bg-white/80 text-slate-400 shadow-sm transition-all hover:text-[#00236f]"
              >
                <SlidersHorizontal className="size-4" />
              </button>
            </div>
          </div>
        ) : null}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ background: "rgba(236, 245, 251, 0.55)" }}>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    onClick={column.sortable ? () => toggleSort(column.key) : undefined}
                    className={`px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 ${
                      column.sortable
                        ? "cursor-pointer transition-colors hover:text-[#00236f]"
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
            <tbody style={{ borderTop: "1px solid rgba(255,255,255,0.3)" }}>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <div className="flex min-h-[360px] w-full items-center justify-center p-8">
                      <div className="flex max-w-[400px] flex-col items-center justify-center space-y-4 text-center">
                        <div className="relative flex size-20 items-center justify-center rounded-3xl border border-blue-100 bg-[#ecf5fb] shadow-inner">
                          <div className="absolute inset-0 animate-pulse-ring rounded-3xl border-2 border-[#1e3a8a]/20" />
                          <EmptyIcon className="relative z-10 size-8 text-[#1e3a8a]" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold tracking-tight text-[#00236f]">
                            Sem Resultados
                          </h3>
                          <p className="text-sm font-medium text-slate-400">
                            {emptyMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`group border-b border-blue-50/60 transition-colors last:border-0 ${
                      onRowClick ? "cursor-pointer hover:bg-white/50" : ""
                    }`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 align-middle text-[#141d21] ${column.className ?? ""}`}
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

        {/* Pagination Footer */}
        {totalPages > 1 ? (
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.4)",
              background: "rgba(255, 255, 255, 0.5)",
            }}
          >
            <p className="text-xs font-medium text-slate-500">
              Exibindo{" "}
              <span className="font-bold text-[#00236f]">
                {Math.min(sorted.length, safePage * pageSize)}
              </span>{" "}
              de{" "}
              <span className="font-bold text-[#00236f]">{sorted.length}</span>{" "}
              resultados
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="flex size-8 items-center justify-center rounded-lg border border-blue-100 bg-white/80 text-slate-400 transition-colors hover:bg-white disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`flex size-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      safePage === p
                        ? "bg-[#00236f] text-white shadow-md"
                        : "border border-blue-100 bg-white/80 text-[#00236f] hover:bg-white"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="flex size-8 items-center justify-center rounded-lg border border-blue-100 bg-white/80 text-slate-400 transition-colors hover:bg-white disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
