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
  eyebrow,
  meta,
  status,
  icon,
  children,
  actionsClassName,
}: PageHeaderProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-[26px] border border-white/20 bg-white/60 px-5 py-5 shadow-[0_24px_64px_rgba(5,14,24,0.1)] backdrop-blur-md sm:px-6 sm:py-5 dark:border-white/10 dark:bg-navy-950/68 dark:shadow-[0_24px_64px_rgba(5,14,24,0.36]")}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/65 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_-20%,rgba(244,211,94,0.1),transparent_48%),radial-gradient(circle_at_5%_100%,rgba(20,48,76,0.05),transparent_36%)] dark:bg-[radial-gradient(circle_at_75%_-20%,rgba(244,211,94,0.18),transparent_48%),radial-gradient(circle_at_5%_100%,rgba(20,48,76,0.28),transparent_36%)]" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-start">
          {icon ? (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-[18px] border border-white/20 bg-white/40 text-gold-600 shadow-sm dark:border-white/10 dark:bg-black/20 dark:text-gold-400">
              {icon}
            </div>
          ) : null}
          <div className="space-y-2">
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
