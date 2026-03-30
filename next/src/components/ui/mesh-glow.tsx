"use client";

import { cn } from "@/lib/utils";
import { useReducedEffects } from "@/hooks/use-reduced-effects";

interface MeshGlowProps {
  className?: string;
}

export function MeshGlow({ className }: MeshGlowProps) {
  return <div className={cn("mesh-glow", className)} />;
}

export function MeshBackground() {
  const reducedEffects = useReducedEffects();

  if (reducedEffects) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      <MeshGlow className="top-20 right-10" />
      <MeshGlow className="bottom-20 left-40" />
      <MeshGlow className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50" />
    </div>
  );
}
