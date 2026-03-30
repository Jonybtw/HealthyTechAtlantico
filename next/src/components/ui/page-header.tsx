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
    <div className="relative overflow-hidden rounded-xl border border-navy-700/15 bg-gradient-to-br from-navy-800 via-navy-700 to-navy-600 px-6 py-6 text-white shadow-[0_28px_80px_-36px_rgba(9,21,35,0.72)] sm:px-8 sm:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(216,173,52,0.18),transparent_20%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%)]" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl space-y-4">
          {eyebrow || meta ? (
            <div className="flex flex-wrap items-center gap-2 text-tiny font-semibold uppercase tracking-[0.24em] text-gold-200">
              {eyebrow ? (
                <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1">
                  {eyebrow}
                </span>
              ) : null}
              {meta ? (
                <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-white/80">
                  {meta}
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold tracking-[-0.05em] text-white sm:text-[2.5rem]">
              {title}
            </h1>
            {status ? <div className="flex items-center">{status}</div> : null}
          </div>
          {description ? (
            <p className="max-w-2xl text-sm font-medium leading-relaxed text-white/74 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {children ? (
          <div className="flex flex-wrap gap-2">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
