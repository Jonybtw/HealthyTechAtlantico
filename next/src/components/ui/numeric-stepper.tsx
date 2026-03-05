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
      <div className="inline-flex items-center border border-border rounded-lg overflow-hidden bg-card">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          className="px-3 py-2 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
        >
          <Minus className="size-4" />
        </button>
        <span className="px-4 py-2 min-w-[3rem] text-center font-semibold tabular-nums">
          {value}
          {unit && <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          className="px-3 py-2 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
