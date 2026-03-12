interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="animate-fade-in-up flex flex-col gap-3 pb-1 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl space-y-1.5">
        <h1 className="font-display text-balance text-2xl font-semibold leading-tight tracking-[-0.03em] text-gradient-gold sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}
