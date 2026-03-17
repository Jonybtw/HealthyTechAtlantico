import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";

export const metadata: Metadata = { title: "Protocolos" };

const BMI_TABLE = [
  { age: "9", male: "<=18.4", female: "<=18.7" },
  { age: "10", male: "<=19.4", female: "<=19.9" },
  { age: "11", male: "<=20.2", female: "<=20.7" },
  { age: "12", male: "<=21.0", female: "<=21.7" },
  { age: "13", male: "<=21.8", female: "<=22.6" },
  { age: "14", male: "<=22.6", female: "<=23.3" },
  { age: "15", male: "<=23.5", female: "<=24.0" },
  { age: "16", male: "<=24.2", female: "<=24.4" },
  { age: "17", male: "<=24.9", female: "<=24.7" },
  { age: "18", male: "<=25.0", female: "<=25.0" },
];

const WAIST_TABLE = [
  { age: "9", male: "<=66.1", female: "<=62.6" },
  { age: "10", male: "<=68.0", female: "<=64.3" },
  { age: "11", male: "<=70.0", female: "<=66.5" },
  { age: "12", male: "<=72.2", female: "<=68.8" },
  { age: "13", male: "<=74.4", female: "<=70.4" },
  { age: "14", male: "<=76.3", female: "<=71.6" },
  { age: "15", male: "<=78.1", female: "<=72.6" },
  { age: "16", male: "<=80.0", female: "<=73.4" },
  { age: "17", male: "<=81.7", female: "<=74.0" },
  { age: "18", male: "<=83.2", female: "<=74.7" },
];

const TEST_ZONE_KEYS = [
  { testKey: "testVaiVem", unitKey: "testVaiVemUnit", descKey: "testVaiVemDesc" },
  { testKey: "testCooper", unitKey: "testCooperUnit", descKey: "testCooperDesc" },
  { testKey: "testMilha", unitKey: "testMilhaUnit", descKey: "testMilhaDesc" },
  { testKey: "testVelocidade", unitKey: "testVelocidadeUnit", descKey: "testVelocidadeDesc" },
  { testKey: "testAgilidade", unitKey: "testAgilidadeUnit", descKey: "testAgilidadeDesc" },
  { testKey: "testAbdominais", unitKey: "testAbdominaisUnit", descKey: "testAbdominaisDesc" },
  { testKey: "testExtensoes", unitKey: "testExtensoesUnit", descKey: "testExtensoesDesc" },
  { testKey: "testSentaAlcanca", unitKey: "testSentaAlcancaUnit", descKey: "testSentaAlcancaDesc" },
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
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <div className="surface-secondary overflow-x-auto rounded-[20px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-50/50 dark:bg-navy-900/30">
              {headers.map((header) => (
                <th key={header} className="px-4 py-2.5 text-left font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-border/50 transition-colors hover:bg-muted/30">
                {row.cells.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 font-medium">
                    {cell}
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
    <PageScaffold headerProps={{ title: t("title"), description: t("description") }} className="max-w-4xl">
      <PageSection tone="secondary" title={t("bmiTableTitle")} layout="list">
        <ReferenceTable
          title={t("bmiTableTitle")}
          headers={[t("age"), t("male"), t("female")]}
          rows={BMI_TABLE.map((row) => ({ cells: [row.age, row.male, row.female] }))}
        />
      </PageSection>

      <PageSection tone="secondary" title={t("waistTableTitle")} layout="list">
        <ReferenceTable
          title={t("waistTableTitle")}
          headers={[t("age"), t("male"), t("female")]}
          rows={WAIST_TABLE.map((row) => ({ cells: [row.age, row.male, row.female] }))}
        />
      </PageSection>

      <PageSection tone="utility" title={t("fitnessTitle")} layout="list">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {TEST_ZONE_KEYS.map((item) => (
            <div key={item.testKey} className="surface-secondary rounded-[20px] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
              <p className="text-sm font-semibold">{t(item.testKey)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t(item.descKey)}</p>
              <p className="mt-2 text-xs font-medium text-navy-600 dark:text-navy-300">
                {t("unitLabel")}: {t(item.unitKey)}
              </p>
            </div>
          ))}
        </div>
      </PageSection>
    </PageScaffold>
  );
}
