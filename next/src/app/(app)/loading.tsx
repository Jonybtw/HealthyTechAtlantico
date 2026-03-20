import { BrandLogo } from "@/components/brand-logo";

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="A carregar"
      className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden bg-navy-950 animate-fade-in"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(217,166,28,0.14),transparent)]" />

      <div className="relative z-10 flex flex-col items-center gap-4 animate-fade-in-up">
        <div className="relative flex items-center justify-center">
          <div className="absolute size-24 rounded-full bg-gold-500/15 blur-3xl animate-pulse" />
          <BrandLogo
            alt="HealthyTech Atlantico"
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
  );
}
