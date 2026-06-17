import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  meta?: React.ReactNode;
  status?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  actionsClassName?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow: _eyebrow,
  meta,
  status,
  icon,
  children,
  actionsClassName,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 max-w-4xl flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
        {icon ? (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:bg-gold-400/10 dark:text-gold-400">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[28px] font-bold tracking-tight text-navy-950 dark:text-white sm:text-[32px]">
              {title}
            </h1>
            {status ? <div className="flex items-center">{status}</div> : null}
          </div>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm text-navy-700 dark:text-navy-200">
              {description}
            </p>
          ) : null}
          {meta ? (
            <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
          ) : null}
        </div>
      </div>

      {children ? (
        <div
          className={cn(
            "flex flex-wrap gap-2 lg:max-w-md lg:shrink-0 lg:justify-end",
            actionsClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
