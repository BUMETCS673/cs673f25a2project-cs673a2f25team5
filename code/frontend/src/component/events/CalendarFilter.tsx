"use client";

import { useState, useMemo } from "react";
import {
  EventDateTimePicker,
  parseDateTimeValue,
} from "@/component/events/EventDateTimePicker";
import clsx from "clsx";

const modes = ["Before", "After", "Between"] as const;
type Mode = (typeof modes)[number];

export type CalendarFilterValue =
  | { type: "before"; date: string }
  | { type: "after"; date: string }
  | { type: "between"; start: string; end: string }
  | null;

type CalendarFilterProps = {
  value: CalendarFilterValue;
  onChange: (value: CalendarFilterValue) => void;
};

export function CalendarFilter({ value, onChange }: CalendarFilterProps) {
  const [mode, setMode] = useState<Mode>(() => {
    if (!value) return "Before";
    if (value.type === "before") return "Before";
    if (value.type === "after") return "After";
    return "Between";
  });

  const beforeDate = value?.type === "before" ? value.date : "";
  const afterDate = value?.type === "after" ? value.date : "";
  const betweenStart = value?.type === "between" ? value.start : "";
  const betweenEnd = value?.type === "between" ? value.end : "";

  const parsedStart = useMemo(
    () => parseDateTimeValue(betweenStart, ""),
    [betweenStart],
  );

  return (
    <div className="space-y-4 w-[min(90vw,400px)] p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-lg">
      <div className="flex gap-2 mb-2">
        {modes.map((m) => (
          <button
            key={m}
            type="button"
            className={clsx(
              "cursor-pointer px-4 py-2 rounded-full text-sm font-semibold transition",
              mode === m
                ? "bg-amber-400 text-white shadow"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200",
            )}
            onClick={() => {
              setMode(m);
              onChange(null);
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === "Before" && (
        <EventDateTimePicker
          id="filter-before"
          label="Before"
          dateValue={beforeDate}
          timeValue=""
          onChange={(date) => onChange(date ? { type: "before", date } : null)}
        />
      )}

      {mode === "After" && (
        <EventDateTimePicker
          id="filter-after"
          label="After"
          dateValue={afterDate}
          timeValue=""
          onChange={(date) => onChange(date ? { type: "after", date } : null)}
        />
      )}

      {mode === "Between" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EventDateTimePicker
            id="filter-between-start"
            label="Start Date"
            dateValue={betweenStart}
            timeValue=""
            onChange={(date) =>
              onChange(
                date && betweenEnd
                  ? { type: "between", start: date, end: betweenEnd }
                  : date
                    ? { type: "between", start: date, end: "" }
                    : null,
              )
            }
          />
          <EventDateTimePicker
            id="filter-between-end"
            label="End Date"
            dateValue={betweenEnd}
            timeValue=""
            minDate={parsedStart}
            onChange={(date) =>
              onChange(
                date && betweenStart
                  ? { type: "between", start: betweenStart, end: date }
                  : date
                    ? { type: "between", start: "", end: date }
                    : null,
              )
            }
          />
        </div>
      )}
    </div>
  );
}
