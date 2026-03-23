import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { LucideIcon } from "lucide-react";
import { Activity, Dumbbell, Gauge, HeartPulse, Ruler, Timer, Wind, Zap } from "lucide-react";
import { requireAnyRole } from "@/lib/auth-guard";
import { cn } from "@/lib/utils";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { ReferenceTable } from "@/components/ui/reference-table";
import { BMI_TABLE, TEST_ZONE_KEYS, WAIST_TABLE } from "@/lib/protocols";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("protocolos");

  return {
    title: t("title"),
    description: t("description"),
  };
}

const TEST_ICONS: Record<string, LucideIcon> = {
  testVaiVem: Wind,
  testCooper: HeartPulse,
  testMilha: Timer,
  testVelocidade: Zap,
  testAgilidade: Activity,
  testAbdominais: Dumbbell,
  testExtensoes: Dumbbell,
  testSentaAlcanca: Ruler,
};

const TABLE_SECTIONS = [
  {
    id: "bmi",
    titleKey: "bmiTableTitle",
    tableTitleKey: "bmiTable",
    captionKey: "bmiTableCaption",
    data: BMI_TABLE,
  },
  {
    id: "waist",
    titleKey: "waistTableTitle",
    tableTitleKey: "waistTable",
    captionKey: "waistTableCaption",
    data: WAIST_TABLE,
  },
] as const;

export default async function ProtocolosPage() {
  await requireAnyRole(["ADMIN", "PROFESSOR", "ALUNO", "PAIS"]);
  const t = await getTranslations("protocolos");

  return (
    <PageScaffold headerProps={{ title: t("title"), description: t("description"), eyebrow: t("eyebrow") }}>
      <PageSection
        tone="secondary"
        layout="list"
        className="animate-fade-in-up rounded-[22px] border border-border/60 p-2.5 sm:p-3"
      >
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {TABLE_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="surface-secondary group relative overflow-hidden rounded-2xl border border-border/60 px-3.5 py-3 text-xs font-semibold tracking-tight text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card"
            >
              {t(section.titleKey)}
            </a>
          ))}
          <a
            href="#fitness"
            className="surface-secondary group relative overflow-hidden rounded-2xl border border-border/60 px-3.5 py-3 text-xs font-semibold tracking-tight text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card"
          >
            {t("fitnessTitle")}
          </a>
        </div>
      </PageSection>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          {TABLE_SECTIONS.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-24">
              <PageSection
                tone="secondary"
                layout="list"
                className="animate-fade-in-up"
                title={t(section.titleKey)}
                description={t(section.tableTitleKey)}
              >
                <ReferenceTable
                  caption={t(section.captionKey)}
                  headers={[t("age"), t("male"), t("female")]}
                  rows={section.data.map((row) => ({ cells: [row.age, row.male, row.female] }))}
                />
              </PageSection>
            </div>
          ))}
        </div>

        <div id="fitness" className="scroll-mt-24">
        <PageSection
          tone="secondary"
          layout="list"
          className="animate-fade-in-up rounded-[20px] border border-border/60 bg-card/70 lg:sticky lg:top-20"
          title={t("fitnessTitle")}
          description={t("testTable")}
        >
          <div className="grid grid-cols-1 gap-3">
            {TEST_ZONE_KEYS.map((item, index) => {
              const Icon = TEST_ICONS[item.testKey] ?? Gauge;

              return (
                <article
                  key={item.testKey}
                  className={cn(
                    "surface-secondary rounded-[16px] border border-border/60 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card",
                    "animate-fade-in-up"
                  )}
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-100/70 text-navy-700 dark:bg-navy-800/60 dark:text-navy-200">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold tracking-tight text-foreground">{t(item.testKey)}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t(item.descKey)}</p>
                      <p className="mt-2 inline-flex rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground/75">
                        {t("unitLabel")}: {t(item.unitKey)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </PageSection>
        </div>
      </div>
    </PageScaffold>
  );
}
