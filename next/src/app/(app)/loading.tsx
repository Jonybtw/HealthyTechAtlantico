import Image from "next/image";

export default function Loading() {
  return (
    <div role="status" aria-label="A carregar" className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-navy-950 overflow-hidden animate-fade-in">
      {/* Radial gold glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(217,166,28,0.14),transparent)]" />

      <div className="relative z-10 flex flex-col items-center gap-5 animate-fade-in-up">
        <div className="relative flex items-center justify-center">
          <div className="absolute size-28 rounded-full bg-gold-500/15 blur-3xl animate-pulse" />
          <Image
            src="/logo.png"
            alt="HealthyTech Atlântico"
            width={180}
            height={46}
            className="relative z-10 object-contain brightness-0 invert drop-shadow-[0_0_20px_rgba(255,255,255,0.12)]"
            priority
          />
        </div>

        {/* Loading bar */}
        <div className="w-48 h-1 rounded-full bg-navy-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gold-400 to-gold-500 w-1/2 rounded-full skeleton" />
        </div>
      </div>
    </div>
  );
}
