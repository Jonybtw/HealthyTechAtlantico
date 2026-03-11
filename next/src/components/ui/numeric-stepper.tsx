"use client";

import { Minus, Plus } from "lucide-react";

interface NumericStepperProps {
  label?: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export function NumericStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit,
}: NumericStepperProps) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="inline-flex items-center border border-border rounded-xl bg-muted/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all duration-300">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          aria-label={label ? `Diminuir ${label}` : "Diminuir"}
          className="px-2.5 py-2 text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all rounded-l-xl active:scale-95"
        >
          <Minus className="size-4" />
        </button>
        <div className="flex bg-card h-full items-center justify-center border-x border-border/50 ring-1 ring-black/5 shadow-sm">
          <span className="px-3 py-1.5 min-w-[3rem] text-center font-bold tabular-nums text-foreground">
            {value}
            {unit && <span className="text-xs text-muted-foreground ml-0.5 font-medium">{unit}</span>}
          </span>
        </div>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          aria-label={label ? `Aumentar ${label}` : "Aumentar"}
          className="px-2.5 py-2 text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all rounded-r-xl active:scale-95"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
