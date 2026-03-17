"use client";

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
    <div className="flex flex-col gap-1.5 h-full">
      {label ? (
        <p className="text-xs font-semibold tracking-tight text-foreground">
          {label}
        </p>
      ) : null}
      <div
        role="radiogroup"
        aria-label={label}
        className={`surface-utility flex flex-wrap gap-1 p-1 ${size === "lg" ? "rounded-[18px] min-h-[46px] items-center" : "rounded-[18px]"}`}
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
              className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 whitespace-nowrap ${
                size === "lg"
                  ? "min-h-[38px] rounded-[14px] px-4 py-1.5 text-sm flex-1"
                  : "min-h-8 rounded-[12px] px-3 py-1 text-xs"
              } ${
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
