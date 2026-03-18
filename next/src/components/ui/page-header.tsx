export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  meta?: React.ReactNode;
  status?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  meta,
  status,
  children,
}: PageHeaderProps) {
  return (
    <div className="animate-fade-in-up flex flex-col gap-2 pb-1 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-4xl space-y-1">
        {eyebrow || meta ? (
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow ? <span>{eyebrow}</span> : null}
            {eyebrow && meta ? <span className="text-border">/</span> : null}
            {meta ? <span>{meta}</span> : null}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-balance text-base font-semibold leading-tight tracking-[-0.035em] text-foreground sm:text-lg">
            {title}
          </h1>
          {status ? <div className="flex items-center">{status}</div> : null}
        </div>
        {description ? (
          <p className="max-w-2xl text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}
