import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Premium Skeleton Loader
 * Uses the global `--skeleton` class which runs the 'shimmer' CSS animation
 * for a smooth, high-fidelity loading state.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-muted/50 dark:bg-muted/20 border border-border/30 skeleton", className)}
            {...props}
        />
    );
}
