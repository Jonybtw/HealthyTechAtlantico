"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Activity, Scale, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProtocolosNav() {
  const t = useTranslations("protocolos");
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

    const ids = ["body-eval", "fitness"];
    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-[72px] z-30 mb-6 bg-white/50 dark:bg-navy-950/40 backdrop-blur-sm py-2.5 backdrop-blur-xl md:top-[88px]">
      <nav className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        <div className="flex items-center gap-1 rounded-full border border-white/20 dark:border-white/10 bg-white/60 dark:bg-navy-950/40 backdrop-blur-md/70 p-1 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
          <a
            href="#body-eval"
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95",
              activeId === "body-eval"
                ? "bg-navy-100 text-navy-800 shadow-sm dark:bg-navy-800 dark:text-navy-100"
                : "text-muted-foreground hover:bg-navy-50 hover:text-navy-700 dark:hover:bg-navy-900/40 dark:hover:text-navy-200",
            )}
          >
            <Scale className="size-3.5" />
            IMC & Cintura
          </a>
          <div className="mx-1 h-4 w-px bg-border/40" />
          <a
            href="#fitness"
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95",
              activeId === "fitness"
                ? "bg-navy-700 text-white shadow-md dark:bg-navy-600"
                : "text-muted-foreground hover:bg-navy-100/50 hover:text-navy-800 dark:hover:bg-navy-800/50 dark:hover:text-navy-200",
            )}
          >
            <Activity className="size-3.5" />
            {t("fitnessTitle")}
          </a>
        </div>
      </nav>
    </div>
  );
}
