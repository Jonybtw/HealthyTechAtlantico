"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, className, id, type, showPasswordLabel, hidePasswordLabel, ...props }, ref) => {
    const uid = id ?? props.name;
    const isPassword = type === "password";
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={uid}
            className="text-xs font-semibold tracking-tight text-foreground"
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          {leftIcon ? (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              {leftIcon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={uid}
            type={isPassword ? (visible ? "text" : "password") : type}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${uid}-error` : hint ? `${uid}-hint` : undefined}
            className={cn(
              "flex h-10 w-full rounded-xl border bg-card/75 px-3 py-2 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]",
              "placeholder:text-muted-foreground transition-all duration-300",
              "focus:border-gold-500/60 focus:bg-card focus:outline-none focus:ring-3 focus:ring-gold-400/12",
              "hover:border-navy-300/40",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-danger-500/60 focus:border-danger-500 focus:ring-danger-500/15"
                : "border-border/80",
              leftIcon && "pl-9",
              isPassword && "pr-10",
              className
            )}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label={visible ? (hidePasswordLabel ?? "Hide password") : (showPasswordLabel ?? "Show password")}
              onClick={() => setVisible((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
            >
              {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
          ) : null}
        </div>
        {error ? (
          <p id={`${uid}-error`} role="alert" className="text-[11px] font-medium leading-relaxed text-danger-600">{error}</p>
        ) : hint ? (
          <p id={`${uid}-hint`} className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
