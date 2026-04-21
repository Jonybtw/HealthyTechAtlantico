import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonFocusRingClassName =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/65 focus-visible:ring-offset-2";

const raisedButtonClassName =
  "border shadow-card hover:-translate-y-0.5 hover:shadow-card-hover active:translate-y-px";

export const interactiveControlClasses = {
  choiceBase: cn(
    "group border text-left transition-all duration-300",
    buttonFocusRingClassName,
  ),
  choiceActive:
    "border-navy-800/90 bg-gradient-to-b from-navy-800 via-navy-700 to-navy-600 text-white shadow-card hover:border-navy-700 dark:border-navy-800 dark:from-navy-900 dark:via-navy-800 dark:to-navy-700",
  choiceInactive:
    "border-border bg-surface-utility text-foreground shadow-sm hover:-translate-y-0.5 hover:border-gold-300/45 hover:bg-surface-secondary hover:shadow-card-hover",
  choiceIconActive:
    "border-white/15 bg-white/12 text-gold-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
  choiceIconInactive:
    "border-gold-400/20 bg-gold-400/10 text-gold-600 dark:text-gold-300",
  segmentedGroup:
    "grid min-w-0 gap-1 rounded-full border border-border bg-surface-utility p-1 shadow-sm",
  segmentedActive:
    "border-navy-800/90 bg-gradient-to-b from-navy-800 via-navy-700 to-navy-600 text-white shadow-card hover:border-navy-700 dark:border-navy-800 dark:from-navy-900 dark:via-navy-800 dark:to-navy-700",
  segmentedInactive:
    "border-transparent bg-transparent text-muted-foreground hover:bg-surface-secondary hover:text-foreground",
} as const;

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight whitespace-nowrap transition-all duration-300 " +
    `${buttonFocusRingClassName} ` +
    "disabled:pointer-events-none disabled:opacity-55 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          `${raisedButtonClassName} border-navy-800/95 bg-gradient-to-b from-navy-800 via-navy-700 to-navy-600 text-white hover:from-navy-700 hover:via-navy-600 hover:to-navy-500 dark:border-navy-800 dark:from-navy-900 dark:via-navy-800 dark:to-navy-700`,
        secondary:
          `${raisedButtonClassName} border-border bg-surface-secondary text-foreground shadow-sm hover:border-gold-300/45 hover:bg-background`,
        gold:
          `${raisedButtonClassName} border-gold-400/80 bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 text-navy-950 hover:from-gold-200 hover:via-gold-300 hover:to-gold-400 dark:border-gold-300/70 dark:from-gold-300 dark:via-gold-400 dark:to-gold-500`,
        danger:
          `${raisedButtonClassName} border-danger-600/90 bg-gradient-to-b from-danger-500 via-danger-600 to-danger-700 text-white hover:from-danger-400 hover:via-danger-500 hover:to-danger-600`,
        ghost:
          "border border-transparent bg-transparent text-foreground hover:border-border hover:bg-surface-secondary",
        progress:
          `${raisedButtonClassName} border-gold-300/45 bg-[linear-gradient(135deg,rgba(244,211,94,0.98),rgba(234,179,8,0.94))] text-navy-950 shadow-[0_16px_34px_rgba(234,179,8,0.28)] hover:shadow-[0_22px_42px_rgba(234,179,8,0.34)]`,
        sanctuary:
          `${raisedButtonClassName} border-navy-800/95 bg-gradient-to-b from-navy-700 via-navy-800 to-navy-900 text-white hover:from-navy-600 hover:via-navy-700 hover:to-navy-800`,
        outline:
          "border border-border bg-surface-utility text-foreground shadow-sm hover:-translate-y-0.5 hover:border-gold-300/45 hover:bg-surface-secondary hover:shadow-card",
        link: "text-accent underline-offset-4 hover:underline border-0 shadow-none",
      },
      size: {
        sm: "h-8 px-3.5 py-1.5 text-xs",
        md: "h-9 px-4.5 py-2 text-sm",
        lg: "h-10 px-5 py-2.5 text-sm",
        xl: "h-12 px-6 py-3 text-sm",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      icon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || disabled}
        aria-busy={loading || undefined}
        aria-disabled={loading || disabled || undefined}
        {...props}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : icon ? (
          <span className="flex items-center">{icon}</span>
        ) : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
