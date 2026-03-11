import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden animate-fade-in">
      <div className="bg-mesh opacity-50" />
      <div className="bg-noise opacity-50" />

      <div className="relative z-10 flex flex-col items-center gap-5 animate-fade-in-up">
        <div className="relative flex items-center justify-center">
          <div className="absolute size-24 rounded-full bg-gold-500/20 blur-3xl animate-pulse" />
          <Image
            src="/logo.png"
            alt="HealthyTech Atlântico"
            width={180}
            height={46}
            className="relative z-10 object-contain dark:brightness-0 dark:invert dark:drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            priority
          />
        </div>

        {/* Loading bar */}
        <div className="w-48 h-1.5 rounded-full bg-navy-100 dark:bg-navy-900/50 overflow-hidden shadow-inner border border-border/50">
          <div className="h-full bg-gradient-to-r from-gold-300 to-gold-500 w-1/2 rounded-full skeleton" />
        </div>
      </div>
    </div>
  );
}
