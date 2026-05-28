import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Dumbbell,
  Gauge,
  HeartPulse,
  Ruler,
  Timer,
  Wind,
  Scale,
  Scissors,
  ChevronRight,
  Zap,
} from "lucide-react";
import { requireAnyRole } from "@/lib/auth-guard";
import { cn } from "@/lib/utils";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { BMI_TABLE, TEST_ZONE_KEYS, WAIST_TABLE } from "@/lib/protocols";
import { ProtocolosNav } from "./protocolos-nav";

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

// Category grouping for test cards
const TEST_CATEGORIES: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    darkBg: string;
    darkBorder: string;
    darkText: string;
  }
> = {
  testVaiVem: {
    label: "Aeróbia",
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200/60",
    darkBg: "dark:bg-sky-900/20",
    darkBorder: "dark:border-sky-700/30",
    darkText: "dark:text-sky-300",
  },
  testCooper: {
    label: "Aeróbia",
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200/60",
    darkBg: "dark:bg-sky-900/20",
    darkBorder: "dark:border-sky-700/30",
    darkText: "dark:text-sky-300",
  },
  testMilha: {
    label: "Aeróbia",
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200/60",
    darkBg: "dark:bg-sky-900/20",
    darkBorder: "dark:border-sky-700/30",
    darkText: "dark:text-sky-300",
  },
  testVelocidade: {
    label: "Velocidade",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200/60",
    darkBg: "dark:bg-amber-900/20",
    darkBorder: "dark:border-amber-700/30",
    darkText: "dark:text-amber-300",
  },
  testAgilidade: {
    label: "Agilidade",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200/60",
    darkBg: "dark:bg-amber-900/20",
    darkBorder: "dark:border-amber-700/30",
    darkText: "dark:text-amber-300",
  },
  testAbdominais: {
    label: "Força",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200/60",
    darkBg: "dark:bg-emerald-900/20",
    darkBorder: "dark:border-emerald-700/30",
    darkText: "dark:text-emerald-300",
  },
  testExtensoes: {
    label: "Força",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200/60",
    darkBg: "dark:bg-emerald-900/20",
    darkBorder: "dark:border-emerald-700/30",
    darkText: "dark:text-emerald-300",
  },
  testSentaAlcanca: {
    label: "Flexibilidade",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200/60",
    darkBg: "dark:bg-violet-900/20",
    darkBorder: "dark:border-violet-700/30",
    darkText: "dark:text-violet-300",
  },
};

const ICON_BG_CLASSES: Record<string, string> = {
  testVaiVem:
    "from-sky-100 to-sky-50 text-sky-600 group-hover:from-sky-200 group-hover:to-sky-100 dark:from-sky-900/40 dark:to-sky-900/20 dark:text-sky-300",
  testCooper:
    "from-sky-100 to-sky-50 text-sky-600 group-hover:from-sky-200 group-hover:to-sky-100 dark:from-sky-900/40 dark:to-sky-900/20 dark:text-sky-300",
  testMilha:
    "from-sky-100 to-sky-50 text-sky-600 group-hover:from-sky-200 group-hover:to-sky-100 dark:from-sky-900/40 dark:to-sky-900/20 dark:text-sky-300",
  testVelocidade:
    "from-amber-100 to-amber-50 text-amber-600 group-hover:from-amber-200 group-hover:to-amber-100 dark:from-amber-900/40 dark:to-amber-900/20 dark:text-amber-300",
  testAgilidade:
    "from-amber-100 to-amber-50 text-amber-600 group-hover:from-amber-200 group-hover:to-amber-100 dark:from-amber-900/40 dark:to-amber-900/20 dark:text-amber-300",
  testAbdominais:
    "from-emerald-100 to-emerald-50 text-emerald-600 group-hover:from-emerald-200 group-hover:to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-900/20 dark:text-emerald-300",
  testExtensoes:
    "from-emerald-100 to-emerald-50 text-emerald-600 group-hover:from-emerald-200 group-hover:to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-900/20 dark:text-emerald-300",
  testSentaAlcanca:
    "from-violet-100 to-violet-50 text-violet-600 group-hover:from-violet-200 group-hover:to-violet-100 dark:from-violet-900/40 dark:to-violet-900/20 dark:text-violet-300",
};

