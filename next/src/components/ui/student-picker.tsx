"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";

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

const STUDENT_SWATCHES = [
  { background: "linear-gradient(135deg, #d8ad34 0%, #b88c19 100%)", color: "#091523" },
  { background: "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)", color: "#eff6ff" },
  { background: "linear-gradient(135deg, #059669 0%, #065f46 100%)", color: "#ecfdf5" },
  { background: "linear-gradient(135deg, #ea580c 0%, #9a3412 100%)", color: "#fff7ed" },
  { background: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)", color: "#f5f3ff" },
  { background: "linear-gradient(135deg, #e11d48 0%, #881337 100%)", color: "#fff1f2" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getStudentSwatch(student: Student) {
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
  const triggerRef = useRef<HTMLButtonElement>(null);
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

  const dropdown =
    open && menuStyle && typeof document !== "undefined"
      ? createPortal(
        <div
          ref={menuRef}
          className="animate-scale-in glass fixed z-[120] overflow-hidden rounded-[26px] shadow-float"
          style={menuStyle}
        >
          <div className="border-b border-border/60 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Procurar aluno..."
                className="w-full rounded-2xl border border-border/80 bg-card/80 py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-gold-500/50 focus:ring-4 focus:ring-gold-400/10"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
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
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-muted/45"
                  >
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                      style={swatch}
                    >
                      {getInitials(student.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {student.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {student.className ?? "Sem turma atribuída"}
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
      <button
        ref={triggerRef}
        type="button"
        onClick={() =>
          setOpen((current) => {
            if (current) {
              setSearch("");
            }

            return !current;
          })
        }
        aria-expanded={open}
        className={`flex min-h-14 w-full items-center gap-3 rounded-[24px] border px-4 py-3 text-left transition-all duration-300 ${
          open
            ? "border-gold-500/50 bg-card shadow-card"
            : "border-border/80 bg-card/70 hover:border-navy-300/40 hover:bg-card"
        }`}
      >
        {selected ? (
          <>
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
              style={getStudentSwatch(selected)}
            >
              {getInitials(selected.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {selected.name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {selected.className ?? "Sem turma atribuída"}
              </span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Limpar seleção"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(null);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <X className="size-4" />
              </button>
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
              <Search className="size-4" />
            </div>
            <span className="flex-1 text-sm text-muted-foreground">
              {placeholder}
            </span>
            <ChevronDown
              className={`size-4 text-muted-foreground transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </button>
      {dropdown}
    </div>
  );
}
