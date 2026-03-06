import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const uid = id ?? props.name;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={uid} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={uid}
          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-muted/30 text-foreground
            placeholder:text-muted-foreground shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]
            transition-all duration-300 ease-out
            focus:outline-none focus:bg-card focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.02),0_0_0_4px_rgba(194,151,13,0.15)] focus:border-gold-500
            hover:border-navy-300 hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.04)]
            dark:focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.02),0_0_0_4px_rgba(224,180,40,0.2)] dark:focus:border-gold-400
            ${error ? "border-danger-500 focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.02),0_0_0_4px_rgba(220,38,38,0.15)] focus:border-danger-500" : "border-border/60"}
            ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-danger-600 animate-fade-in">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
