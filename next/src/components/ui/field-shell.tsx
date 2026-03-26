"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function FieldShell({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-[0.9rem] z-10 text-[10px] font-semibold text-muted-foreground">
          {label}
        </span>
        {children}
      </div>
      {error ? (
        <p role="alert" className="text-[11px] font-medium leading-relaxed text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
