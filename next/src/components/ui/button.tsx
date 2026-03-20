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
          "border border-navy-900/70 bg-gradient-to-b from-navy-800 to-navy-950 text-white shadow-card hover:shadow-card-hover",
        secondary:
          "border border-gold-500/30 bg-gradient-to-b from-gold-200 to-gold-400 text-navy-950 shadow-card hover:shadow-card-hover",
        danger:
          "border border-danger-700/30 bg-gradient-to-b from-danger-500 to-danger-700 text-white shadow-card hover:shadow-card-hover",
        ghost:
          "border border-border/70 bg-card/60 text-foreground shadow-none hover:border-navy-300/50 hover:bg-card",
        outline:
          "border border-border bg-transparent text-foreground shadow-sm hover:bg-accent/10 hover:border-accent/40",
        link: "text-accent underline-offset-4 hover:underline border-0 shadow-none",
      },
      size: {
        sm: "h-8 px-3 py-1.5 text-xs",
        md: "h-9 px-4 py-2 text-sm",
        lg: "h-10 px-5 py-2.5 text-sm",
        icon: "h-9 w-9 rounded-lg p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
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
    ref
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
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
