import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedEffects } from "@/hooks/use-reduced-effects";

function useAnimatedNumber(
  target: number,
  duration = 600,
  disabled = false,
) {
  const [display, setDisplay] = useState(target);
  const raf = useRef<number | undefined>(undefined);
  const previousTarget = useRef(target);

  useEffect(() => {
    if (previousTarget.current === target) {
      return;
    }

    if (disabled) {
      previousTarget.current = target;
      return;
    }

    const start = performance.now();
    const from = previousTarget.current;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };

    previousTarget.current = target;
    raf.current = requestAnimationFrame(tick);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration, disabled]);

  return disabled ? target : display;
}

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  delay?: number;
  accent?: "gold" | "green" | "red" | "blue";
  emphasis?: "default" | "hero";
  footer?: React.ReactNode;
}

const accents = {
  gold: {
    iconBg: "bg-gold-400 text-navy-950 shadow-sm",
    barFill: "bg-gold-400",
  },
  green: {
    iconBg: "bg-success-600 text-white shadow-sm",
    barFill: "bg-success-600",
  },
  red: {
    iconBg: "bg-danger-600 text-white shadow-sm",
    barFill: "bg-danger-600",
  },
  blue: {
    iconBg:
      "bg-navy-900 text-white shadow-sm dark:bg-navy-800",
    barFill: "bg-navy-900 dark:bg-gold-300",
  },
};

export function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  accent = "blue",
  emphasis = "default",
  footer,
}: KpiCardProps) {
  const styles = accents[accent];
  const isNumeric = typeof value === "number";
  const reducedEffects = useReducedEffects();
  const animatedValue = useAnimatedNumber(
    isNumeric ? value : 0,
    600,
    reducedEffects,
  );
  const heroCard = emphasis === "hero";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-[16px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(9,21,35,0.12)] dark:hover:shadow-[0_10px_28px_rgba(0,0,0,0.34)]",
        heroCard
          ? "border border-white/10 bg-navy-950 text-white shadow-[0_4px_18px_rgba(0,0,0,0.22)]"
          : "border border-border bg-card/88 text-foreground shadow-[0_4px_12px_rgba(9,21,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-navy-950/68 dark:text-white dark:shadow-[0_4px_18px_rgba(0,0,0,0.22)]",
        reducedEffects && "transition-none hover:translate-y-0",
      )}
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" />
      <CardContent className="relative p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3
            className={cn(
              "text-sm font-semibold",
              heroCard ? "text-gold-200" : "text-muted-foreground",
            )}
          >
            {title}
          </h3>
          <div
            className={cn(
              "shrink-0 rounded-[14px] p-2 transition-transform duration-300 group-hover:scale-105",
              styles.iconBg,
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>

        <p
          className={cn(
            "text-5xl font-extrabold tabular-nums tracking-tight",
            heroCard ? "text-white" : "text-foreground",
            accent === "red" && !heroCard && "text-danger-600 dark:text-danger-400",
          )}
        >
          {isNumeric ? animatedValue : value}
        </p>

        {footer ? (
          <p
            className={cn(
              "mt-2 inline-flex items-center gap-1 text-xs font-semibold",
              heroCard ? "text-white/74" : "text-muted-foreground",
            )}
          >
            {footer}
          </p>
        ) : description ? (
          <p
            className={cn(
              "mt-2 text-xs font-semibold",
              heroCard ? "text-white/74" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
