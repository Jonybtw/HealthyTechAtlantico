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
          : "border-danger-500/25 bg-danger-100/80 text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-300"
      }`}
      data-zone-tone={isPositive ? "positive" : "attention"}
    >
      <span
        className={`size-1.5 rounded-full ${isPositive ? "bg-success-500" : "bg-danger-500"}`}
      />
      {zone}
    </span>
  );
}
