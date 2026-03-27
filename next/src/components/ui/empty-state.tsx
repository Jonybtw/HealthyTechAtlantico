import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <section className="animate-fade-in-up relative overflow-hidden rounded-[20px] bg-white/50 dark:bg-navy-950/40 border border-white/20 dark:border-white/10 p-4 text-center sm:p-5 backdrop-blur-md">
      <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-gold-300/8 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-navy-400/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-4">
        <div className="animate-pulse-ring rounded-full p-2">
          <div className="flex bg-white/80 dark:bg-navy-900/60 border border-white/20 dark:border-white/10 size-10 items-center justify-center rounded-lg shadow-card">
            <Icon
              className="size-4 text-gold-400 dark:text-gold-300 animate-pulse"
              strokeWidth={1.8}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="font-display text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
            {title}
          </h3>
          <p className="mx-auto max-w-md text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
            {description}
          </p>
        </div>

        {action ? (
          <div className="flex flex-wrap justify-center gap-3">{action}</div>
        ) : null}
      </div>
    </section>
  );
}
