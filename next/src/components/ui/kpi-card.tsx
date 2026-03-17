import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function useAnimatedNumber(target: number, duration = 600) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

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
    chip: "bg-gold-100/80 text-gold-700 ring-gold-500/20 dark:bg-gold-400/10 dark:text-gold-300",
    bar: "from-gold-300 via-gold-400 to-gold-600",
  },
  green: {
    chip: "bg-success-100/80 text-success-700 ring-success-500/20 dark:bg-success-500/10 dark:text-success-300",
    bar: "from-emerald-300 via-emerald-500 to-emerald-700",
  },
  red: {
    chip: "bg-danger-100/80 text-danger-700 ring-danger-500/20 dark:bg-danger-500/10 dark:text-danger-300",
    bar: "from-rose-300 via-rose-500 to-rose-700",
  },
  blue: {
    chip: "bg-navy-100/80 text-navy-700 ring-navy-500/20 dark:bg-navy-400/10 dark:text-navy-200",
    bar: "from-sky-300 via-sky-500 to-navy-700",
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
  const animatedValue = useAnimatedNumber(isNumeric ? value : 0);

  return (
    <div
      className={`group relative overflow-hidden rounded-[20px] transition-all duration-300 hover:-translate-y-0.5 ${
        emphasis === "hero"
          ? "surface-primary p-4 sm:p-5"
          : "surface-secondary p-3 sm:p-4"
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${styles.bar}`} />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {title}
          </p>
          <p
            className={`font-semibold tracking-tight text-foreground tabular-nums ${
              emphasis === "hero" ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
            }`}
          >
            {isNumeric ? animatedValue : value}
          </p>
          {description ? (
            <p
              className={`max-w-xs text-muted-foreground ${
                emphasis === "hero" ? "text-[13px] leading-relaxed sm:text-sm" : "text-[13px]"
              }`}
            >
              {description}
            </p>
          ) : null}
        </div>
        <div
          className={`flex items-center justify-center ring-1 ${styles.chip} ${
            emphasis === "hero" ? "size-10 rounded-lg" : "size-8 rounded-lg"
          }`}
        >
          <Icon className={emphasis === "hero" ? "size-4" : "size-4"} />
        </div>
      </div>
      {footer ? <div className="mt-4 border-t border-border/50 pt-3">{footer}</div> : null}
    </div>
  );
}
