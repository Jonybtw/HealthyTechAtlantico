"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";

interface Student {
  id: string;
  name: string;
  className?: string | null;
  sex?: string;
}

export interface StudentPickerProps {
  students: Student[];
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
}

export function StudentPicker({
  students,
  value,
  onChange,
  placeholder = "Selecionar aluno...",
}: StudentPickerProps) {
  const selected = students.find((s) => s.id === value) ?? null;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const avatarColor = (name: string) => {
    const colors = [
      "from-blue-400 to-blue-600",
      "from-emerald-400 to-emerald-600",
      "from-violet-400 to-violet-600",
      "from-amber-400 to-amber-600",
      "from-rose-400 to-rose-600",
      "from-cyan-400 to-cyan-600",
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm text-left
                    transition-all duration-150 bg-card
                    ${open
            ? "border-navy-400 ring-2 ring-navy-600/20"
            : "border-border hover:border-navy-300"
          }`}
      >
        {selected ? (
          <>
            <span className={`h-7 w-7 rounded-full bg-gradient-to-br ${avatarColor(selected.name)}
                              flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
              {getInitials(selected.name)}
            </span>
            <span className="flex-1 truncate font-medium text-foreground">{selected.name}</span>
            {selected.className && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                {selected.className}
              </span>
            )}
            <X
              size={14}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }}
            />
          </>
        ) : (
          <>
            <Search size={16} className="text-muted-foreground shrink-0" />
            <span className="text-muted-foreground flex-1">{placeholder}</span>
            <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-card border border-border
                        rounded-2xl shadow-card-hover z-50 max-h-72 overflow-hidden animate-scale-in">
          <div className="p-2.5 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Procurar aluno..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-muted text-sm
                           text-foreground placeholder:text-muted-foreground
                           focus:outline-none focus:ring-2 focus:ring-navy-600/20 focus:border-navy-400
                           transition-all duration-150"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-52 py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                Nenhum aluno encontrado
              </p>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { onChange(s.id); setOpen(false); setSearch(""); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm
                             hover:bg-muted/60 transition-colors duration-100 text-left"
                >
                  <span className={`h-7 w-7 rounded-full bg-gradient-to-br ${avatarColor(s.name)}
                                    flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                    {getInitials(s.name)}
                  </span>
                  <span className="flex-1 truncate text-foreground">{s.name}</span>
                  {s.className && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                      {s.className}
                    </span>
                  )}
                  {s.id === value && <Check size={14} className="text-success-600 shrink-0" />}
                </button>
              ))
            )}
          </div>
          <div className="border-t border-border px-3 py-1.5">
            <p className="text-[11px] text-muted-foreground">{filtered.length} aluno{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      )}
    </div>
  );
}
