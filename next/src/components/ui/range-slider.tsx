"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type QuickChoice = {
  label: string;
  value: number;
};

interface RangeSliderProps {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  labels?: string[];
  colorStops?: string[];
  helperText?: string;
  quickChoices?: QuickChoice[];
  minLabel?: string;
  maxLabel?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function RangeSlider({
  label,
  min = 0,
  max = 10,
  step = 1,
  value,
  onChange,
  labels,
  colorStops,
  helperText,
  quickChoices,
  minLabel,
  maxLabel,
}: RangeSliderProps) {
  const [hovered, setHovered] = useState(false);
  const safeValue = clamp(value, min, max);
  const scale = max - min || 1;
  const percentage = ((safeValue - min) / scale) * 100;
  const labelIndex = labels ? Math.round(((safeValue - min) / scale) * (labels.length - 1)) : undefined;
  const activeLabel = labelIndex !== undefined ? labels?.[labelIndex] : undefined;
  const activeColor = colorStops?.[labelIndex ?? 0] ?? "bg-gradient-to-r from-navy-600 via-navy-700 to-navy-900";

  return (
    <div className="space-y-3 rounded-[22px] border border-border/60 bg-background/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-foreground">{label}</label>
          {helperText ? <p className="text-xs leading-relaxed text-muted-foreground">{helperText}</p> : null}
        </div>
        <div className="min-w-[74px] rounded-[16px] border border-border/60 bg-card/90 px-3 py-2 text-right shadow-sm">
          <p className="text-xl font-black tabular-nums tracking-[-0.06em] text-foreground">{safeValue}</p>
          {activeLabel ? <p className="text-[11px] font-medium text-muted-foreground">{activeLabel}</p> : null}
        </div>
      </div>

      {quickChoices?.length ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {quickChoices.map((choice) => {
            const choiceValue = clamp(choice.value, min, max);
            const active = choiceValue === safeValue;

            return (
              <button
                key={`${choice.label}-${choice.value}`}
                type="button"
                onClick={() => onChange(choiceValue)}
                className={cn(
                  "min-h-11 rounded-[16px] border px-3 py-2 text-sm font-semibold transition-all duration-300",
                  active
                    ? "border-navy-900/75 bg-navy-950 text-white shadow-card"
                    : "border-border/70 bg-background/70 text-foreground hover:-translate-y-0.5 hover:border-gold-300/55 hover:shadow-card-hover",
                )}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        className="relative flex h-8 items-center"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="absolute inset-x-0 h-3 rounded-full bg-muted/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.18)]" />
        <div className={cn("absolute h-3 rounded-full transition-all duration-300", activeColor)} style={{ width: `${percentage}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={safeValue}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={label}
          aria-valuetext={activeLabel ? `${safeValue} ${activeLabel}` : String(safeValue)}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />
        <div
          className={cn(
            "absolute z-0 flex size-7 -translate-x-1/2 items-center justify-center rounded-full border border-white/70 bg-card shadow-[0_14px_26px_rgba(15,23,42,0.24)] transition-all duration-300",
            hovered && "scale-110",
          )}
          style={{ left: `${percentage}%` }}
        >
          <div className={cn("size-4 rounded-full", activeColor)} />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <span>{minLabel ?? min}</span>
        <span>{maxLabel ?? max}</span>
      </div>

      {labels ? (
        <div className={`grid gap-2 text-[10px] font-medium text-muted-foreground ${labels.length === 3 ? "grid-cols-3" : "grid-cols-5"}`}>
          {labels.map((item, index) => (
            <span key={item} className={cn("text-center", index === labelIndex && "text-foreground")}>
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
