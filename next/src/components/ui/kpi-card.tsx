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
    iconBg: "bg-gold-400 text-navy-950 shadow-lg shadow-gold-400/30",
    barFill: "bg-gold-400",
  },
  green: {
    iconBg: "bg-success-600 text-white shadow-lg shadow-success-600/30",
    barFill: "bg-success-600",
  },
  red: {
    iconBg: "bg-danger-600 text-white shadow-lg shadow-danger-600/30",
    barFill: "bg-danger-600",
  },
  blue: {
    iconBg:
      "bg-navy-900 text-white shadow-lg shadow-navy-900/30 dark:bg-navy-800",
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
        "group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover",
        heroCard
          ? "border border-white/16 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white shadow-float"
          : "surface-primary",
        reducedEffects && "transition-none hover:translate-y-0 hover:shadow-float",
      )}
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(216,173,52,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_32%)]" />
      <CardContent className="relative p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between">
          <div
            className={cn(
              "rounded-2xl p-3 transition-transform duration-300 group-hover:scale-110",
              styles.iconBg,
            )}
          >
            <Icon className="size-6" />
          </div>
        </div>

        <h3
          className={cn(
            "mb-2 text-tiny font-semibold uppercase tracking-[0.22em]",
            heroCard ? "text-gold-200" : "text-muted-foreground",
          )}
        >
          {title}
        </h3>

        <p
          className={cn(
            "text-3xl font-extrabold tabular-nums tracking-tight",
            heroCard ? "text-white" : "text-foreground",
          )}
        >
          {isNumeric ? animatedValue : value}
        </p>

        {description ? (
          <p
            className={cn(
              "mt-2 text-sm leading-relaxed",
              heroCard ? "text-white/74" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        ) : null}



        {footer ? (
          <div
            className={cn(
              "mt-5 border-t pt-4",
              heroCard
                ? "border-white/14 text-white/80"
                : "border-navy-200 dark:border-navy-800",
            )}
          >
            {footer}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
