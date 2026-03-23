import {
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { ChartFrame } from "@/components/ui/chart-frame";

type HeightChartDatum = {
  age: number;
  range: [number, number] | null;
  p20: number | null;
  p30: number | null;
  p50: number | null;
  p70: number | null;
  p80: number | null;
  studentHeight: number | null;
};

const WHO_HEIGHT_M: Record<number, { p5: number; p20: number; p30: number; p50: number; p70: number; p80: number; p95: number }> = {
  9: { p5: 120, p20: 127, p30: 129, p50: 133, p70: 137, p80: 139, p95: 145 },
  10: { p5: 125, p20: 131, p30: 134, p50: 138, p70: 142, p80: 145, p95: 151 },
  11: { p5: 130, p20: 136, p30: 139, p50: 143, p70: 148, p80: 151, p95: 158 },
  12: { p5: 135, p20: 142, p30: 145, p50: 149, p70: 154, p80: 157, p95: 165 },
  13: { p5: 141, p20: 148, p30: 152, p50: 156, p70: 161, p80: 165, p95: 173 },
  14: { p5: 148, p20: 155, p30: 159, p50: 163, p70: 168, p80: 172, p95: 180 },
  15: { p5: 154, p20: 162, p30: 164, p50: 169, p70: 174, p80: 177, p95: 185 },
  16: { p5: 159, p20: 166, p30: 168, p50: 173, p70: 178, p80: 181, p95: 188 },
  17: { p5: 161, p20: 168, p30: 171, p50: 175, p70: 179, p80: 182, p95: 189 },
  18: { p5: 162, p20: 169, p30: 172, p50: 176, p70: 180, p80: 183, p95: 190 },
  19: { p5: 163, p20: 169, p30: 173, p50: 176, p70: 180, p80: 184, p95: 191 },
};

const WHO_HEIGHT_F: Record<number, { p5: number; p20: number; p30: number; p50: number; p70: number; p80: number; p95: number }> = {
  9: { p5: 120, p20: 126, p30: 129, p50: 133, p70: 137, p80: 140, p95: 146 },
  10: { p5: 125, p20: 132, p30: 134, p50: 138, p70: 142, p80: 145, p95: 152 },
  11: { p5: 132, p20: 138, p30: 140, p50: 144, p70: 149, p80: 152, p95: 159 },
  12: { p5: 139, p20: 145, p30: 148, p50: 151, p70: 155, p80: 158, p95: 165 },
  13: { p5: 145, p20: 150, p30: 153, p50: 156, p70: 160, p80: 163, p95: 169 },
  14: { p5: 148, p20: 153, p30: 156, p50: 159, p70: 163, p80: 166, p95: 172 },
  15: { p5: 150, p20: 156, p30: 157, p50: 161, p70: 165, p80: 167, p95: 173 },
  16: { p5: 151, p20: 157, p30: 158, p50: 162, p70: 166, p80: 168, p95: 174 },
  17: { p5: 151, p20: 157, p30: 158, p50: 162, p70: 166, p80: 168, p95: 174 },
  18: { p5: 151, p20: 156, p30: 160, p50: 163, p70: 166, p80: 169, p95: 174 },
  19: { p5: 151, p20: 156, p30: 160, p50: 163, p70: 166, p80: 169, p95: 174 },
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
  const whoTable = sex === "M" ? WHO_HEIGHT_M : WHO_HEIGHT_F;

  // Render from 9 to 19 roughly depending on student age
  let minAge = 10;
  let maxAge = 18;

  if (birthDate) {
    const bDate = new Date(birthDate);
    const ages = biometrics.map((b) => (new Date(b.recordedAt).getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    if (ages.length > 0) {
      const minA = Math.floor(Math.min(...ages));
      const maxA = Math.ceil(Math.max(...ages));
      if (minA < minAge) minAge = Math.max(9, minA);
      if (maxA > maxAge) maxAge = Math.min(19, maxA);
    }
  }

  const chartData: HeightChartDatum[] = [];
  for (let age = minAge; age <= maxAge; age++) {
    chartData.push({
      age,
      range: [whoTable[age].p5, whoTable[age].p95],
      p20: whoTable[age].p20,
      p30: whoTable[age].p30,
      p50: whoTable[age].p50,
      p70: whoTable[age].p70,
      p80: whoTable[age].p80,
      studentHeight: null,
    });
  }

  if (birthDate) {
    const bDate = new Date(birthDate);
    biometrics.forEach((b) => {
      const rDate = new Date(b.recordedAt);
      const ageAtMeasurement =
        (rDate.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      
      if (ageAtMeasurement >= minAge - 0.5 && ageAtMeasurement <= maxAge + 0.5) {
        chartData.push({
          age: Number(ageAtMeasurement.toFixed(2)),
          range: null,
          p20: null,
          p30: null,
          p50: null,
          p70: null,
          p80: null,
          studentHeight: Math.round(b.heightM * 100),
        });
      }
    });
  }

  chartData.sort((a, b) => a.age - b.age);

  return (
    <ChartFrame className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="age"
          type="number"
          domain={[minAge, maxAge]}
          tickCount={maxAge - minAge + 1}
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
          cursor={{ stroke: "var(--color-border)", strokeWidth: 1, strokeDasharray: "4 4" }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="rounded-lg border border-border/80 bg-card/95 backdrop-blur-md p-3 text-xs shadow-md flex flex-col gap-1 min-w-[140px] text-foreground surface-primary">
                  <p className="font-medium text-xs text-muted-foreground border-b border-border/40 pb-1.5 mb-1">Idade: {data.age} anos</p>
                  {data.studentHeight !== null && <p className="text-foreground font-semibold mb-1">Aluno: {data.studentHeight} cm</p>}
                  {data.range && <p className="text-muted-foreground/80 flex justify-between"><span>P95:</span> <span>{data.range[1]} cm</span></p>}
                  {data.p80 !== null && <p className="text-orange-500 flex justify-between"><span>P80:</span> <span>{data.p80} cm</span></p>}
                  {data.p70 !== null && <p className="text-yellow-600 dark:text-yellow-500 flex justify-between"><span>P70:</span> <span>{data.p70} cm</span></p>}
                  {data.p50 !== null && <p className="text-success-600 flex justify-between font-medium"><span>P50:</span> <span>{data.p50} cm</span></p>}
                  {data.p30 !== null && <p className="text-sky-500 flex justify-between"><span>P30:</span> <span>{data.p30} cm</span></p>}
                  {data.p20 !== null && <p className="text-indigo-500 flex justify-between"><span>P20:</span> <span>{data.p20} cm</span></p>}
                  {data.range && <p className="text-muted-foreground/80 flex justify-between"><span>P5:</span> <span>{data.range[0]} cm</span></p>}
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
          dataKey="p80"
          stroke="#f97316"
          strokeOpacity={0.4}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          connectNulls
          dot={false}
          activeDot={false}
        />
        <Line
          type="monotone"
          dataKey="p70"
          stroke="#eab308"
          strokeOpacity={0.4}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          connectNulls
          dot={false}
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
          dataKey="p30"
          stroke="#0ea5e9"
          strokeOpacity={0.4}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          connectNulls
          dot={false}
          activeDot={false}
        />
        <Line
          type="monotone"
          dataKey="p20"
          stroke="#6366f1"
          strokeOpacity={0.4}
          strokeWidth={1.5}
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
          dot={{ r: 4, strokeWidth: 2, fill: "var(--color-background)", stroke: "var(--color-success-600)" }}
          activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-success-600)" }}
          isAnimationActive={true}
        />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