export default async function ProtocolosPage() {
  await requireAnyRole(["ADMIN", "PROFESSOR", "ALUNO", "PAIS"]);
  const t = await getTranslations("protocolos");

  return (
    <PageScaffold
      className="gap-6"
      headerProps={{
        title: t("title"),
        description: t("description"),
        eyebrow: "REFERÊNCIA / PROTOCOLOS ZAF",
        meta: "IMC & Cintura  ·  8 Testes  ·  9–18 Anos",
      }}
    >
      {/* ── Sticky Quick Navigation ────────────────────────────────────────── */}
      <ProtocolosNav />

      <div className="flex flex-col gap-6">
        {/* ── Reference Tables ─────────────────────────────────────────────── */}
        <section id="body-eval" className="scroll-mt-32 animate-fade-in-up overflow-hidden rounded-[16px] border border-border bg-card/88 p-5 shadow-[0_4px_12px_rgba(9,21,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-navy-950/68 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-navy-100 dark:bg-navy-900/40">
              <Scale className="h-4 w-4 text-navy-600 dark:text-navy-300" />
            </div>
            <div>
              <p className="text-micro font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Avaliação Corporal
              </p>
              <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
                Valores de Referência ZAF
              </h2>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* ── BMI Table ─────────────────────────────────────────────── */}
            <div id="bmi" className="scroll-mt-40 animate-fade-in-up">
              <div className="group relative overflow-hidden rounded-[16px] border border-navy-200/60 bg-gradient-to-br from-navy-50/80 via-white/60 to-navy-50/40 shadow-[0_8px_32px_-16px_rgb(9_21_35_/_0.15)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_8px_24px_rgba(9,21,35,0.12)] dark:border-navy-800/40 dark:from-navy-950/60 dark:via-navy-950/40 dark:to-navy-900/30">
                {/* Top accent stripe */}
                <div className="h-1 w-full bg-gradient-to-r from-navy-600 via-navy-500 to-navy-400" />

                {/* Card header */}
                <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-100 shadow-sm dark:bg-navy-800/60">
                      <Scale className="h-5 w-5 text-navy-600 dark:text-navy-300" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-navy-900 dark:text-navy-100">
                        {t("bmiTableTitle")}
                      </h3>
                      <p className="mt-0.5 text-tiny text-muted-foreground">
                        {t("bmiTableCaption")}
                      </p>
                    </div>
                  </div>
                  <span className="mt-1 inline-flex items-center rounded-full bg-navy-100/80 px-2.5 py-0.5 text-micro font-semibold uppercase tracking-wide text-navy-600 dark:bg-navy-800/60 dark:text-navy-300">
                    IMC
                  </span>
                </div>

                <div className="overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-navy-100/70 dark:bg-navy-900/50">
                        <th
                          scope="col"
                          className="w-[22%] border-b border-navy-200/60 px-5 py-3 text-left text-micro font-bold uppercase tracking-[0.12em] text-navy-600 dark:border-navy-800/50 dark:text-navy-300"
                        >
                          {t("age")}
                        </th>
                        <th
                          scope="col"
                          className="w-[39%] border-b border-navy-200/60 px-5 py-3 text-left text-micro font-bold uppercase tracking-[0.12em] text-navy-600 dark:border-navy-800/50 dark:text-navy-300"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-navy-600 text-micro font-bold text-white dark:bg-navy-400">
                              ♂
                            </span>
                            {t("male")}
                          </span>
                        </th>
                        <th
                          scope="col"
                          className="w-[39%] border-b border-navy-200/60 px-5 py-3 text-left text-micro font-bold uppercase tracking-[0.12em] text-navy-600 dark:border-navy-800/50 dark:text-navy-300"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gold-500 text-micro font-bold text-white dark:bg-gold-400">
                              ♀
                            </span>
                            {t("female")}
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {BMI_TABLE.map((row, idx) => (
                        <tr
                          key={row.age}
                          className={cn(
                            "group/row border-t border-navy-100/60 transition-colors hover:bg-navy-50/80 dark:border-navy-800/30 dark:hover:bg-navy-900/40",
                            idx % 2 === 0
                              ? "bg-transparent"
                              : "bg-navy-50/30 dark:bg-navy-950/30",
                          )}
                        >
                          <th scope="row" className="px-5 py-3.5 text-left">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-navy-100 text-xs font-bold text-navy-700 dark:bg-navy-800/60 dark:text-navy-200">
                              {row.age}
                            </span>
                          </th>
                          <td className="px-5 py-3.5 font-mono text-sm font-semibold tabular-nums text-navy-800 dark:text-navy-100">
                            {row.male}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-sm font-semibold tabular-nums text-navy-800 dark:text-navy-100">
                            {row.female}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── Waist Table ───────────────────────────────────────────── */}
            <div
              id="waist"
              className="scroll-mt-40 animate-fade-in-up delay-100"
            >
              <div className="group relative overflow-hidden rounded-[16px] border border-gold-200/60 bg-gradient-to-br from-gold-50/80 via-white/60 to-gold-50/40 shadow-[0_8px_32px_-16px_rgb(9_21_35_/_0.12)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_8px_24px_rgba(9,21,35,0.12)] dark:border-gold-800/30 dark:from-gold-950/40 dark:via-navy-950/40 dark:to-gold-950/20">
                {/* Top accent stripe */}
                <div className="h-1 w-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300" />

                {/* Card header */}
                <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-100 shadow-sm dark:bg-gold-900/40">
                      <Scissors className="h-5 w-5 text-gold-600 dark:text-gold-300" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-gold-900 dark:text-gold-100">
                        {t("waistTableTitle")}
                      </h3>
                      <p className="mt-0.5 text-tiny text-muted-foreground">
                        {t("waistTableCaption")}
                      </p>
                    </div>
                  </div>
                  <span className="mt-1 inline-flex items-center rounded-full bg-gold-100/80 px-2.5 py-0.5 text-micro font-semibold uppercase tracking-wide text-gold-700 dark:bg-gold-900/40 dark:text-gold-300">
                    cm
                  </span>
                </div>

                <div className="overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gold-100/60 dark:bg-gold-900/30">
                        <th
                          scope="col"
                          className="w-[22%] border-b border-gold-200/60 px-5 py-3 text-left text-micro font-bold uppercase tracking-[0.12em] text-gold-700 dark:border-gold-800/40 dark:text-gold-300"
                        >
                          {t("age")}
                        </th>
                        <th
                          scope="col"
                          className="w-[39%] border-b border-gold-200/60 px-5 py-3 text-left text-micro font-bold uppercase tracking-[0.12em] text-gold-700 dark:border-gold-800/40 dark:text-gold-300"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-navy-600 text-micro font-bold text-white dark:bg-navy-400">
                              ♂
                            </span>
                            {t("male")}
                          </span>
                        </th>
                        <th
                          scope="col"
                          className="w-[39%] border-b border-gold-200/60 px-5 py-3 text-left text-micro font-bold uppercase tracking-[0.12em] text-gold-700 dark:border-gold-800/40 dark:text-gold-300"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gold-500 text-micro font-bold text-white dark:bg-gold-400">
                              ♀
                            </span>
                            {t("female")}
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {WAIST_TABLE.map((row, idx) => (
                        <tr
                          key={row.age}
                          className={cn(
                            "group/row border-t border-gold-100/60 transition-colors hover:bg-gold-50/80 dark:border-gold-900/20 dark:hover:bg-gold-900/20",
                            idx % 2 === 0
                              ? "bg-transparent"
                              : "bg-gold-50/30 dark:bg-gold-950/20",
                          )}
                        >
                          <th scope="row" className="px-5 py-3.5 text-left">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gold-100 text-xs font-bold text-gold-700 dark:bg-gold-900/40 dark:text-gold-200">
                              {row.age}
                            </span>
                          </th>
                          <td className="px-5 py-3.5 font-mono text-sm font-semibold tabular-nums text-gold-900 dark:text-gold-100">
                            {row.male}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-sm font-semibold tabular-nums text-gold-900 dark:text-gold-100">
                            {row.female}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Fitness Tests ─────────────────────────────────────────────────── */}
        <section id="fitness" className="scroll-mt-32 animate-fade-in-up overflow-hidden rounded-[16px] border border-border bg-card/88 p-5 shadow-[0_4px_12px_rgba(9,21,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-navy-950/68 sm:p-6" style={{ animationDelay: "70ms" }}>
          {/* Section header */}
          <div className="mb-6 flex flex-col items-start gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-navy-100 dark:bg-navy-900/40">
                <Activity className="h-4 w-4 text-navy-600 dark:text-navy-300" />
              </div>
              <div>
                <p className="text-micro font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Aptidão Física
                </p>
                <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
                  {t("fitnessTitle")}
                </h2>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{t("testTable")}</p>
          </div>

          {/* Category legend */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {[
              {
                label: "Aeróbia",
                color:
                  "bg-sky-100 text-sky-700 border-sky-200/60 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700/30",
              },
              {
                label: "Velocidade",
                color:
                  "bg-amber-100 text-amber-700 border-amber-200/60 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/30",
              },
              {
                label: "Agilidade",
                color:
                  "bg-amber-100 text-amber-700 border-amber-200/60 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/30",
              },
              {
                label: "Força",
                color:
                  "bg-emerald-100 text-emerald-700 border-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/30",
              },
              {
                label: "Flexibilidade",
                color:
                  "bg-violet-100 text-violet-700 border-violet-200/60 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700/30",
              },
            ].map(({ label, color }) => (
              <span
                key={label}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-tiny font-semibold",
                  color,
                )}
              >
                <span className="size-1.5 rounded-full bg-current opacity-70" />
                {label}
              </span>
            ))}
          </div>

          {/* Test cards grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {TEST_ZONE_KEYS.map((item, index) => {
              const Icon = TEST_ICONS[item.testKey] ?? Gauge;
              const category = TEST_CATEGORIES[item.testKey];
              const iconBg =
                ICON_BG_CLASSES[item.testKey] ??
                "from-muted to-muted/50 text-muted-foreground";

              return (
                <article
                  key={item.testKey}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-[16px] border bg-surface-secondary shadow-card transition-all duration-300",
                    "hover:-translate-y-1.5 hover:shadow-[0_8px_24px_rgba(9,21,35,0.12)]",
                    "animate-fade-in-up",
                    "border-white/20 dark:border-white/10",
                  )}
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  {/* Top accent line per category */}
                  <div
                    className={cn(
                      "h-0.5 w-full",
                      item.testKey === "testVaiVem" ||
                        item.testKey === "testCooper" ||
                        item.testKey === "testMilha"
                        ? "bg-gradient-to-r from-sky-400 to-sky-300"
                        : item.testKey === "testVelocidade" ||
                            item.testKey === "testAgilidade"
                          ? "bg-gradient-to-r from-amber-400 to-amber-300"
                          : item.testKey === "testAbdominais" ||
                              item.testKey === "testExtensoes"
                            ? "bg-gradient-to-r from-emerald-400 to-emerald-300"
                            : "bg-gradient-to-r from-violet-400 to-violet-300",
                    )}
                  />

                  <div className="flex flex-1 flex-col p-5">
                    {/* Icon + category badge */}
                    <div className="mb-4 flex items-start justify-between">
                      <div
                        className={cn(
                          "inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-gradient-to-br shadow-sm transition-all duration-300",
                          iconBg,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {category && (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-micro font-semibold",
                            category.bg,
                            category.color,
                            category.border,
                            category.darkBg,
                            category.darkBorder,
                            category.darkText,
                          )}
                        >
                          {category.label}
                        </span>
                      )}
                    </div>

                    {/* Test name + description */}
                    <h3 className="mb-1.5 text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-navy-950 dark:group-hover:text-navy-100">
                      {t(item.testKey)}
                    </h3>
                    <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                      {t(item.descKey)}
                    </p>

                    {/* Footer: unit */}
                    <div className="mt-4 flex items-center justify-between border-t border-white/20 dark:border-white/10 pt-3.5">
                      <span className="text-tiny font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        {t("unitLabel")}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-tiny font-bold",
                          category
                            ? cn(
                                category.bg,
                                category.color,
                                category.border,
                                category.darkBg,
                                category.darkText,
                                "border",
                              )
                            : "bg-muted text-foreground/80",
                        )}
                      >
                        <ChevronRight className="size-2.5 opacity-60" />
                        {t(item.unitKey)}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </PageScaffold>
  );
}
