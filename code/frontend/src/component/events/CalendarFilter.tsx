/*

 AI-generated code: 65% (tool: Codex - GPT-5, parseDateTimeValue, parsedStart, beforeDate, afterDate, betweenStart, betweenEnd, modes, mode state initializer)

 Human code: 35% (functions: CalendarFilter)

 No framework-generated code.

*/

"use client";

import {
  EventDateConditionPicker,
  DateConditionValue,
} from "./EventDateConditionPicker";

type CalendarFilterProps = {
  value: DateConditionValue;
  onChange: (value: DateConditionValue) => void;
};

export function CalendarFilter({ value, onChange }: CalendarFilterProps) {
  return (
    <div className="w-[min(90vw,400px)] p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-lg">
      <EventDateConditionPicker value={value} onChange={onChange} />
    </div>
  );
}
