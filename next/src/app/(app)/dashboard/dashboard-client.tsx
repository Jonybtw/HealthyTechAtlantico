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
  Ruler,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTransition, StaggerList, StaggerItem, FadeIn } from "@/components/ui/motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
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
        <div className="flex flex-col gap-5">
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
      <div className="flex flex-col gap-5">
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
    <PageTransition className="flex flex-col gap-5">
      <PageHeader title={`${greeting}, ${username}!`} description={description} />

      {summary.cards.length > 0 && (
        <StaggerList
          className={`grid gap-4 ${summary.cards.length >= 4
              ? "grid-cols-2 lg:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2"
            }`}
        >
          {summary.cards.map((card) => {
            const Icon = ICONS[card.icon];
            return (
              <StaggerItem key={card.id}>
                <KpiCard
                  icon={Icon}
                  title={t(card.titleKey)}
                  value={card.value}
                  description={t(card.descriptionKey)}
                  accent={card.accent}
                />
              </StaggerItem>
            );
          })}
        </StaggerList>
      )}

      {summary.variant === "staff" && summary.zafByYear.length > 0 && (() => {
        const totalZsaf = summary.zafByYear.reduce((s, y) => s + y.zsaf, 0);
        const totalZmf = summary.zafByYear.reduce((s, y) => s + y.zmf, 0);
        const donutData = [
          { name: t("zsaf"), value: totalZsaf, color: "#10b981" },
          { name: t("zmf"), value: totalZmf, color: "#f59e0b" },
        ];
        const totalWithBio = totalZsaf + totalZmf;
        const overallPct = totalWithBio > 0 ? Math.round((totalZsaf / totalWithBio) * 100) : 0;

        return (
          <FadeIn delay={0.3} className="bg-card rounded-2xl border border-border p-5 shadow-card">
            <h3 className="flex items-center gap-2 font-semibold mb-5 text-sm">
              <TrendingUp className="size-4 text-navy-600 dark:text-navy-300" />
              {t("zafDistribution")}
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-5 items-start">
              {/* Donut chart summary */}
              {totalWithBio > 0 && (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-[160px] h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={72}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {donutData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-card)",
                            fontSize: "13px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold tabular-nums">{overallPct}%</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("zsaf")}</span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-[#10b981]" />
                      <span className="text-muted-foreground">{t("zsaf")}: {totalZsaf}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-[#f59e0b]" />
                      <span className="text-muted-foreground">{t("zmf")}: {totalZmf}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Year cards */}
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
          </FadeIn>
        );
      })()}

      {summary.variant === "staff" && (
        <FadeIn delay={0.4}>
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
            {t("quickActions")}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                href: "/biometria",
                label: t("registerBiometric"),
                icon: Ruler,
                gradient: "from-navy-600 to-navy-800",
                text: "text-white",
                shadow: "shadow-[0_4px_14px_rgba(20,48,76,0.39)]",
              },
              {
                href: "/testes",
                label: t("registerTests"),
                icon: ClipboardList,
                gradient: "from-gold-400 to-gold-600",
                text: "text-navy-950",
                shadow: "shadow-[0_0_15px_rgba(194,151,13,0.5)]",
              },
              {
                href: "/turma",
                label: t("viewClass"),
                icon: School,
                gradient: "from-muted to-muted-foreground/10",
                text: "text-foreground",
                shadow: "shadow-sm",
              },
              {
                href: "/analise",
                label: t("analyzeZaf"),
                icon: BarChart3,
                gradient: "from-muted to-muted-foreground/10",
                text: "text-foreground",
                shadow: "shadow-sm",
              },
            ].map(({ href, label, icon: ActionIcon, gradient, text, shadow }) => (
              <a
                key={href}
                href={href}
                className={`group relative flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-gradient-to-b p-5 text-center transition-all duration-300
                         hover:-translate-y-1 hover:shadow-float active:scale-95 active:translate-y-0
                         ${gradient} ${text} ${shadow}`}
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110">
                  <ActionIcon className="size-5" />
                </span>
                <span className="text-sm font-bold tracking-wide">{label}</span>
              </a>
            ))}
          </div>
        </FadeIn>
      )}
    </PageTransition>
  );
}
