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
        className={`glass-dark flex flex-wrap gap-1 p-1 ${size === "lg" ? "rounded-full min-h-[48px] items-center" : "rounded-full"}`}
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
              className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-500 whitespace-nowrap ${
                size === "lg"
                  ? "min-h-[40px] rounded-full px-5 py-1.5 text-[13px] flex-1"
                  : "min-h-8 rounded-full px-4 py-1 text-[11px]"
              } ${
                active
                  ? "bg-primary-600/20 text-white shadow-[0_0_15px_rgba(30,58,138,0.3)] border border-white/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
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
