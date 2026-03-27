"use client";

import { cn } from "@/lib/utils";

interface PillSelectProps<T extends string> {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  size?: "default" | "lg";
}

export function PillSelect<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "default",
}: PillSelectProps<T>) {
  return (
    <div className="flex h-full flex-col gap-1.5">
      {label ? (
        <p className="text-xs font-semibold tracking-tight text-foreground">
          {label}
        </p>
      ) : null}
      <div
        role="radiogroup"
        aria-label={label}
        className={cn(
          "grid min-w-0 gap-1 rounded-full border border-navy-200/80 bg-white/75 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
          size === "lg" ? "min-h-[52px] items-center" : "min-h-10",
        )}
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const active = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border font-medium transition-all duration-300",
                size === "lg"
                  ? "min-h-[42px] px-4 py-2 text-[13px] sm:px-5"
                  : "min-h-8 px-4 py-1 text-[11px]",
                active
                  ? "border-navy-800/10 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 text-white shadow-card dark:border-gold-300/20 dark:from-gold-400 dark:via-gold-300 dark:to-gold-200 dark:text-navy-950"
                  : "border-transparent text-navy-400 hover:bg-navy-100/80 hover:text-navy-800 dark:text-navy-200 dark:hover:bg-white/8 dark:hover:text-white",
              )}
            >
              {option.icon}
              <span className="truncate text-center leading-tight">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
