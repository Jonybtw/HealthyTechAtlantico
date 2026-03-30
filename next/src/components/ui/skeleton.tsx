import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/50 border border-border/30 skeleton",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
