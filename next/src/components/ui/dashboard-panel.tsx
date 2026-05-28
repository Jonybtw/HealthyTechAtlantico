"use client";

import { cn } from "@/lib/utils";

export function sectionAnimation(index: number, reducedEffects: boolean) {
  if (reducedEffects) return {};
  return {
    animationDelay: `${index * 70}ms`,
  };
}

interface DashboardPanelProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
  reducedEffects?: boolean;
}

export function DashboardPanel({
  children,
  className,
  index = 0,
  reducedEffects = false,
}: DashboardPanelProps) {
  return (
    <section
      style={sectionAnimation(index, reducedEffects)}
      className={cn(
        "relative overflow-hidden rounded-[12px] border border-border bg-card/88 shadow-[0_4px_12px_rgba(9,21,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-navy-950/68 dark:shadow-[0_4px_18px_rgba(0,0,0,0.22)]",
        !reducedEffects && "animate-fade-in-up opacity-0",
        className,
      )}
    >
      <div className="relative">{children}</div>
    </section>
  );
}
