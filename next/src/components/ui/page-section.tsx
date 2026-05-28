import { cn } from "@/lib/utils";

interface PageSectionProps {
  eyebrow?: React.ReactNode;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  tone?: "primary" | "secondary" | "utility";
  layout?: "default" | "form" | "list" | "analytics";
}

const toneClasses: Record<NonNullable<PageSectionProps["tone"]>, string> = {
  primary: "rounded-[16px] border border-border bg-card/88 p-5 shadow-[0_4px_12px_rgba(9,21,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-navy-950/68 dark:shadow-[0_4px_18px_rgba(0,0,0,0.22)] sm:p-6",
  secondary: "rounded-[16px] border border-border bg-card/88 p-5 shadow-[0_4px_12px_rgba(9,21,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-navy-950/68 dark:shadow-[0_4px_18px_rgba(0,0,0,0.22)] sm:p-6",
  utility: "rounded-[16px] border border-border bg-card/88 p-4 shadow-[0_4px_12px_rgba(9,21,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-navy-950/68 dark:shadow-[0_4px_18px_rgba(0,0,0,0.22)] sm:p-5",
};

const layoutClasses: Record<NonNullable<PageSectionProps["layout"]>, string> = {
  default: "flex flex-col gap-4",
  form: "flex flex-col gap-6",
  list: "flex flex-col gap-3",
  analytics: "flex flex-col gap-6",
};

export function PageSection({
  eyebrow,
  icon,
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  tone = "secondary",
  layout = "default",
}: PageSectionProps) {
  return (
    <section className={cn("relative overflow-hidden", toneClasses[tone], className)}>
      {tone !== "utility" && (
        <>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(244,211,94,0.06),transparent_44%)] dark:bg-[radial-gradient(circle_at_80%_0%,rgba(244,211,94,0.11),transparent_44%)]" />
        </>
      )}
      <div className="relative">
        {eyebrow || title || description || actions || icon ? (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-start">
              {icon && (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] border border-border/70 bg-background/55 text-gold-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-gold-400">
                  {icon}
                </div>
              )}
              <div className="space-y-1.5 pt-0.5">
                {eyebrow ? <p className="section-kicker">{eyebrow}</p> : null}
                {title ? <h2 className="section-title">{title}</h2> : null}
                {description ? <p className="section-copy">{description}</p> : null}
              </div>
            </div>
            {actions ? (
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {actions}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={cn(layoutClasses[layout], contentClassName)}>
          {children}
        </div>
      </div>
    </section>
  );
}
