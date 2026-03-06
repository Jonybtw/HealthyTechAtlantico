import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  delay?: number;
  accent?: "gold" | "green" | "red" | "blue";
}

const accents = {
  gold: { bg: "bg-gold-50/50 dark:bg-gold-900/30 ring-1 ring-gold-200 dark:ring-gold-500/30", icon: "text-gold-600 dark:text-gold-400", bar: "bg-gradient-to-r from-gold-300 to-gold-500" },
  green: { bg: "bg-success-50/50 dark:bg-success-900/30 ring-1 ring-success-200 dark:ring-success-500/30", icon: "text-success-600 dark:text-success-400", bar: "bg-gradient-to-r from-success-400 to-success-600" },
  red: { bg: "bg-danger-50/50 dark:bg-danger-900/30 ring-1 ring-danger-200 dark:ring-danger-500/30", icon: "text-danger-600 dark:text-danger-400", bar: "bg-gradient-to-r from-danger-400 to-danger-600" },
  blue: { bg: "bg-navy-50/50 dark:bg-navy-900/40 ring-1 ring-navy-200 dark:ring-navy-500/30", icon: "text-navy-600 dark:text-navy-300", bar: "bg-gradient-to-r from-navy-500 to-navy-700" },
};

export function KpiCard({ title, value, icon: Icon, description, delay = 0, accent = "blue" }: KpiCardProps) {
  const a = accents[accent];
  return (
    <div
      className="animate-fade-in-up relative overflow-hidden rounded-2xl bg-card/70 glass glow-border p-5
                 shadow-card hover:shadow-float hover:-translate-y-1 hover:bg-card/90 transition-all duration-[400ms] cursor-default group"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {/* Subtle top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${a.bar} opacity-90`} />
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-white opacity-40 blur-[1px]" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{title}</p>
          <p className="mt-1.5 text-3xl font-extrabold tracking-tighter text-foreground">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground font-medium">{description}</p>
          )}
        </div>
        <div className={`h-11 w-11 shrink-0 rounded-2xl ${a.bg} flex items-center justify-center
                         group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm`}>
          <Icon size={20} className={a.icon} />
        </div>
      </div>
    </div>
  );
}
