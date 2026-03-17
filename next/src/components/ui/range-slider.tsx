"use client";

import { useState } from "react";

interface RangeSliderProps {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  labels?: string[];
  colorStops?: string[];
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
}: RangeSliderProps) {
  const [hovered, setHovered] = useState(false);
  const safeValue = clamp(value, min, max);
  const scale = max - min || 1;
  const percentage = ((safeValue - min) / scale) * 100;
  const labelIndex = labels
    ? Math.round(((safeValue - min) / scale) * (labels.length - 1))
    : undefined;
  const activeLabel = labelIndex !== undefined ? labels?.[labelIndex] : undefined;
  const activeColor =
    colorStops?.[labelIndex ?? 0] ??
    "bg-gradient-to-r from-navy-600 via-navy-700 to-navy-900";

  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <label className="text-xs font-semibold tracking-tight text-foreground">
          {label}
        </label>
        <div className="text-right">
          <p className="text-xs font-semibold tabular-nums text-foreground">{safeValue}</p>
          {activeLabel ? (
            <p className="text-[11px] text-muted-foreground">{activeLabel}</p>
          ) : null}
        </div>
      </div>

      <div
        className="relative flex h-5 items-center"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-muted/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.14)]" />
        <div
          className={`absolute h-1.5 rounded-full transition-all duration-300 ${activeColor}`}
          style={{ width: `${percentage}%` }}
        />
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
          className={`absolute z-0 flex size-4 -translate-x-1/2 items-center justify-center rounded-full border border-white/70 bg-card shadow-[0_10px_24px_rgba(15,23,42,0.22)] transition-all duration-300 ${
            hovered ? "scale-110" : ""
          }`}
          style={{ left: `${percentage}%` }}
        >
          <div className={`size-2.5 rounded-full ${activeColor}`} />
        </div>
      </div>

      {labels ? (
        <div className="grid grid-cols-5 gap-2 text-[10px] font-medium text-muted-foreground">
          {labels.map((item, index) => (
            <span
              key={item}
              className={index === labelIndex ? "text-foreground" : undefined}
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
