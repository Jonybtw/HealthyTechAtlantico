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
    <div className="relative overflow-hidden rounded-2xl border border-white/18 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 px-5 py-5 text-white shadow-float sm:px-7 sm:py-7">
      <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/80 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(216,173,52,0.2),transparent_20%),radial-gradient(circle_at_bottom_left,rgba(157,180,200,0.12),transparent_28%)]" />
      <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-gold-400/12 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-white/6 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl space-y-4">
          {eyebrow || meta ? (
            <div className="flex flex-wrap items-center gap-2 text-tiny font-semibold uppercase tracking-[0.24em] text-gold-200">
              {eyebrow ? (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur-md">
                  {eyebrow}
                </span>
              ) : null}
              {meta ? (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/82 backdrop-blur-md">
                  {meta}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[1.9rem] font-extrabold tracking-[-0.05em] text-white sm:text-[2.5rem]">
              {title}
            </h1>
            {status ? <div className="flex items-center">{status}</div> : null}
          </div>

          {description ? (
            <p className="max-w-2xl text-sm font-medium leading-relaxed text-white/76 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>

        {children ? (
          <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
