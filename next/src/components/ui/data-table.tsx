"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

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
  searchPlaceholder = "Pesquisar…",
  emptyMessage = "Sem registos.",
  onRowClick,
  rowKey,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = (row as Record<string, unknown>)[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey] ?? "";
      const bv = (b as Record<string, unknown>)[sortKey] ?? "";
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv), "pt")
        : String(bv).localeCompare(String(av), "pt");
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      {/* Search bar */}
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card/60 glass text-sm text-foreground
                       placeholder:text-muted-foreground shadow-inner
                       focus:outline-none focus:ring-2 focus:ring-navy-600/30 focus:border-navy-400
                       hover:border-navy-300 transition-all duration-300"
          />
        </div>
      )}

      {/* Table */}
      <div className="relative overflow-x-auto overflow-y-auto max-h-[600px] rounded-2xl border border-border shadow-card bg-card/70 glass scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-border/50 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  className={`px-5 py-4 text-left text-xs font-bold text-navy-800 dark:text-navy-200 uppercase tracking-widest select-none
                              ${col.sortable ? "cursor-pointer hover:bg-navy-900/5 dark:hover:bg-navy-100/5 transition-colors" : ""}
                              ${col.className ?? ""}`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      <span className="text-muted-foreground/40">
                        {sortKey === col.key
                          ? (sortDir === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)
                          : <ChevronUp className="size-3 opacity-30" />
                        }
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-14 text-center text-muted-foreground text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, rowIdx) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`transition-all duration-300 group ${onRowClick ? "cursor-pointer hover:bg-gold-500/5 dark:hover:bg-gold-400/10 hover:shadow-[inset_0_1px_0_rgba(224,180,40,0.2),inset_0_-1px_0_rgba(224,180,40,0.2)]" : ""
                    } ${rowIdx % 2 === 0 ? "bg-transparent" : "bg-muted/30"}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-5 py-3.5 text-foreground transition-colors ${col.className ?? ""}`}>
                      {col.render
                        ? col.render(row)
                        : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <span>{sorted.length} resultado{sorted.length !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-1">
            <button
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors duration-150"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && arr[idx - 1] !== p - 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground/50">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-all duration-150 ${safePage === p
                        ? "bg-navy-800 text-white"
                        : "hover:bg-muted text-muted-foreground"
                        }`}
                    >
                      {p}
                    </button>
                  )
                )
              }
            </div>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors duration-150"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
