/*
AI-generated code: 70% (tool: Codex - GPT-5, modified and adapted, functions: pad, addMonths, subtractMonths, parseDateTimeValue, formatDateForInput, formatTimeForInput, getDayButtonClasses, getTimeButtonClasses, EventDateTimePicker, useDatePicker, useEffect, useMemo, useRef, useState) 

Human code: 10% (functions: wrapping in useEffect, useMemo, useRef, useState, and adding the FaArrowLeft and FaArrowRight icons)

Framework-generated code: 10% (functions: pad, addMonths, subtractMonths, parseDateTimeValue, formatDateForInput, formatTimeForInput, getDayButtonClasses, getTimeButtonClasses, EventDateTimePicker, useDatePicker, useEffect, useMemo, useRef, useState)

*/

"use client";

import { useDatePicker } from "@rehookify/datepicker";
import type { DPDay, DPTime } from "@rehookify/datepicker";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

type EventDateTimePickerProps = {
  id: string;
  label: string;
  dateValue: string;
  timeValue: string;
  onChange: (date: string, time: string) => void;
  minDate?: Date;
  minuteInterval?: number;
  placeholder?: string;
  triggerClassName?: string;
};

const pad = (value: number) => String(value).padStart(2, "0");

const normalizeTimeParts = (raw?: string) => {
  const safe = raw && raw.includes(":") ? raw : "00:00";
  const [hourPart = "0", minutePart = "0"] = safe.split(":");
  const hours = Number(hourPart);
  const minutes = Number(minutePart);
  return {
    hours: Number.isNaN(hours) ? 0 : hours,
    minutes: Number.isNaN(minutes) ? 0 : minutes,
  };
};

export const parseDateTimeValue = (
  dateValue?: string,
  timeValue?: string,
): Date | undefined => {
  if (!dateValue) {
    return undefined;
  }

  const [year, month, day] = dateValue.split("-").map((part) => Number(part));

  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return undefined;
  }

  const { hours, minutes } = normalizeTimeParts(timeValue);

  return new Date(year, month - 1, day, hours, minutes);
};

const formatDateForInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const formatTimeForInput = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const getDayButtonClasses = (day: DPDay) =>
  clsx(
    "flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition",
    day.selected
      ? "bg-gradient-to-r from-amber-300 to-amber-400 text-neutral-900 shadow"
      : day.inCurrentMonth
        ? "text-neutral-800 dark:text-neutral-100"
        : "text-neutral-400 dark:text-neutral-500",
    day.disabled
      ? "cursor-not-allowed opacity-30"
      : "hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-neutral-800/60 dark:hover:text-amber-100",
  );

const getTimeButtonClasses = (selected: boolean, disabled: boolean) =>
  clsx(
    "w-full rounded-2xl border px-3 py-2 text-sm font-medium transition",
    selected
      ? "border-amber-400 bg-amber-50 text-amber-700 shadow-inner dark:border-amber-400/70 dark:bg-amber-500/10 dark:text-amber-100"
      : "border-transparent bg-neutral-100/70 text-neutral-800 hover:border-amber-200 hover:bg-white dark:bg-neutral-800/70 dark:text-neutral-200",
    disabled && "cursor-not-allowed opacity-30",
  );

