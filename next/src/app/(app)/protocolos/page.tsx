import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";

/* ── Static ZAF reference tables (server component) ── */

const BMI_TABLE = [
  { age: "9", male: "≤18.4", female: "≤18.7" },
  { age: "10", male: "≤19.4", female: "≤19.9" },
  { age: "11", male: "≤20.2", female: "≤20.7" },
  { age: "12", male: "≤21.0", female: "≤21.7" },
  { age: "13", male: "≤21.8", female: "≤22.6" },
  { age: "14", male: "≤22.6", female: "≤23.3" },
  { age: "15", male: "≤23.5", female: "≤24.0" },
  { age: "16", male: "≤24.2", female: "≤24.4" },
  { age: "17", male: "≤24.9", female: "≤24.7" },
  { age: "18", male: "≤25.0", female: "≤25.0" },
];

const WAIST_TABLE = [
  { age: "9", male: "≤66.1", female: "≤62.6" },
  { age: "10", male: "≤68.0", female: "≤64.3" },
  { age: "11", male: "≤70.0", female: "≤66.5" },
  { age: "12", male: "≤72.2", female: "≤68.8" },
  { age: "13", male: "≤74.4", female: "≤70.4" },
  { age: "14", male: "≤76.3", female: "≤71.6" },
  { age: "15", male: "≤78.1", female: "≤72.6" },
  { age: "16", male: "≤80.0", female: "≤73.4" },
  { age: "17", male: "≤81.7", female: "≤74.0" },
  { age: "18", male: "≤83.2", female: "≤74.7" },
];

const TEST_ZONES = [
  { test: "Vai e Vem", unit: "percursos", description: "Corrida de vai e vem 20m (PACER)" },
  { test: "Cooper", unit: "metros", description: "Corrida de 12 minutos" },
  { test: "Milha", unit: "mm:ss", description: "Corrida de 1 milha" },
  { test: "Velocidade", unit: "segundos", description: "Sprint 40 jardas" },
  { test: "Agilidade", unit: "segundos", description: "Corrida de agilidade 4×10m" },
  { test: "Abdominais", unit: "repetições", description: "Abdominais em 60 segundos" },
  { test: "Extensões de braços", unit: "repetições", description: "Extensões sem cadência" },
  { test: "Senta e Alcança", unit: "cm", description: "Flexibilidade do tronco" },
];

function ReferenceTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: { cells: string[] }[];
}) {
  return (
    <div className="flex flex-col gap-3 animate-fade-in-up">
      <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/85 glass shadow-float">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-50/50 dark:bg-navy-900/30">
              {headers.map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                {r.cells.map((c, j) => (
                  <td key={j} className="px-4 py-3 font-medium">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function ProtocolosPage() {
  const t = await getTranslations("protocolos");
  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      {/* BMI table */}
      <ReferenceTable
        title="IMC — Valores de corte (Zona Saudável)"
        headers={["Idade", "Masculino (≤)", "Feminino (≤)"]}
        rows={BMI_TABLE.map((r) => ({
          cells: [r.age, r.male, r.female],
        }))}
      />

      {/* Waist table */}
      <ReferenceTable
        title="Perímetro da Cintura — Valores de corte (Zona Saudável)"
        headers={["Idade", "Masculino (≤)", "Feminino (≤)"]}
        rows={WAIST_TABLE.map((r) => ({
          cells: [r.age, r.male, r.female],
        }))}
      />

      {/* Fitness tests overview */}
      <div className="flex flex-col gap-4 mb-10 animate-fade-in-up delay-100">
        <h3 className="text-lg font-bold tracking-tight">Testes de Aptidão Física</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEST_ZONES.map((t) => (
            <div
              key={t.test}
              className="bg-card/85 glass rounded-2xl border border-border/50 shadow-sm p-5 flex flex-col gap-1.5 transition-all duration-300 hover:shadow-float hover:-translate-y-1"
            >
              <span className="font-semibold">{t.test}</span>
              <span className="text-xs text-muted-foreground">{t.description}</span>
              <span className="text-xs text-navy-600 font-medium mt-1">
                Unidade: {t.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
