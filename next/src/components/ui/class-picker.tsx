"use client";

import { CheckCircle2, ChevronDown, School } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface SchoolClass {
  id: string;
  name: string;
  year: string;
}

interface ClassPickerProps {
  classes: SchoolClass[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string; // allow overriding container styles if needed
}

export function ClassPicker({
  classes,
  value,
  onChange,
  placeholder,
  className = "w-full max-w-xs",
}: ClassPickerProps) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const selectedClass = classes.find((c) => c.id === value);

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex min-h-[46px] w-full items-center justify-between rounded-[12px] border border-border/70 bg-card px-4 py-2 shadow-sm outline-none transition-all duration-300 hover:border-navy-300/40 hover:bg-muted/50 hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
          >
            <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <School className="h-4 w-4 text-muted-foreground mr-1" />
              {value && selectedClass ? (
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate">{selectedClass.name}</span>
                  <span className="shrink-0 text-xs font-normal text-muted-foreground">
                    {selectedClass.year}
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">
                  {placeholder || t("class")}
                </span>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground opacity-50 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-h-[320px] rounded-[12px] p-0"
          align="start"
          side="bottom"
          sideOffset={8}
          collisionPadding={16}
          avoidCollisions={false}
        >
          <div className="flex max-h-[320px] flex-col gap-1 overflow-y-auto p-2">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
              {placeholder || t("class")}
            </div>
            {classes.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                {t("noResults", { fallback: "Nenhuma turma" })}
              </p>
            ) : (
              classes.map((schoolClass) => (
                <button
                  key={schoolClass.id}
                  type="button"
                  onClick={() => {
                    onChange(schoolClass.id);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full rounded-[8px] px-3 py-2.5 text-sm transition-all text-left ${
                    value === schoolClass.id
                      ? "bg-navy-900 text-white shadow-card"
                      : "hover:bg-muted/60 text-foreground"
                  }`}
                >
                  <School
                    className={`h-5 w-5 shrink-0 ml-1 ${value === schoolClass.id ? "text-indigo-200" : "text-muted-foreground/70"}`}
                  />
                  <div className="flex flex-col flex-1 ml-1">
                    <span className="font-semibold">{schoolClass.name}</span>
                    <span
                      className={`text-tiny font-medium leading-none mt-1 ${value === schoolClass.id ? "text-indigo-300" : "text-muted-foreground"}`}
                    >
                      {schoolClass.year}
                    </span>
                  </div>
                  {value === schoolClass.id && (
                    <CheckCircle2 className="h-5 w-5 opacity-80 text-white" />
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
