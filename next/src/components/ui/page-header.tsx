export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
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
    <div className="flex flex-col gap-4 pb-2 lg:flex-row lg:items-end lg:justify-between mb-12">
      <div className="max-w-4xl space-y-3">
        {eyebrow || meta ? (
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-[0.2em] text-secondary uppercase font-sans">
            {eyebrow ? <span>{eyebrow}</span> : null}
            {eyebrow && meta ? <span className="text-border mx-1">/</span> : null}
            {meta ? <span>{meta}</span> : null}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-5xl font-extrabold text-foreground tracking-tight font-display">
            {title}
          </h1>
          {status ? <div className="flex items-center">{status}</div> : null}
        </div>
        {description ? (
          <p className="max-w-2xl text-lg font-medium text-muted-foreground/80">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}
