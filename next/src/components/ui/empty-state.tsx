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
    <section className="animate-fade-in-up relative overflow-hidden rounded-[12px] border border-border bg-surface-secondary px-5 py-8 text-center sm:py-12">
      <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-gold-300/8 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-navy-400/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-4">
        <div className="animate-pulse-ring rounded-full p-2">
          <div className="flex size-12 items-center justify-center rounded-[8px] border border-border bg-surface-utility shadow-sm">
            <Icon
              className="size-5 text-gold-400 dark:text-gold-300"
              strokeWidth={1.8}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
            {title}
          </h3>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
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
