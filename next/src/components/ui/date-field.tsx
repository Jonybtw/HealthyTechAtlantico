"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateFieldProps {
  id?: string;
  name?: string;
  label?: string;
  error?: string;
  hint?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  autoFocus?: boolean;
}

function parseDateValue(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateValue(value: string, locale: string) {
  const parsed = parseDateValue(value);
  if (!parsed) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function getWeekdayLabels(locale: string) {
  const baseMonday = new Date(2024, 0, 1);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(baseMonday);
    date.setDate(baseMonday.getDate() + index);
    return new Intl.DateTimeFormat(locale, { weekday: "short" })
      .format(date)
      .replace(".", "")
      .slice(0, 2)
      .toUpperCase();
  });
}

function getCalendarDays(monthDate: Date) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthIndex = start.getMonth();
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      isCurrentMonth: date.getMonth() === monthIndex,
    };
  });
}

export const DateField = React.forwardRef<HTMLButtonElement, DateFieldProps>(
  (
    {
      id,
      name,
      label,
      value = "",
      onChange,
      onBlur,
      hint,
      error,
      disabled,
      required,
      className,
      placeholder,
      min,
      max,
      autoFocus,
    },
    ref,
  ) => {
    const locale = useLocale();
    const uid = id ?? name;
    const selectedDate = parseDateValue(value);
    const [open, setOpen] = React.useState(false);
    const [visibleMonth, setVisibleMonth] = React.useState<Date>(
      selectedDate ?? new Date(),
    );

    React.useEffect(() => {
      const nextSelectedDate = parseDateValue(value);
      if (nextSelectedDate) {
        setVisibleMonth(nextSelectedDate);
      }
    }, [value]);

    const localizedPlaceholder =
      placeholder ?? (locale.startsWith("pt") ? "dd/mm/aaaa" : "mm/dd/yyyy");
    const displayValue = value
      ? formatDateValue(value, locale)
      : localizedPlaceholder;
    const weekdayLabels = React.useMemo(
      () => getWeekdayLabels(locale),
      [locale],
    );
    const days = React.useMemo(
      () => getCalendarDays(visibleMonth),
      [visibleMonth],
    );
    const monthLabel = React.useMemo(
      () =>
        new Intl.DateTimeFormat(locale, {
          month: "long",
          year: "numeric",
        }).format(visibleMonth),
      [locale, visibleMonth],
    );

    const todayLabel = locale.startsWith("pt") ? "Hoje" : "Today";
    const clearLabel = locale.startsWith("pt") ? "Limpar" : "Clear";

    const isOutOfRange = (date: Date) => {
      const nextValue = toDateValue(date);
      if (min && nextValue < min) return true;
      if (max && nextValue > max) return true;
      return false;
    };

    const handleSelect = (date: Date) => {
      if (disabled || isOutOfRange(date)) return;
      onChange?.(toDateValue(date));
      setOpen(false);
    };

    const handleClear = () => {
      onChange?.("");
      setOpen(false);
    };

    const today = new Date();
    const todayValue = toDateValue(today);

    return (
      <div className="flex flex-col gap-1.5">
        {name ? (
          <input type="hidden" name={name} value={value} required={required} />
        ) : null}
        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            if (disabled) return;
            if (nextOpen) {
              setVisibleMonth(selectedDate ?? new Date());
            }
            setOpen(nextOpen);
          }}
        >
          <PopoverTrigger asChild>
            <button
              ref={ref}
              id={uid}
              type="button"
              aria-label={typeof label === "string" ? label : undefined}
              aria-describedby={
                error ? `${uid}-error` : hint ? `${uid}-hint` : undefined
              }
              aria-expanded={open}
              aria-haspopup="dialog"
              disabled={disabled}
              autoFocus={autoFocus}
              onBlur={onBlur}
              className={cn(
                "group flex h-14 w-full items-center justify-between rounded-full border border-border/80 bg-card px-4 py-0 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-sm transition-all duration-300",
                "hover:border-navy-300/40 hover:bg-muted/50",
                "focus:outline-none focus:ring-4 focus:ring-gold-400/15 focus:border-gold-500/60",
                "disabled:cursor-not-allowed disabled:opacity-50",
                error
                  ? "border-danger-500/60 focus:border-danger-500 focus:ring-danger-500/15"
                  : "border-border/80",
                className,
              )}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                {label ? (
                  <span className="text-micro font-semibold text-muted-foreground">
                    {label}
                  </span>
                ) : null}
                <span
                  className={cn(
                    "mt-0.5 truncate text-sm leading-tight",
                    value
                      ? "font-medium text-foreground"
                      : "text-muted-foreground/70",
                  )}
                >
                  {displayValue}
                </span>
              </span>
              <span className="ml-3 flex shrink-0 items-center justify-center text-muted-foreground transition-colors group-hover:text-foreground">
                <CalendarDays className="size-4" />
              </span>
            </button>
          </PopoverTrigger>

          <PopoverContent align="start" className="w-[320px] rounded-[24px] p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleMonth(
                      (current) =>
                        new Date(
                          current.getFullYear(),
                          current.getMonth() - 1,
                          1,
                        ),
                    )
                  }
                  className="flex size-9 items-center justify-center rounded-full border border-border/70 bg-card/70 text-muted-foreground transition hover:border-navy-300/40 hover:text-foreground"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <p className="text-sm font-semibold capitalize text-foreground">
                  {monthLabel}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setVisibleMonth(
                      (current) =>
                        new Date(
                          current.getFullYear(),
                          current.getMonth() + 1,
                          1,
                        ),
                    )
                  }
                  className="flex size-9 items-center justify-center rounded-full border border-border/70 bg-card/70 text-muted-foreground transition hover:border-navy-300/40 hover:text-foreground"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {weekdayLabels.map((weekday, index) => (
                  <span
                    key={`${weekday}-${index}`}
                    className="pb-1 text-micro font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    {weekday}
                  </span>
                ))}
                {days.map(({ date, isCurrentMonth }) => {
                  const nextValue = toDateValue(date);
                  const isSelected = value === nextValue;
                  const isToday = todayValue === nextValue;
                  const isDisabledDay = isOutOfRange(date);

                  return (
                    <button
                      key={nextValue}
                      type="button"
                      onClick={() => handleSelect(date)}
                      disabled={isDisabledDay}
                      className={cn(
                        "flex h-10 items-center justify-center rounded-[24px] text-sm transition-all duration-200",
                        isSelected
                          ? "bg-navy-900 text-white shadow-card"
                          : isToday
                            ? "border border-gold-400/50 bg-gold-100/80 text-navy-950"
                            : "text-foreground hover:bg-muted/70",
                        !isCurrentMonth &&
                          !isSelected &&
                          "text-muted-foreground/45",
                        isDisabledDay &&
                          "cursor-not-allowed opacity-35 hover:bg-transparent",
                      )}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <button
                  type="button"
                  onClick={() => handleSelect(today)}
                  disabled={isOutOfRange(today)}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-navy-300/40 hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CalendarDays className="size-3.5" />
                  {todayLabel}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!value}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X className="size-3.5" />
                  {clearLabel}
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {error ? (
          <p
            id={`${uid}-error`}
            role="alert"
            className="text-tiny font-medium leading-relaxed text-danger-600"
          >
            {error}
          </p>
        ) : hint ? (
          <p
            id={`${uid}-hint`}
            className="text-tiny leading-relaxed text-muted-foreground"
          >
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

DateField.displayName = "DateField";
