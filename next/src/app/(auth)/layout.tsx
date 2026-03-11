import Image from "next/image";
import { Activity, ShieldCheck, Sparkles } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: "Segurança institucional",
    description: "Autenticação robusta e acesso controlado por perfil.",
  },
  {
    icon: Activity,
    title: "Acompanhamento contínuo",
    description: "Biometria, testes e SOS numa plataforma única.",
  },
  {
    icon: Sparkles,
    title: "Experiência premium",
    description: "Fluxos claros e responsivos para operação diária.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[linear-gradient(160deg,#091523_0%,#14304c_60%,#203f56_100%)]">
      {/* Gold glow — decorative */}
      <div
        aria-hidden="true"
        role="presentation"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(217,166,28,0.18),transparent)]"
      />

      <div className="relative mx-auto flex w-full max-w-sm flex-col items-center gap-7 px-4 py-12">
        {/* Logo */}
        <Image
          src="/logo.png"
          alt="HealthyTech Atlantico"
          width={152}
          height={40}
          className="object-contain brightness-0 invert"
          priority
        />

        {/* Headline */}
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-white">
            Saúde escolar com critério e resposta imediata.
          </h1>
          <p className="text-sm leading-relaxed text-navy-100/65">
            Plataforma institucional para monitorização física, questionários e alertas com acompanhamento seguro.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {HIGHLIGHTS.map(({ icon: Icon, title }) => (
            <span
              key={title}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-medium text-white/80"
            >
              <Icon className="size-3.5 text-gold-300" />
              {title}
            </span>
          ))}
        </div>

        {/* Form card */}
        <div className="w-full">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-navy-200/45">
          {`© ${new Date().getFullYear()} HealthyTech Atlântico. Todos os direitos reservados.`}
        </p>
      </div>
    </main>
  );
}
