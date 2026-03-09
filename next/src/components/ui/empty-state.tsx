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
    <div className="w-full max-w-2xl mx-auto rounded-3xl border border-border/60 bg-card/80 px-6 py-10 text-center shadow-card animate-fade-in-up">
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 shadow-sm">
        <Icon className="size-8 text-navy-700 dark:text-navy-200" strokeWidth={1.75} />
      </div>
      <h3 className="text-xl font-semibold text-foreground tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
