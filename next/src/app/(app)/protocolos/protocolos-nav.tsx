"use client";

import { useEffect, useState } from "react";
import { Activity, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    id: "body-eval",
    label: "IMC & Cintura",
    Icon: Scale,
  },
  {
    id: "fitness",
    label: "Testes de Aptidão Física",
    Icon: Activity,
  },
] as const;

export function ProtocolosNav() {
  const [activeId, setActiveId] = useState<string>("body-eval");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    NAV_ITEMS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="-mx-1 mb-2 px-1 pb-1 pt-0">
      <nav
        aria-label="Secções de protocolos"
        className="flex items-center gap-1 overflow-x-auto scrollbar-hide"
      >
        <div className="flex items-center gap-1 rounded-[1.1rem] border border-border bg-surface-utility p-1 shadow-sm">
          {NAV_ITEMS.map(({ id, label, Icon }, index) => {
            const isActive = activeId === id;
            return (
              <a
                key={id}
                href={`#${id}`}
                className={cn(
                  "inline-flex items-center gap-2 rounded-[0.85rem] px-4 py-2 text-xs font-semibold transition-all duration-200 active:scale-95",
                  isActive
                    ? index === 0
                      ? "bg-navy-100 text-navy-800 shadow-sm dark:bg-navy-800 dark:text-navy-100"
                      : "bg-navy-700 text-white shadow-md dark:bg-navy-600"
                    : "text-muted-foreground hover:bg-navy-50 hover:text-navy-700 dark:hover:bg-navy-900/40 dark:hover:text-navy-200",
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
