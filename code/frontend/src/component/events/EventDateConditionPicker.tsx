/*

 AI-generated code: 100% (tool: Codex - GPT-5, mode handling logic, unified condition structure, onChange normalization)
 
 Human code: 0% (functions: EventDateConditionPicker, mode state initializer, before/onChange handler, after/onChange handler, betweenStart/onChange handler, betweenEnd/onChange handler)
 
 No framework-generated code.

*/

"use client";

import { useState, useMemo } from "react";
import {
  EventDateTimePicker,
  parseDateTimeValue,
} from "@/component/events/EventDateTimePicker";
import clsx from "clsx";

const modes = ["Before", "After", "Between"] as const;
type Mode = (typeof modes)[number];

export type DateConditionValue =
  | { type: "before"; date: string; time: string }
  | { type: "after"; date: string; time: string }
  | {
      type: "between";
      start: string;
      startTime: string;
      end: string;
      endTime: string;
    }
  | null;

type Props = {
  value: DateConditionValue;
  onChange: (value: DateConditionValue) => void;
};

export function EventDateConditionPicker({ value, onChange }: Props) {
  const [mode, setMode] = useState<Mode>(() => {
    if (!value) return "Before";
    if (value.type === "before") return "Before";
    if (value.type === "after") return "After";
    return "Between";
  });

  const beforeDate = value?.type === "before" ? value.date : "";
  const beforeTime = value?.type === "before" ? value.time : "";

  const afterDate = value?.type === "after" ? value.date : "";
  const afterTime = value?.type === "after" ? value.time : "";

  const betweenStart = value?.type === "between" ? value.start : "";
  const betweenStartTime = value?.type === "between" ? value.startTime : "";
  const betweenEnd = value?.type === "between" ? value.end : "";
  const betweenEndTime = value?.type === "between" ? value.endTime : "";

  const parsedStart = useMemo(
    () => parseDateTimeValue(betweenStart, ""),
    [betweenStart],
  );

  return (
    <div className="space-y-4 w-[min(90vw,400px)] p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-lg">
      <div className="flex justify-center gap-2 mb-2">
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
          id="condition-before"
          label="Before"
          dateValue={beforeDate}
          timeValue={beforeTime}
          onChange={(date, time) =>
            onChange(date ? { type: "before", date, time } : null)
          }
        />
      )}

      {mode === "After" && (
        <EventDateTimePicker
          id="condition-after"
          label="After"
          dateValue={afterDate}
          timeValue={afterTime}
          onChange={(date, time) =>
            onChange(date ? { type: "after", date, time } : null)
          }
        />
      )}

      {mode === "Between" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EventDateTimePicker
            id="condition-between-start"
            label="Start Date"
            dateValue={betweenStart}
            timeValue={betweenStartTime}
            onChange={(date, time) =>
              onChange(
                date && betweenEnd
                  ? {
                      type: "between",
                      start: date,
                      startTime: time,
                      end: betweenEnd,
                      endTime: betweenEndTime,
                    }
                  : date
                    ? {
                        type: "between",
                        start: date,
                        startTime: time,
                        end: "",
                        endTime: "",
                      }
                    : null,
              )
            }
          />

          <EventDateTimePicker
            id="condition-between-end"
            label="End Date"
            dateValue={betweenEnd}
            timeValue={betweenEndTime}
            minDate={parsedStart}
            onChange={(date, time) =>
              onChange(
                date && betweenStart
                  ? {
                      type: "between",
                      start: betweenStart,
                      startTime: betweenStartTime,
                      end: date,
                      endTime: time,
                    }
                  : date
                    ? {
                        type: "between",
                        start: "",
                        startTime: "",
                        end: date,
                        endTime: time,
                      }
                    : null,
              )
            }
          />
        </div>
      )}
    </div>
  );
}
