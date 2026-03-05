"use client";

import { useState } from "react";

interface RangeSliderProps {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  labels?: string[];                   // e.g. ["Nenhum","Baixo","Moderado","Elevado","Extremo"]
  colorStops?: string[];               // tailwind bg classes per stop
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
  const pct = ((value - min) / (max - min)) * 100;

  const activeLabel = labels
    ? labels[Math.round((value / max) * (labels.length - 1))]
    : undefined;

  const activeColor =
    colorStops?.[Math.round((value / max) * (colorStops.length - 1))] ??
    "bg-navy-600";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs text-muted-foreground">
          {value}
          {activeLabel ? ` — ${activeLabel}` : ""}
        </span>
      </div>

      <div
        className="relative h-6 flex items-center"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* track background */}
        <div className="absolute inset-x-0 h-2 rounded-full bg-muted" />

        {/* filled track */}
        <div
          className={`absolute h-2 rounded-full transition-all ${activeColor}`}
          style={{ width: `${pct}%` }}
        />

        {/* native range */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />

        {/* thumb */}
        <div
          className={`absolute -translate-x-1/2 size-5 rounded-full border-2 border-white shadow-md transition-transform ${activeColor} ${
            hovered ? "scale-125" : ""
          }`}
          style={{ left: `${pct}%` }}
        />
      </div>

      {/* tick labels */}
      {labels && (
        <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
