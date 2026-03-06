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
    <div>
      {label && (
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      )}
      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-2 p-1.5 bg-muted/80 backdrop-blur-sm rounded-xl w-full shadow-inner ring-1 ring-black/5 inset-shadow-sm"
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex flex-1 items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                        transition-all duration-300 active:scale-95 ${value === opt.value
                ? "bg-card text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-border scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-white/50"
              }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
