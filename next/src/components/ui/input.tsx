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
          <label htmlFor={uid} className="text-sm font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={uid}
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-card transition-colors
            focus:outline-none focus:ring-2 focus:ring-gold-500/40
            ${error ? "border-danger-500" : "border-border"}
            ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-danger-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
