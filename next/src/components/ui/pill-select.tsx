"use client";

interface PillSelectProps<T extends string> {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}

export function PillSelect<T extends string>({
  options,
  value,
  onChange,
  label,
}: PillSelectProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <p className="text-sm font-semibold tracking-tight text-foreground">
          {label}
        </p>
      ) : null}
      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-1.5 rounded-xl border border-border/70 bg-card/70 p-1.5"
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
              className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-300 ${
                active
                  ? "bg-navy-900 text-white shadow-card"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
