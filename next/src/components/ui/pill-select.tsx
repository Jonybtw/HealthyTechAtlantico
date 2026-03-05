"use client";

interface PillSelectProps<T extends string> {
  options: { value: T; label: string }[];
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
        <p className="text-sm font-medium text-muted-foreground mb-2">
          {label}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              value === opt.value
                ? "bg-navy-800 text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-navy-100 hover:text-navy-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
