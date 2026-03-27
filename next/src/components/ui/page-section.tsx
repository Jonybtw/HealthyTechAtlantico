import { cn } from "@/lib/utils";

interface PageSectionProps {
  eyebrow?: React.ReactNode;
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
  primary: "glass page-frame shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-white/5",
  secondary: "glass page-frame",
  utility: "glass rounded-xl p-4",
};

const layoutClasses: Record<NonNullable<PageSectionProps["layout"]>, string> = {
  default: "flex flex-col gap-4",
  form: "flex flex-col gap-6",
  list: "flex flex-col gap-3",
  analytics: "flex flex-col gap-6",
};

export function PageSection({
  eyebrow,
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
    <section className={cn(toneClasses[tone], className)}>
      {eyebrow || title || description || actions ? (
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl space-y-1.5">
            {eyebrow ? <p className="section-kicker">{eyebrow}</p> : null}
            {title ? <h2 className="section-title">{title}</h2> : null}
            {description ? <p className="section-copy">{description}</p> : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={cn(layoutClasses[layout], contentClassName)}>{children}</div>
    </section>
  );
}
