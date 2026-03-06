import Image from "next/image";
import { Activity } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background relative overflow-hidden bg-noise">

      {/* 1) Branding Half (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 bg-mesh shadow-[10px_0_30px_-15px_rgba(0,0,0,0.5)] z-10">

        {/* Glow Effects built into bg-mesh globally now, but we add a specific overlay for auth */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/60 to-transparent pointer-events-none" />

        <div className="relative z-20 flex items-center gap-2 text-white">
          <Activity className="size-8 text-gold-500" />
          <span className="text-xl font-bold tracking-tight">HealthyTech</span>
        </div>

        <div className="relative z-20 max-w-sm">
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tighter leading-tight">
            A tua saúde,
            <br /> <span className="text-gold-500">em movimento</span>.
          </h1>
          <p className="text-navy-100 text-sm leading-relaxed">
            Plataforma oficial da FitEscola para monitorização da Zona de Aptidão Física (ZAF) e emissão de relatórios de saúde no Colégio.
          </p>
        </div>

        <div className="relative z-20 text-xs text-navy-200/60 font-medium">
          © {new Date().getFullYear()} AtlânticoFit. Todos os direitos reservados.
        </div>
      </div>

      {/* 2) Form Half */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center p-6 sm:p-12 relative z-20">

        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden flex flex-col items-center mb-8 animate-fade-in-up">
          <Image
            src="/logo.png"
            alt="HealthyTech Atlântico"
            width={180}
            height={50}
            className="object-contain drop-shadow-sm dark:invert"
            priority
          />
        </div>

        {/* The injected child form (login or register) */}
        <div className="w-full max-w-[400px] animate-fade-in-up delay-100">
          {children}
        </div>

      </div>

    </div>
  );
}
