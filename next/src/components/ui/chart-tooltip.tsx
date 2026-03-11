interface TooltipEntry {
  color?: string;
  name?: string;
  value?: string | number;
}

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-card/90 glass p-3 border border-border/50 shadow-float rounded-xl text-sm">
      <p className="font-semibold mb-2 tracking-tight text-foreground">{label}</p>
      <div className="flex flex-col gap-1.5">
        {payload.map((entry, index) => (
          <div key={`${entry.name}-${index}`} className="flex items-center gap-2">
            <div
              className="size-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground mr-2">{entry.name}:</span>
            <span className="font-bold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
