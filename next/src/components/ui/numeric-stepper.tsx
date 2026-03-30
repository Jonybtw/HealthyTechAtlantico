"use client";

import type { ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type NumericStepperPreset = {
  label: string;
  value: number;
  icon?: ReactNode;
};

interface NumericStepperProps {
  label?: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  helperText?: string;
  presets?: NumericStepperPreset[];
  accent?: "navy" | "gold" | "success";
  decreaseLabel?: string;
  increaseLabel?: string;
  stateLabels?: {
    min: string;
    max: string;
    active: string;
  };
}

const accentClasses: Record<
  NonNullable<NumericStepperProps["accent"]>,
  string
> = {
  navy: "border-navy-300/45 bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.12),transparent_56%)]",
  gold: "border-gold-300/50 bg-[radial-gradient(circle_at_top,rgba(234,179,8,0.16),transparent_56%)]",
  success:
    "border-success-300/45 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.14),transparent_56%)]",
};

export function NumericStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit,
  helperText,
  presets,
  accent = "navy",
  decreaseLabel = "Decrease",
  increaseLabel = "Increase",
  stateLabels = {
    min: "Min",
    max: "Max",
    active: "Fine tune",
  },
}: NumericStepperProps) {
  const clampValue = (nextValue: number) =>
    Math.min(Math.max(nextValue, min), max);
  const safeValue = clampValue(value);
  const dec = () => onChange(Math.max(min, safeValue - step));
  const inc = () => onChange(Math.min(max, safeValue + step));

  return (
    <div
      className={cn(
        "grid gap-3 rounded-2xl border bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        accentClasses[accent],
      )}
    >
      {label ? (
        <div className="space-y-1">
          <label className="text-sm font-semibold leading-relaxed text-foreground">
            {label}
          </label>
          {helperText ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {helperText}
            </p>
          ) : null}
        </div>
      ) : null}

      {presets?.length ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {presets.map((preset) => {
            const active = safeValue === preset.value;

            return (
              <button
                key={`${preset.label}-${preset.value}`}
                type="button"
                onClick={() => onChange(clampValue(preset.value))}
                className={cn(
                  "flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-all duration-300",
                  active
                    ? "border-navy-900/75 bg-navy-950 text-white shadow-card"
                    : "border-border/70 bg-background/70 text-foreground hover:-translate-y-0.5 hover:border-gold-300/55 hover:shadow-card-hover",
                )}
              >
                {preset.icon ? (
                  <span className="flex items-center">{preset.icon}</span>
                ) : null}
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        className="grid gap-3 rounded-2xl border border-border/70 bg-background/80 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
        aria-label={label}
        aria-valuetext={unit ? `${safeValue} ${unit}` : String(safeValue)}
      >
        <button
          type="button"
          onClick={dec}
          disabled={safeValue <= min}
          aria-label={label ? `${decreaseLabel} ${label}` : decreaseLabel}
          className="flex h-12 w-full items-center justify-center rounded-2xl border border-border/70 bg-card/85 text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-300/55 hover:shadow-card-hover disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 sm:w-12"
        >
          <Minus className="size-4" />
        </button>

        <div className="rounded-2xl border border-border/60 bg-card/95 px-4 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-end justify-center gap-2">
            <span className="text-3xl font-black tabular-nums tracking-[-0.06em] text-foreground">
              {safeValue}
            </span>
            {unit ? (
              <span className="mb-1 rounded-full bg-muted px-2.5 py-1 text-tiny font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {unit}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-tiny font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {safeValue <= min
              ? stateLabels.min
              : safeValue >= max
                ? stateLabels.max
                : stateLabels.active}
          </p>
        </div>

        <button
          type="button"
          onClick={inc}
          disabled={safeValue >= max}
          aria-label={label ? `${increaseLabel} ${label}` : increaseLabel}
          className="flex h-12 w-full items-center justify-center rounded-2xl border border-border/70 bg-card/85 text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-300/60 hover:shadow-card-hover disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 sm:w-12"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
