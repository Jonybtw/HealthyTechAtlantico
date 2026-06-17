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

const inputActiveClassName =
  "focus:!border-gold-400 focus:bg-background focus:outline-none focus:ring-4 focus:ring-gold-400/20";

const inputErrorClassName =
  "border-danger-500/60 focus:!border-danger-500 focus:ring-danger-500/15";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      className,
      id,
      type,
      onBlur,
      onFocus,
      style,
      showPasswordLabel,
      hidePasswordLabel,
      floatingLabel,
      ...props
    },
    ref,
  ) => {
    const uid = id ?? props.name;
    const isPassword = type === "password";
    const useFloatingLabel = floatingLabel ?? Boolean(label);
    const [visible, setVisible] = React.useState(false);
    const [focused, setFocused] = React.useState(false);
    const stateVisualStyle: React.CSSProperties | undefined = error
      ? {
          borderColor: focused ? "#ef4444" : "rgba(239, 68, 68, 0.6)",
          boxShadow: focused
            ? "0 0 0 4px rgba(239, 68, 68, 0.15), inset 0 0 0 1px #ef4444"
            : "inset 0 0 0 1px rgba(239, 68, 68, 0.6)",
          outline: focused ? "none" : undefined,
        }
      : focused
        ? {
            borderColor: "#d8ad34",
            boxShadow:
              "0 0 0 4px rgba(216, 173, 52, 0.2), inset 0 0 0 1px #d8ad34",
            outline: "none",
          }
        : undefined;
    const inputStyle = stateVisualStyle
      ? { ...style, ...stateVisualStyle }
      : style;
    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(event);
    };
    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(event);
    };

    if (useFloatingLabel) {
      return (
        <div className="relative flex flex-col gap-1.5">
          <div
            className="group relative flex items-center"
            suppressHydrationWarning
          >
            {leftIcon ? (
              <span className="pointer-events-none absolute inset-y-0 left-4 z-10 flex items-center text-muted-foreground transition-colors group-focus-within:text-gold-500">
                {leftIcon}
              </span>
            ) : null}
            <input
              suppressHydrationWarning
              ref={ref}
              id={uid}
              type={isPassword ? (visible ? "text" : "password") : type}
              placeholder=" "
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
              aria-invalid={error ? true : undefined}
              aria-describedby={
                error ? `${uid}-error` : hint ? `${uid}-hint` : undefined
              }
              className={cn(
                "peer flex h-12 w-full rounded-[16px] border border-input bg-background px-4 pb-1.5 pt-5 text-sm text-foreground shadow-sm",
                "transition-all duration-300",
                inputActiveClassName,
                "hover:border-input-hover hover:bg-background/90",
                "placeholder:text-transparent focus:placeholder:text-navy-950/50 dark:focus:placeholder:text-white/30",
                "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "[&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[50000s] [&:-webkit-autofill]:ease-in-out [&:-webkit-autofill]:text-foreground",
                error ? inputErrorClassName : "",
                leftIcon ? "pl-11" : "pl-4",
                isPassword && "pr-11",
                className,
              )}
              {...props}
            />
            {label ? (
              <label
                htmlFor={uid}
                className={cn(
                  "pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200",
                  "peer-focus:top-[0.45rem] peer-focus:-translate-y-0 peer-focus:text-micro peer-focus:font-semibold peer-focus:leading-none peer-focus:text-gold-500",
                  "peer-[:not(:placeholder-shown)]:top-[0.45rem] peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-micro peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:leading-none",
                  leftIcon ? "pl-11" : "pl-4",
                )}
              >
                {label}
              </label>
            ) : null}
            {isPassword ? (
              <button
                type="button"
                tabIndex={-1}
                  aria-label={
                    visible
                    ? (hidePasswordLabel ?? "Ocultar palavra-passe")
                    : (showPasswordLabel ?? "Mostrar palavra-passe")
                  }
                onClick={() => setVisible((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground group-focus-within:text-foreground"
              >
                {visible ? (
                  <Eye className="size-4" />
                ) : (
                  <EyeOff className="size-4" />
                )}
              </button>
            ) : null}
          </div>
          {error ? (
            <p
              id={`${uid}-error`}
              role="alert"
              className="text-tiny font-medium leading-relaxed text-danger-600"
            >
              {error}
            </p>
          ) : hint ? (
            <p
              id={`${uid}-hint`}
              className="text-tiny leading-relaxed text-muted-foreground"
            >
              {hint}
            </p>
          ) : null}
        </div>
      );
    }

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
        <div className="group relative" suppressHydrationWarning>
          {leftIcon ? (
            <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4 text-muted-foreground transition-colors group-focus-within:text-gold-500">
              {leftIcon}
            </span>
          ) : null}
          <input
            suppressHydrationWarning
            ref={ref}
            id={uid}
            type={isPassword ? (visible ? "text" : "password") : type}
            style={inputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? `${uid}-error` : hint ? `${uid}-hint` : undefined
            }
            className={cn(
              "flex h-12 w-full rounded-[16px] border border-input bg-background px-4 py-2 text-sm text-foreground shadow-sm",
              "placeholder:text-muted-foreground transition-all duration-300",
              inputActiveClassName,
              "hover:border-input-hover hover:bg-background/90",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "[&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[50000s] [&:-webkit-autofill]:ease-in-out [&:-webkit-autofill]:text-foreground",
              error ? inputErrorClassName : "",
              leftIcon && "pl-11",
              isPassword && "pr-11",
              className,
            )}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              tabIndex={-1}
                aria-label={
                  visible
                  ? (hidePasswordLabel ?? "Ocultar palavra-passe")
                  : (showPasswordLabel ?? "Mostrar palavra-passe")
                }
              onClick={() => setVisible((v) => !v)}
              className="absolute inset-y-0 right-2 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground group-focus-within:text-foreground"
            >
              {visible ? (
                <Eye className="size-4" />
              ) : (
                <EyeOff className="size-4" />
              )}
            </button>
          ) : null}
        </div>
        {error ? (
          <p
            id={`${uid}-error`}
            role="alert"
            className="text-tiny font-medium leading-relaxed text-danger-600"
          >
            {error}
          </p>
        ) : hint ? (
          <p
            id={`${uid}-hint`}
            className="text-tiny leading-relaxed text-muted-foreground"
          >
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
