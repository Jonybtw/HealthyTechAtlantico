import type { ZoneResult } from "@/lib/zaf";

interface ZoneBadgeProps {
  zone: ZoneResult | string | null | undefined;
  size?: "sm" | "md";
}

export function ZoneBadge({ zone, size = "md" }: ZoneBadgeProps) {
  if (!zone) return <span className="text-muted-foreground text-sm">—</span>;

  const isOk = zone.toLowerCase().includes("saudável") || zone.toLowerCase().includes("saudavel");
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${
        isOk
          ? "bg-zone-ok-bg text-zone-ok"
          : "bg-zone-needs-bg text-zone-needs"
      }`}
    >
      {zone}
    </span>
  );
}
