import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden animate-fade-in">
      {/* Dynamic Backgrounds matching the global mesh */}
      <div className="bg-mesh opacity-50" />
      <div className="bg-noise opacity-50" />

      {/* Main Logo Container */}
      <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
        <div className="relative mb-8">
          {/* Intense Backglow */}
          <div className="absolute inset-0 bg-gold-500/20 blur-[60px] rounded-full animate-pulse-ring" />

          <Image
            src="/logo.png"
            alt="HealthyTech Atlântico"
            width={220}
            height={56}
            className="relative z-10 object-contain brightness-0 dark:invert opacity-95 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            priority
          />
        </div>

        {/* Sophisticated Loading Bar */}
        <div className="w-48 h-1.5 rounded-full bg-navy-100 dark:bg-navy-900/50 overflow-hidden shadow-inner border border-border/50">
          <div className="h-full bg-gradient-to-r from-gold-300 to-gold-500 w-1/2 rounded-full skeleton" />
        </div>
      </div>
    </div>
  );
}
