import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border font-semibold tracking-tight shadow-sm transition-colors",
  {
    variants: {
      variant: {
        default: "border-border/40 bg-card/80 text-foreground",
        success:
          "border-success-500/25 bg-success-100/80 text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-300",
        danger:
          "border-danger-500/25 bg-danger-100/80 text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-300",
        warning:
          "border-warning-500/25 bg-warning-50/80 text-warning-600 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-500",
        info: "border-navy-500/25 bg-navy-100/80 text-navy-700 dark:border-navy-400/20 dark:bg-navy-400/10 dark:text-navy-200",
        gold: "border-gold-500/25 bg-gold-100/80 text-gold-700 dark:border-gold-400/20 dark:bg-gold-400/10 dark:text-gold-300",
      },
      size: {
        sm: "gap-1 px-2 py-0.5 text-micro",
        md: "gap-1.5 px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  },
);

interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
