import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  meta?: React.ReactNode;
  status?: React.ReactNode;
  children?: React.ReactNode;
  actionsClassName?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  meta,
  status,
  children,
  actionsClassName,
}: PageHeaderProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card px-5 py-5 shadow-sm sm:px-6 sm:py-5 dark:border-white/10 dark:bg-navy-950/80">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl space-y-2">
          {eyebrow || meta ? (
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
              {eyebrow ? (
                <span className="text-foreground/90">{eyebrow}</span>
              ) : null}
              {meta ? <span>{meta}</span> : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
              {title}
            </h1>
            {status ? <div className="flex items-center">{status}</div> : null}
          </div>

          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
        </div>

        {children ? (
          <div
            className={cn(
              "flex flex-wrap gap-2 lg:max-w-md lg:justify-end",
              actionsClassName,
            )}
          >
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
