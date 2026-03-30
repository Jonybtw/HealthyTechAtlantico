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
    if (disabled) {
      previousTarget.current = target;
      setDisplay(target);
      return;
    }

    if (previousTarget.current === target) {
      return;
    }

    const start = performance.now();
    const from = previousTarget.current;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
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

  return display;
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
        "group relative overflow-hidden rounded-xl border border-white/25 bg-white/78 shadow-float backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover dark:border-white/10 dark:bg-navy-950/72",
        reducedEffects && "transition-none hover:translate-y-0 hover:shadow-float",
        heroCard &&
          "bg-gradient-to-br from-navy-800 via-navy-700 to-navy-600 text-white dark:from-navy-900 dark:via-navy-800 dark:to-navy-700",
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(216,173,52,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_32%)]" />
      <CardContent className="relative p-6 sm:p-7">
        <div className="mb-6 flex items-start justify-between">
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
            "mb-1 text-sm font-semibold tracking-wide",
            heroCard ? "text-white/72" : "text-muted-foreground",
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "mb-4 text-3xl font-extrabold tabular-nums tracking-tight",
            heroCard ? "text-white" : "text-navy-950 dark:text-white",
          )}
        >
          {isNumeric ? animatedValue : value}
          {description ? (
            <span
              className={cn(
                "ml-2 mt-1 block text-sm font-medium sm:mt-0 sm:inline",
                heroCard
                  ? "text-white/74"
                  : "text-navy-900/60 dark:text-navy-200/60",
              )}
            >
              {description}
            </span>
          ) : null}
        </p>

        {!heroCard ? (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-navy-100 dark:bg-navy-900">
            <div
              className={`h-full ${styles.barFill} rounded-full opacity-70 transition-all duration-1000 group-hover:opacity-100`}
              style={{ width: "100%" }}
            />
          </div>
        ) : null}

        {footer ? (
          <div
            className={cn(
              "mt-4 border-t pt-3",
              heroCard
                ? "border-white/12"
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