export function EventDateTimePicker({
  id,
  label,
  dateValue,
  timeValue,
  onChange,
  minDate,
  minuteInterval = 30,
  placeholder = "Select date & time",
  triggerClassName,
}: EventDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const selectingTimeRef = useRef(false);

  const parsedDate = useMemo(
    () => parseDateTimeValue(dateValue, timeValue),
    [dateValue, timeValue],
  );

  const selectedDates = useMemo(
    () => (parsedDate ? [parsedDate] : []),
    [parsedDate],
  );

  const [offsetDate, setOffsetDate] = useState<Date>(
    () => parsedDate ?? minDate ?? new Date(),
  );

  useEffect(() => {
    if (!parsedDate) {
      return;
    }
    setOffsetDate(parsedDate);
  }, [parsedDate]);

  const handleDatesChange = useCallback(
    (dates: Date[]) => {
      const selectingTime = selectingTimeRef.current;
      selectingTimeRef.current = false;

      const next = dates.at(-1);

      if (!next) {
        onChange("", "");
        return;
      }

      const nextDateValue = formatDateForInput(next);

      if (selectingTime) {
        onChange(nextDateValue, formatTimeForInput(next));
        return;
      }

      onChange(nextDateValue, timeValue);
    },
    [onChange, timeValue],
  );

  const { data, propGetters } = useDatePicker({
    selectedDates,
    onDatesChange: handleDatesChange,
    offsetDate,
    onOffsetChange: setOffsetDate,
    dates: {
      mode: "single",
      minDate,
    },
    calendar: {
      offsets: [0],
    },
    locale: {
      locale: "en-US",
      weekday: "short",
      monthName: "long",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
    time: {
      interval: minuteInterval,
      useLocales: true,
    },
  });

  const { calendars, weekDays, time } = data;
  const { addOffset, subtractOffset, dayButton, setOffset, timeButton } =
    propGetters;

  const calendar = calendars[0];
  const open = isOpen;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const displayDate = parsedDate
    ? parsedDate.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const displayTime = timeValue
    ? parsedDate?.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const timeSelectionExists = Boolean(timeValue);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
      >
        {label}
      </label>
      <div className="relative">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          onClick={toggleOpen}
          className={clsx(
            "flex w-full items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white/90 px-4 py-3 text-left text-sm text-neutral-800 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-amber-200 dark:border-white/10 dark:bg-white/5 dark:text-neutral-100",
            triggerClassName,
          )}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
        >
          <span>
            {displayDate ? (
              <>
                <span>{displayDate}</span>
                {displayTime ? (
                  <span className="ml-1 text-neutral-500 dark:text-neutral-400">
                    · {displayTime}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="text-neutral-400 dark:text-neutral-500">
                {placeholder}
              </span>
            )}
          </span>
          <svg
            className={clsx(
              "h-4 w-4 text-neutral-500 transition-transform",
              open && "rotate-180",
            )}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open ? (
          <div
            ref={popoverRef}
            id={`${id}-panel`}
            role="dialog"
            aria-label={`${label} picker`}
            className="absolute left-0 right-0 z-20 mt-2 rounded-3xl border border-neutral-200/70 bg-white/95 p-6 shadow-2xl shadow-amber-500/10 backdrop-blur dark:border-white/10 dark:bg-neutral-900/95"
          >
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex-1">
                <div className="mb-4 flex items-center justify-between">
                  <button
                    type="button"
                    className="rounded-full p-2 text-sm text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    {...subtractOffset({ months: 1 })}
                  >
                    <span className="sr-only">Previous month</span>
                    <FaArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-100">
                    {calendar ? `${calendar.month} ${calendar.year}` : ""}
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-2 text-sm text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    {...addOffset({ months: 1 })}
                  >
                    <span className="sr-only">Next month</span>
                    <FaArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
                  {weekDays.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className="mt-2 grid grid-cols-7 gap-2">
                  {calendar?.days.map((day) => {
                    const dayProps = dayButton(day);
                    return (
                      <button
                        key={day.$date.toISOString()}
                        type="button"
                        {...dayProps}
                        className={clsx(
                          getDayButtonClasses(day),
                          dayProps.className as string,
                        )}
                      >
                        {day.day}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span>Week starts on Sunday</span>
                  <button
                    type="button"
                    className="font-semibold text-amber-600 transition hover:text-amber-500"
                    {...setOffset(new Date())}
                  >
                    Today
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                  Time
                </p>
                <div className="mt-3 max-h-60 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-2">
                    {time.map((entry: DPTime) => {
                      const timeProps = timeButton(entry, {
                        onClick: () => {
                          selectingTimeRef.current = true;
                        },
                      });
                      const isSelected = timeSelectionExists
                        ? entry.selected
                        : false;
                      return (
                        <button
                          key={`${entry.$date.toISOString()}-${entry.time}`}
                          type="button"
                          {...timeProps}
                          className={clsx(
                            getTimeButtonClasses(isSelected, entry.disabled),
                            timeProps.className as string,
                          )}
                        >
                          {entry.time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-500 hover:text-neutral-700 dark:text-neutral-300"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
