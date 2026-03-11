import Image from "next/image";
import { Activity, ShieldCheck, Sparkles } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: "Segurança institucional",
    description: "Autenticação robusta, auditoria e acesso controlado por perfil.",
  },
  {
    icon: Activity,
    title: "Acompanhamento contínuo",
    description: "Biometria, testes e SOS reunidos numa plataforma única.",
  },
  {
    icon: Sparkles,
    title: "Experiência premium",
    description: "Fluxos claros, responsivos e prontos para operação diária.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      <div className="bg-mesh" />
      <div className="bg-noise" />

      <section className="relative hidden w-[52%] border-r border-border/60 bg-[linear-gradient(180deg,rgba(8,22,43,0.98),rgba(8,22,43,0.92))] px-8 py-8 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,166,28,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.12),transparent_30%)]" />

        <div className="relative flex items-center justify-between">
          <Image
            src="/logo.png"
            alt="HealthyTech Atlantico"
            width={160}
            height={42}
            className="object-contain brightness-0 invert"
            priority
          />
          <span className="rounded-full border border-gold-400/20 bg-gold-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-200">
            Production Ready
          </span>
        </div>

        <div className="relative my-auto max-w-xl space-y-5">
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-navy-200/70">
              HealthyTech Atlântico
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[0.95] tracking-tight text-white">
              Saúde escolar com critério, clareza e resposta imediata.
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-navy-100/80">
              Plataforma institucional para monitorização física, relatórios,
              questionários e sinais de alerta com acompanhamento seguro.
            </p>
          </div>

          <div className="grid gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-white/6 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-gold-400/12 text-gold-200 ring-1 ring-gold-400/20">
                    <Icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                    <p className="text-sm leading-relaxed text-navy-100/75">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-navy-200/55">
          {`Copyright ${new Date().getFullYear()} HealthyTech Atlântico. All rights reserved.`}
        </p>
      </section>

      <section className="relative flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-[48%] lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,166,28,0.12),transparent_26%),radial-gradient(circle_at_bottom,rgba(8,22,43,0.08),transparent_32%)]" />

        <div className="relative w-full max-w-md">
          <div className="mb-6 flex justify-center lg:hidden">
            <Image
              src="/logo.png"
              alt="HealthyTech Atlantico"
              width={160}
              height={42}
              className="object-contain drop-shadow-sm"
              priority
            />
          </div>

          {children}
        </div>
      </section>
    </div>
  );
}
