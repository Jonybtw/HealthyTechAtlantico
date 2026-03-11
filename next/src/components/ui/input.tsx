import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, type, ...props }, ref) => {
    const uid = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={uid}
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={uid}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-xl border bg-card/75 px-3.5 py-2 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
            "placeholder:text-muted-foreground transition-all duration-300",
            "focus:border-gold-500/60 focus:bg-card focus:outline-none focus:ring-4 focus:ring-gold-400/15",
            "hover:border-navy-300/40",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-danger-500/60 focus:border-danger-500 focus:ring-danger-500/15"
              : "border-border/80",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs font-medium text-danger-600">{error}</p>
        ) : hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
