import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full rounded-2xl border border-border/80 bg-card/75 px-4 py-3 text-sm text-foreground",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-300",
      "placeholder:text-muted-foreground",
      "focus:border-gold-500/60 focus:bg-card focus:outline-none focus:ring-4 focus:ring-gold-400/15",
      "hover:border-navy-300/40",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
