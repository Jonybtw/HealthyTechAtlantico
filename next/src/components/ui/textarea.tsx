import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[72px] w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-sm text-foreground",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-all duration-300",
      "placeholder:text-muted-foreground",
      "focus:border-gold-500/60 focus:bg-card focus:outline-none focus:ring-3 focus:ring-gold-400/12",
      "hover:border-navy-300/40",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
