"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChartFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  fallback?: React.ReactNode;
}

export function ChartFrame({
  className,
  children,
  fallback,
  ...props
}: ChartFrameProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const updateReady = () => {
      const nextReady = node.clientWidth > 0 && node.clientHeight > 0;
      setReady((current) => (current === nextReady ? current : nextReady));
    };

    updateReady();

    const observer = new ResizeObserver(() => {
      updateReady();
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={cn("w-full", className)} {...props}>
      {ready
        ? children
        : (fallback ?? (
            <div className="h-full w-full animate-pulse rounded-2xl bg-muted/30" />
          ))}
    </div>
  );
}
