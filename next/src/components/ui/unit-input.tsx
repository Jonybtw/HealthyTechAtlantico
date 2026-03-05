"use client";

interface UnitInputProps {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  type?: "number" | "text";
  step?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  required?: boolean;
}

export function UnitInput({
  label,
  unit,
  value,
  onChange,
  type = "number",
  step,
  min,
  max,
  placeholder,
  required,
}: UnitInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-muted-foreground mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-lg border border-input bg-card px-3 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
          {unit}
        </span>
      </div>
    </div>
  );
}
