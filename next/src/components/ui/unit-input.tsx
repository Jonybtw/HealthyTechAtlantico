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
  icon?: React.ReactNode;
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
  icon,
}: UnitInputProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold tracking-tight text-foreground">
        {label}
      </span>
      <div className="group relative">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3 text-muted-foreground transition-colors duration-300 group-focus-within:text-foreground">
            {icon}
          </span>
        ) : null}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-[8px] border border-border/80 bg-card/80 py-2 pr-14 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-all duration-300 placeholder:text-muted-foreground hover:border-navy-300/40 focus:border-gold-500/60 focus:bg-card focus:outline-none focus:ring-3 focus:ring-gold-400/12 ${icon ? "pl-9" : "px-3"}`}
        />
        <span className="pointer-events-none absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-[6px] border border-border/70 bg-background/90 px-2 py-0.5 text-micro font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-sm transition-colors duration-300 group-focus-within:border-gold-400/40 group-focus-within:text-foreground">
          {unit}
        </span>
      </div>
    </label>
  );
}
