import type { ZoneResult } from "@/lib/zaf";

interface ZoneBadgeProps {
  zone: ZoneResult | string | null | undefined;
  size?: "sm" | "md";
}

function normalizeZone(zone: string) {
  return zone
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function ZoneBadge({ zone, size = "md" }: ZoneBadgeProps) {
  if (!zone) {
    return <span className="text-muted-foreground">N/A</span>;
  }

  const normalizedZone = normalizeZone(zone);
  const isPositive =
    normalizedZone.includes("saudavel") ||
    normalizedZone.includes("healthy") ||
    normalizedZone.includes("zsaf");

  const sizeClasses =
    size === "sm"
      ? "gap-1 px-2 py-0.5 text-micro"
      : "gap-1.5 px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold tracking-tight shadow-sm ${sizeClasses} ${
        isPositive
          ? "border-success-500/25 bg-success-100/80 text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-300"
          : "border-warning-500/25 bg-warning-100/80 text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-300"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${isPositive ? "bg-success-500" : "bg-warning-500"}`}
      />
      {zone}
    </span>
  );
}
