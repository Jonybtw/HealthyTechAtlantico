import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight whitespace-nowrap transition-all duration-300 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/65 focus-visible:ring-offset-2 " +
    "disabled:pointer-events-none disabled:opacity-55 active:translate-y-px " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border border-navy-800 bg-gradient-to-b from-navy-800 via-navy-700 to-navy-600 text-white shadow-card hover:from-navy-700 hover:via-navy-600 hover:to-navy-500 dark:border-navy-800 dark:bg-navy-950/60",
        secondary:
          "border border-white/20 bg-white/10 text-navy-900 backdrop-blur-md shadow-card hover:bg-white/20 dark:text-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 font-bold",
        gold: "border border-gold-400 bg-gold-500 text-navy-950 shadow-card hover:bg-gold-400 dark:bg-gold-400 dark:hover:bg-gold-300 font-bold",
        danger:
          "border border-danger-600 bg-gradient-to-b from-danger-500 to-danger-700 text-white shadow-card hover:from-danger-400 hover:to-danger-600",
        ghost:
          "border border-transparent bg-transparent text-foreground hover:bg-white/10 dark:hover:bg-white/5",
        progress:
          "border border-gold-300/40 bg-[linear-gradient(135deg,rgba(244,211,94,0.98),rgba(234,179,8,0.94))] text-navy-950 shadow-[0_16px_34px_rgba(234,179,8,0.28)] hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(234,179,8,0.34)]",
        sanctuary:
          "border border-navy-800 bg-gradient-to-b from-navy-700 to-navy-900 text-white shadow-card hover:from-navy-600 hover:to-navy-800",
        outline:
          "border border-border bg-transparent text-foreground shadow-sm hover:bg-accent/10 hover:border-accent/40",
        link: "text-accent underline-offset-4 hover:underline border-0 shadow-none",
      },
      size: {
        sm: "h-8 px-3 py-1.5 text-xs",
        md: "h-9 px-4 py-2 text-sm",
        lg: "h-10 px-5 py-2.5 text-sm",
        xl: "h-12 px-6 py-3 text-sm",
        icon: "h-9 w-9 rounded-lg p-0",
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
