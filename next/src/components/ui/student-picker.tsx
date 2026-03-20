"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";

interface Student {
  id: string;
  name: string;
  className?: string | null;
  schoolYear?: string | null;
  sex?: string;
}

export interface StudentPickerProps {
  students: Student[];
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  loading?: boolean;
}

export const STUDENT_SWATCHES = [
  { background: "linear-gradient(135deg, #d8ad34 0%, #b88c19 100%)", color: "#091523" },
  { background: "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)", color: "#eff6ff" },
  { background: "linear-gradient(135deg, #059669 0%, #065f46 100%)", color: "#ecfdf5" },
  { background: "linear-gradient(135deg, #ea580c 0%, #9a3412 100%)", color: "#fff7ed" },
  { background: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)", color: "#f5f3ff" },
  { background: "linear-gradient(135deg, #e11d48 0%, #881337 100%)", color: "#fff1f2" },
];

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getStudentSwatch(student: { id: string; name: string }) {
  const source = `${student.id}:${student.name}`;
  const hash = [...source].reduce(
    (acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0,
    0
  );

  return STUDENT_SWATCHES[hash % STUDENT_SWATCHES.length];
}

export function StudentPicker({
  students,
  value,
  onChange,
  placeholder = "Selecionar aluno...",
  loading = false,
}: StudentPickerProps) {
  const selected = students.find((student) => student.id === value) ?? null;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuStyle, setMenuStyle] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateMenuPosition = () => {
    if (!triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const maxLeft = Math.max(12, window.innerWidth - rect.width - 12);

    setMenuStyle({
      left: Math.min(rect.left, maxLeft),
      top: rect.bottom + 8,
      width: rect.width,
    });
  };

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
      setSearch("");
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!loading) {
      return;
    }

    setOpen(false);
    setSearch("");
  }, [loading]);

  useEffect(() => {
    if (!open) {
      return;
    }

    updateMenuPosition();

    const timeout = window.setTimeout(() => inputRef.current?.focus(), 30);
    const handleViewportChange = () => updateMenuPosition();

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open]);

  const filtered = students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div
        className="flex h-[46px] w-full items-center justify-between rounded-[18px] border border-input bg-card px-4 shadow-sm"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="flex w-full items-center gap-2.5">
          <span className="size-7 shrink-0 animate-pulse rounded-full bg-muted" />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="h-3 w-28 animate-pulse rounded bg-muted" />
            <span className="h-2.5 w-20 animate-pulse rounded bg-muted/70" />
          </span>
        </div>
      </div>
    );
  }

  const dropdown =
    open && menuStyle && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            className="animate-scale-in glass fixed z-[120] overflow-hidden rounded-[18px] shadow-float"
            style={menuStyle}
          >
            <div className="max-h-64 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Nenhum aluno encontrado.
                </p>
              ) : (
                filtered.map((student) => {
                  const swatch = getStudentSwatch(student);

                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => {
                        onChange(student.id);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted/45"
                    >
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                        style={swatch}
                      >
                        {getInitials(student.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {student.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {student.className ?? student.schoolYear ?? "Sem turma atribuida"}
                        </span>
                      </span>
                      {student.id === value ? (
                        <Check className="size-4 text-success-600" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className={`relative ${open ? "z-20" : ""}`}>
      <div
        ref={triggerRef}
        onClick={() => {
          if (loading) {
            return;
          }
          if (!open) {
            setSearch("");
            setOpen(true);
          }
        }}
        className={`flex h-[46px] w-full cursor-pointer items-center justify-between rounded-[18px] border px-4 text-left transition-all duration-300 outline-none focus-within:ring-1 focus-within:ring-ring ${
          open
            ? "border-gold-500/50 bg-card shadow-card"
            : "border-input bg-card shadow-sm hover:border-navy-300/40 hover:bg-muted/50 hover:text-foreground"
        }`}
      >
        {selected && !open ? (
          <div className="flex w-full items-center gap-2.5">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
              style={getStudentSwatch(selected)}
            >
              {getInitials(selected.name)}
            </span>
            <span className="min-w-0 flex-1 flex flex-col justify-center">
              <span className="truncate text-[13px] font-semibold leading-tight text-foreground">
                {selected.name}
              </span>
              <span className="truncate text-[10px] leading-none text-muted-foreground mt-0.5">
                {selected.className ?? selected.schoolYear ?? "Sem turma atribuída"}
              </span>
            </span>
            <div className="flex items-center gap-0.5">
              <span
                role="button"
                tabIndex={0}
                aria-label="Limpar selecao"
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(null);
                  setOpen(false);
                  setSearch("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    onChange(null);
                    setOpen(false);
                    setSearch("");
                  }
                }}
              >
                <X className="size-4" />
              </span>
              <ChevronDown
                className={`size-4 text-muted-foreground opacity-50 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between gap-2 whitespace-nowrap">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground mr-1" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={placeholder || "Procurar aluno..."}
                className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            {open && (
              <span
                role="button"
                tabIndex={0}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  setSearch("");
                }}
              >
                <ChevronDown className="h-4 w-4 opacity-50 rotate-180" />
              </span>
            )}
            {!open && (
              <ChevronDown className="h-4 w-4 opacity-50 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
      {dropdown}
    </div>
  );
}
