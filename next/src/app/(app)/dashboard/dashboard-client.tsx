"use client";

import { useTranslations } from "next-intl";
import {
  Users,
  Activity,
  AlertTriangle,
  School,
  TrendingUp,
  BookOpen,
  FileText,
  Link2,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardCardData, DashboardSummary } from "@/lib/dashboard";

interface Props {
  username: string;
  summary: DashboardSummary;
}

const ICONS: Record<DashboardCardData["icon"], typeof Users> = {
  users: Users,
  activity: Activity,
  alert: AlertTriangle,
  school: School,
  file: FileText,
  book: BookOpen,
};

export function DashboardClient({ username, summary }: Props) {
  const t = useTranslations("dashboard");
  const h = new Date().getHours();
  const greeting =
    h < 12
      ? t("greetingMorning")
      : h < 19
        ? t("greetingAfternoon")
        : t("greetingEvening");

  if (summary.variant === "student") {
    if (!summary.studentSummary) {
      return (
        <div className="flex flex-col gap-6">
          <PageHeader
            title={`${greeting}, ${username}!`}
            description={t("unlinkedDescription")}
          />
          <EmptyState
            icon={Link2}
            title={t("unlinkedTitle")}
            description={t("unlinkedDescription")}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={`${greeting}, ${summary.studentSummary.name.split(" ")[0]}!`}
          description={t("activitySummary")}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            icon={Activity}
            title={t("lastBiometric")}
            value={
              summary.studentSummary.lastBiometric
                ? new Date(summary.studentSummary.lastBiometric).toLocaleDateString(
                    "pt-PT"
                  )
                : "—"
            }
            description={t("lastMeasurement")}
            delay={100}
          />
          <KpiCard
            icon={Activity}
            title={t("lastTests")}
            value={
              summary.studentSummary.lastTest
                ? new Date(summary.studentSummary.lastTest).toLocaleDateString(
                    "pt-PT"
                  )
                : "—"
            }
            description={t("lastTestDate")}
            delay={200}
          />
        </div>
      </div>
    );
  }

  const description =
    summary.variant === "staff"
      ? t("platformOverview")
      : summary.variant === "psychologist"
        ? t("psychologistOverview")
        : t("parentOverview");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`${greeting}, ${username}!`} description={description} />

      {summary.cards.length > 0 && (
        <div
          className={`grid gap-4 ${
            summary.cards.length >= 4
              ? "grid-cols-2 lg:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2"
          }`}
        >
          {summary.cards.map((card, index) => {
            const Icon = ICONS[card.icon];
            return (
              <KpiCard
                key={card.id}
                icon={Icon}
                title={t(card.titleKey)}
                value={card.value}
                description={t(card.descriptionKey)}
                delay={index * 75}
                accent={card.accent}
              />
            );
          })}
        </div>
      )}

      {summary.variant === "staff" && summary.zafByYear.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6 animate-fade-in-up delay-300 shadow-card">
          <h3 className="flex items-center gap-2 font-semibold mb-5 text-sm">
            <TrendingUp className="size-4 text-navy-600 dark:text-navy-300" />
            {t("zafDistribution")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.zafByYear.map((academicYear, index) => {
              const pct =
                academicYear.withBio > 0
                  ? Math.round((academicYear.zsaf / academicYear.withBio) * 100)
                  : 0;
              return (
                <div
                  key={academicYear.year}
                  className="p-5 rounded-2xl bg-muted/30 glass flex flex-col gap-3.5 border border-border/50 hover:bg-muted/50 hover:shadow-card-hover transition-all duration-300 group"
                  style={{ animationDelay: `${300 + index * 75}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">
                      {academicYear.year}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {academicYear.total} alunos
                    </span>
                  </div>
                  {academicYear.withBio > 0 ? (
                    <>
                      <div className="h-3 relative rounded-full bg-navy-900/10 dark:bg-navy-900/40 overflow-hidden shadow-inner ring-1 ring-border/50 inset-shadow-sm">
                        <div
                          className="absolute top-0 left-0 bottom-0 rounded-full animate-progress"
                          style={{
                            "--progress-width": `${pct}%`,
                            background: "linear-gradient(90deg, #10b981, #34d399)",
                            boxShadow: "0 0 10px rgba(16, 185, 129, 0.5)",
                          } as React.CSSProperties}
                        >
                          <div
                            className="absolute inset-0 bg-white/20"
                            style={{ mixBlendMode: "overlay" }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-success-600 dark:text-success-500 font-bold tracking-tight">
                          {t("zsaf")}: {academicYear.zsaf} ({pct}%)
                        </span>
                        <span className="text-gold-600 dark:text-gold-500 font-bold tracking-tight">
                          {t("zmf")}: {academicYear.zmf}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t("noBioData")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {summary.variant === "staff" && (
        <div className="bg-card rounded-2xl border border-border p-6 animate-fade-in-up delay-400 shadow-card">
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
            {t("quickActions")}
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-5 mt-4">
            {[
              {
                href: "/biometria",
                label: t("registerBiometric"),
                cls: "from-navy-600 to-navy-800 text-white shadow-[0_4px_14px_rgba(20,48,76,0.39)] border-navy-700/50",
              },
              {
                href: "/testes",
                label: t("registerTests"),
                cls: "from-gold-400 to-gold-600 text-navy-950 shadow-[0_0_15px_rgba(194,151,13,0.5)] border-gold-400/50",
              },
              {
                href: "/turma",
                label: t("viewClass"),
                cls: "from-muted to-muted-foreground/10 text-foreground shadow-sm border-border",
              },
              {
                href: "/analise",
                label: t("analyzeZaf"),
                cls: "from-muted to-muted-foreground/10 text-foreground shadow-sm border-border",
              },
            ].map(({ href, label, cls }) => (
              <a
                key={href}
                href={href}
                className={`relative px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 
                         hover:-translate-y-1 hover:shadow-float active:scale-95 active:translate-y-0
                         bg-gradient-to-b border ${cls}`}
              >
                <span className="relative z-10">{label}</span>
                <div className="absolute inset-x-0 top-0 h-px bg-white/20 rounded-t-xl" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
