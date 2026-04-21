import { BrandLogo } from "@/components/brand-logo";

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="A carregar"
      className="fixed inset-0 z-[25] overflow-hidden animate-fade-in"
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 hidden w-72 overflow-hidden rounded-r-[2.75rem] bg-navy-950 lg:block"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(216,173,52,0.16),transparent_40%),linear-gradient(180deg,rgba(20,48,76,0.24),transparent)]" />
      </div>

      <div className="absolute inset-0 bg-slate-500/42 backdrop-blur-[1px]" />
      <div className="absolute inset-y-0 left-0 hidden w-72 bg-transparent lg:block" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_65%_50%,rgba(217,166,28,0.14),transparent)]" />

      <div className="relative z-10 flex h-full w-full items-center justify-center lg:pl-72">
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="relative flex items-center justify-center">
            <div className="absolute size-24 rounded-full bg-gold-500/15 blur-3xl animate-pulse" />
            <BrandLogo
          alt="HealthyTech Atlântico"
              className="relative z-10 h-[96px] w-[94px]"
            imageClassName="brightness-0 invert drop-shadow-[0_0_20px_rgba(255,255,255,0.12)]"
            priority
            sizes="96px"
          />
        </div>

        <div className="h-1 w-40 overflow-hidden rounded-full bg-navy-800">
          <div className="skeleton h-full w-1/2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500" />
        </div>
      </div>
      </div>
    </div>
  );
}
