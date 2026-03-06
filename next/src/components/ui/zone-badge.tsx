import type { ZoneResult } from "@/lib/zaf";

interface ZoneBadgeProps {
  zone: ZoneResult | string | null | undefined;
  size?: "sm" | "md";
}

export function ZoneBadge({ zone, size = "md" }: ZoneBadgeProps) {
  if (!zone) return <span className="text-muted-foreground">—</span>;

  const isOk =
    zone.toLowerCase().includes("saudável") ||
    zone.toLowerCase().includes("saudavel");

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2 py-0.5 gap-1"
      : "text-sm px-3 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold tracking-tight shadow-sm ${sizeClasses} ${isOk
        ? "bg-gradient-to-r from-success-50 to-success-100/50 text-success-700 dark:from-success-900/40 dark:to-success-900/20 dark:text-success-300 ring-1 ring-success-500/30"
        : "bg-gradient-to-r from-danger-50 to-danger-100/50 text-danger-700 dark:from-danger-900/40 dark:to-danger-900/20 dark:text-danger-300 ring-1 ring-danger-500/30 animate-[pulse_3s_ease-in-out_infinite]"
        }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shadow-[0_0_6px_currentColor] ${isOk ? "bg-success-500" : "bg-danger-500"}`} />
      {zone}
    </span>
  );
}
