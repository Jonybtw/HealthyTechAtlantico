"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Activity, Scale, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProtocolosNav() {
  const t = useTranslations("protocolos");
  const [activeId, setActiveId] = useState<string>("bmi");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    const ids = ["bmi", "waist", "fitness"];
    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-[72px] z-30 mb-6 bg-background/80 py-2.5 backdrop-blur-xl md:top-[88px]">
      <nav className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        <div className="flex items-center gap-1 rounded-full border border-border/50 bg-card/70 p-1 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
          <a
            href="#bmi"
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95",
              activeId === "bmi"
                ? "bg-navy-100 text-navy-800 shadow-sm dark:bg-navy-800 dark:text-navy-100"
                : "text-muted-foreground hover:bg-navy-50 hover:text-navy-700 dark:hover:bg-navy-900/40 dark:hover:text-navy-200"
            )}
          >
            <Scale className="size-3.5" />
            IMC
          </a>
          <a
            href="#waist"
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95",
              activeId === "waist"
                ? "bg-gold-100 text-gold-800 shadow-sm dark:bg-gold-900/60 dark:text-gold-100"
                : "text-muted-foreground hover:bg-gold-50 hover:text-gold-700 dark:hover:bg-gold-900/40 dark:hover:text-gold-200"
            )}
          >
            <Scissors className="size-3.5" />
            Cintura
          </a>
          <div className="mx-1 h-4 w-px bg-border/40" />
          <a
            href="#fitness"
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95",
              activeId === "fitness"
                ? "bg-navy-700 text-white shadow-md dark:bg-navy-600"
                : "text-muted-foreground hover:bg-navy-100/50 hover:text-navy-800 dark:hover:bg-navy-800/50 dark:hover:text-navy-200"
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
