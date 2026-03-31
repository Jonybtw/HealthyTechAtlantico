"use client";

import { interactiveControlClasses } from "@/components/ui/button";
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
          interactiveControlClasses.segmentedGroup,
          size === "lg" ? "min-h-[52px] items-center" : "min-h-10",
        )}
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        }}
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
                "inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border font-semibold tracking-tight transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/65 focus-visible:ring-offset-2",
                size === "lg"
                  ? "min-h-[42px] px-4 py-2 text-sm sm:px-5"
                  : "min-h-8 px-4 py-1 text-tiny",
                active
                  ? interactiveControlClasses.segmentedActive
                  : interactiveControlClasses.segmentedInactive,
              )}
            >
              {option.icon}
              <span className="truncate text-center leading-tight">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
