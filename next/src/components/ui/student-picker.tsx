"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-left hover:bg-muted transition-colors"
      >
        {selected ? (
          <>
            <span className="h-7 w-7 rounded-full bg-navy-100 flex items-center justify-center text-[10px] font-bold text-navy-800 shrink-0">
              {getInitials(selected.name)}
            </span>
            <span className="flex-1 truncate">{selected.name}</span>
            {selected.className && (
              <span className="text-xs text-muted-foreground">
                {selected.className}
              </span>
            )}
            <X
              size={14}
              className="shrink-0 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                setOpen(false);
              }}
            />
          </>
        ) : (
          <>
            <Search size={16} className="text-muted-foreground" />
            <span className="text-muted-foreground">{placeholder}</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar..."
              className="w-full rounded-md border border-input bg-muted px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                Nenhum aluno encontrado
              </p>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onChange(s.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                >
                  <span className="h-7 w-7 rounded-full bg-navy-100 flex items-center justify-center text-[10px] font-bold text-navy-800 shrink-0">
                    {getInitials(s.name)}
                  </span>
                  <span className="flex-1 truncate">{s.name}</span>
                  {s.className && (
                    <span className="text-xs text-muted-foreground">
                      {s.className}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
