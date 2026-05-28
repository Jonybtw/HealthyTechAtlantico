"use client";

import {
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ComposedChart,
} from "recharts";
import { useTranslations } from "next-intl";
import { ResponsiveChartContainer } from "@/components/ui/chart-frame";

const WHO_HEIGHT_M: Record<number, { p5: number; p50: number; p95: number }> = {
  10: { p5: 125, p50: 138, p95: 151 },
  11: { p5: 130, p50: 143, p95: 158 },
  12: { p5: 135, p50: 149, p95: 165 },
  13: { p5: 141, p50: 156, p95: 173 },
  14: { p5: 148, p50: 163, p95: 180 },
  15: { p5: 154, p50: 169, p95: 185 },
  16: { p5: 159, p50: 173, p95: 188 },
  17: { p5: 161, p50: 175, p95: 189 },
  18: { p5: 162, p50: 176, p95: 190 },
};

const WHO_HEIGHT_F: Record<number, { p5: number; p50: number; p95: number }> = {
  10: { p5: 125, p50: 138, p95: 152 },
  11: { p5: 132, p50: 144, p95: 159 },
  12: { p5: 139, p50: 151, p95: 165 },
  13: { p5: 145, p50: 156, p95: 169 },
  14: { p5: 148, p50: 159, p95: 172 },
  15: { p5: 150, p50: 161, p95: 173 },
  16: { p5: 151, p50: 162, p95: 174 },
  17: { p5: 151, p50: 162, p95: 174 },
  18: { p5: 151, p50: 163, p95: 174 },
};

export function HeightPercentilesChart({
  biometrics,
  sex,
  birthDate,
}: {
  biometrics: { heightM: number; recordedAt: string }[];
  sex: string;
  birthDate: string | null;
}) {
  const t = useTranslations("biometria");
  const whoTable = sex === "M" ? WHO_HEIGHT_M : WHO_HEIGHT_F;

  type ChartDataPoint = {
    age: number;
    range: [number, number] | null;
    p50: number | null;
    studentHeight: number | null;
  };

  const chartData: ChartDataPoint[] = [10, 11, 12, 13, 14, 15, 16, 17, 18].map((age) => {
    const bounds = whoTable[age];
    if (!bounds) throw new Error("Invalid age bound");
    return {
      age,
      range: [bounds.p5, bounds.p95],
      p50: bounds.p50,
      studentHeight: null,
    };
  });

  if (birthDate) {
    const bDate = new Date(birthDate);
    biometrics.forEach((b) => {
      const rDate = new Date(b.recordedAt);
      const ageAtMeasurement =
        (rDate.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

      if (ageAtMeasurement >= 9 && ageAtMeasurement <= 19) {
        chartData.push({
          age: Number(ageAtMeasurement.toFixed(2)),
          range: null,
          p50: null,
          studentHeight: Math.round(b.heightM * 100),
        });
      }
    });
  }

  chartData.sort((a, b) => a.age - b.age);

  return (
    <ResponsiveChartContainer width="100%" height="100%">
      <ComposedChart
        data={chartData}
        margin={{ top: 10, right: 10, bottom: 20, left: -20 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--color-border)"
        />
        <XAxis
          dataKey="age"
          type="number"
          domain={[10, 18]}
          tickCount={9}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          dy={10}
        />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v} cm`}
        />
        <RechartsTooltip
          cursor={{
            stroke: "var(--color-border)",
            strokeWidth: 1,
            strokeDasharray: "4 4",
          }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="rounded-[8px] border border-border/60 bg-background p-2.5 text-xs shadow-sm">
                  <p className="font-semibold mb-1">
                    {t("chartAge")}: {data.age} {t("chartYears")}
                  </p>
                  {data.studentHeight !== null && (
                    <p className="text-success-600 font-bold mt-1">
                      {t("chartStudent")}: {data.studentHeight} cm
                    </p>
                  )}
                  {data.p50 !== null && (
                    <p className="text-muted-foreground mt-1">
                      P50 ({t("chartAverage")}): {data.p50} cm
                    </p>
                  )}
                  {data.range && (
                    <p className="text-muted-foreground">
                      {t("chartRange")}: {data.range[0]} - {data.range[1]} cm
                    </p>
                  )}
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="range"
          stroke="none"
          fill="var(--color-success-500)"
          fillOpacity={0.15}
          connectNulls
          activeDot={false}
        />
        <Line
          type="monotone"
          dataKey="p50"
          stroke="var(--color-success-600)"
          strokeOpacity={0.6}
          strokeWidth={2}
          strokeDasharray="4 4"
          connectNulls
          dot={false}
          activeDot={false}
        />
        <Line
          type="monotone"
          dataKey="studentHeight"
          stroke="var(--color-success-600)"
          strokeWidth={3}
          connectNulls
          dot={{
            r: 4,
            strokeWidth: 2,
            fill: "var(--color-background)",
            stroke: "var(--color-success-600)",
          }}
          activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-success-600)" }}
          isAnimationActive={true}
        />
      </ComposedChart>
    </ResponsiveChartContainer>
  );
}
