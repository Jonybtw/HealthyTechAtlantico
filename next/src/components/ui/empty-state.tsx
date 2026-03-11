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
    <section className="animate-fade-in-up relative overflow-hidden rounded-2xl border border-border/70 bg-card/85 p-6 text-center shadow-card sm:p-8">
      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
      <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-gold-300/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-36 w-36 rounded-full bg-navy-300/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-5">
        <div className="flex size-14 items-center justify-center rounded-xl border border-border/70 bg-background/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
          <Icon className="size-6 text-navy-700 dark:text-gold-300" strokeWidth={1.8} />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
            HealthyTech Atlântico
          </p>
          <h3 className="font-display text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">
            {title}
          </h3>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>

        {action ? <div className="flex flex-wrap justify-center gap-3">{action}</div> : null}
      </div>
    </section>
  );
}
