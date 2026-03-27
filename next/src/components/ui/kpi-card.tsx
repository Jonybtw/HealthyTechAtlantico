import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function useAnimatedNumber(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const raf = useRef<number | undefined>(undefined);
  const previousTarget = useRef(target);

  useEffect(() => {
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
    iconBg: "bg-navy-900 text-white shadow-lg shadow-navy-900/30 dark:bg-navy-800",
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
  const animatedValue = useAnimatedNumber(isNumeric ? value : 0);

  return (
    <div
      className={`bg-white dark:bg-navy-950/80 p-6 sm:p-8 rounded-[24px] shadow-[0_10px_40px_-15px_rgba(0,35,111,0.08)] dark:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)] border border-border/50 group hover:-translate-y-2 transition-all duration-300`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${styles.iconBg} transition-transform group-hover:scale-110 duration-300`}>
          <Icon className="size-6" />
        </div>
      </div>
      <h3 className="text-muted-foreground text-sm font-semibold mb-1 tracking-wide">{title}</h3>
      <p className="text-3xl font-extrabold text-foreground mb-4 tabular-nums tracking-tight">
        {isNumeric ? animatedValue : value}
        {description ? <span className="text-sm font-medium text-muted-foreground ml-2 block sm:inline mt-1 sm:mt-0">{description}</span> : null}
      </p>
      {emphasis === "default" && (
        <div className="h-1.5 w-full bg-muted/60 dark:bg-navy-900 rounded-full overflow-hidden mt-2">
           <div className={`h-full ${styles.barFill} rounded-full opacity-60 transition-all duration-1000 group-hover:opacity-100`} style={{ width: "100%" }}></div>
        </div>
      )}
      {footer ? <div className="mt-4 border-t border-border/50 pt-3">{footer}</div> : null}
    </div>
  );
}
