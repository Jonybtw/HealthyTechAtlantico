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
  floatingLabel?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    hint,
    leftIcon,
    className,
    id,
    type,
    showPasswordLabel,
    hidePasswordLabel,
    floatingLabel,
    ...props
  }, ref) => {
    const uid = id ?? props.name;
    const isPassword = type === "password";
    const useFloatingLabel = floatingLabel ?? Boolean(label);
    const [visible, setVisible] = React.useState(false);

    if (useFloatingLabel) {
      return (
        <div className="relative flex flex-col gap-1.5">
          <div className="relative flex items-center">
            {leftIcon ? (
              <span className="pointer-events-none absolute left-4 z-10 text-muted-foreground transition-colors peer-focus:text-gold-500">
                {leftIcon}
              </span>
            ) : null}
            <input
              ref={ref}
              id={uid}
              type={isPassword ? (visible ? "text" : "password") : type}
              placeholder=" "
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${uid}-error` : hint ? `${uid}-hint` : undefined}
              className={cn(
                "peer flex h-12 w-full rounded-full border border-border/70 bg-card px-4 pt-4 pb-1 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-sm",
                "transition-all duration-300",
                "focus:border-gold-500/60 focus:bg-card/50 focus:outline-none focus:ring-4 focus:ring-gold-400/15",
                "hover:border-navy-300/40 hover:bg-muted/50",
                "placeholder:text-transparent focus:placeholder:text-muted-foreground/50",
                "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "[&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[50000s] [&:-webkit-autofill]:ease-in-out [&:-webkit-autofill]:text-foreground",
                error
                  ? "border-danger-500/60 focus:border-danger-500 focus:ring-danger-500/15"
                  : "border-border/80",
                leftIcon ? "pl-11" : "pl-4",
                isPassword && "pr-11",
                className
              )}
              {...props}
            />
            {label ? (
              <label
                htmlFor={uid}
                className={cn(
                  "pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200",
                  "peer-focus:top-3 peer-focus:-translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-gold-500",
                  "peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-semibold",
                  leftIcon ? "pl-11" : "pl-4"
                )}
              >
                {label}
              </label>
            ) : null}
            {isPassword ? (
              <button
                type="button"
                tabIndex={-1}
                aria-label={visible ? (hidePasswordLabel ?? "Hide password") : (showPasswordLabel ?? "Show password")}
                onClick={() => setVisible((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
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

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={uid} className="text-xs font-semibold tracking-tight text-foreground">
            {label}
          </label>
        ) : null}
        <div className="relative">
          {leftIcon ? (
            <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4 text-muted-foreground">
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
              "flex h-12 w-full rounded-full border bg-card px-4 py-2 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-sm",
              "placeholder:text-muted-foreground/60 transition-all duration-300",
              "focus:border-gold-500/60 focus:bg-card/50 focus:outline-none focus:ring-4 focus:ring-gold-400/15",
              "hover:border-navy-300/40 hover:bg-muted/50",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "[&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[50000s] [&:-webkit-autofill]:ease-in-out [&:-webkit-autofill]:text-foreground",
              error
                ? "border-danger-500/60 focus:border-danger-500 focus:ring-danger-500/15"
                : "border-border/80",
              leftIcon && "pl-11",
              isPassword && "pr-11",
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
              className="absolute inset-y-0 right-2 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
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
