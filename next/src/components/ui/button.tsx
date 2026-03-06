"use client";

import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "active:scale-[0.98] active:translate-y-[1px] hover:scale-[1.03] hover:-translate-y-[1px] shadow-sm relative overflow-hidden transition-transform ease-out";

const variants: Record<Variant, string> = {
  primary: "bg-gradient-to-b from-navy-700 to-navy-900 hover:from-navy-600 hover:to-navy-800 text-white shadow-[0_4px_14px_rgba(20,48,76,0.39)] hover:shadow-[0_6px_20px_rgba(20,48,76,0.23)] active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] ring-1 ring-navy-900 inset-shadow-sm focus-visible:ring-navy-600",
  secondary: "bg-gradient-to-b from-gold-300 to-gold-500 hover:from-gold-200 hover:to-gold-400 text-navy-950 shadow-[0_4px_14px_rgba(224,180,40,0.39)] hover:shadow-[0_6px_20px_rgba(224,180,40,0.23)] active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.2)] ring-1 ring-gold-600/50 inset-shadow-sm focus-visible:ring-gold-400",
  danger: "bg-gradient-to-b from-danger-500 to-danger-700 hover:from-danger-400 hover:to-danger-600 text-white shadow-[0_4px_14px_rgba(220,38,38,0.39)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.23)] active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] ring-1 ring-danger-800 inset-shadow-sm focus-visible:ring-danger-500",
  ghost: "bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground focus-visible:ring-navy-400 shadow-none hover:shadow-sm active:-translate-y-0 active:scale-[0.97] active:shadow-inner",
};

const sizes: Record<Size, string> = {
  sm: "text-xs px-3.5 py-1.5",
  md: "text-sm px-4.5 py-2.5",
  lg: "text-base px-6 py-3.5",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity" />
      {loading ? <Loader2 className="size-4 animate-spin relative z-10" /> : <span className="relative z-10 flex">{icon}</span>}
      <span className="relative z-10 drop-shadow-sm">{children}</span>
    </button>
  );
}
