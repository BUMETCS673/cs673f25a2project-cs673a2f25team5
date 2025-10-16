/*
 AI-generated code:  30% (tool: Codex - GPT-5, dateFormatter, formatDateRange) 

 Human code: 70% (functions: dateFormatter, formatDateRange, EventCard, EventCardProps) 

 No framework-generated code.

*/
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

import type { EventResponse } from "@/services/events";

type EventCardProps = {
  event: EventResponse;
  href: string;
} & ComponentPropsWithoutRef<"a">;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateRange(event: EventResponse) {
  const start = new Date(event.event_datetime);
  const end = event.event_endtime ? new Date(event.event_endtime) : null;

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const startLabel = dateFormatter.format(start);

  if (!end || Number.isNaN(end.getTime())) {
    return startLabel;
  }

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const endLabel = sameDay
    ? new Intl.DateTimeFormat("en-US", { timeStyle: "short" }).format(end)
    : dateFormatter.format(end);

  return `${startLabel} – ${endLabel}`;
}

export function EventCard({
  event,
  href,
  className = "",
  ...rest
}: EventCardProps) {
  const dateLabel = formatDateRange(event);

  return (
    <Link
      href={href}
      className={`group block h-full rounded-3xl border border-neutral-200/60 bg-white/80 shadow-lg shadow-amber-100/30 transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-amber-200/50 focus-visible:-translate-y-1 focus-visible:border-amber-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/50 dark:border-white/10 dark:bg-neutral-900/70 dark:shadow-neutral-900/40 dark:hover:border-amber-400/70 ${className}`}
      {...rest}
    >
      <article className="flex h-full flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold text-neutral-900 transition group-hover:text-amber-500 dark:text-neutral-100">
            {event.event_name}
          </h3>
          {event.capacity ? (
            <span className="rounded-full border border-amber-300/60 px-3 py-1 text-xs font-medium text-amber-600 dark:border-amber-400/40 dark:text-amber-300">
              {event.capacity} seats
            </span>
          ) : null}
        </div>

        {dateLabel ? (
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {dateLabel}
          </p>
        ) : null}

        <p className="line-clamp-3 text-sm text-neutral-600 dark:text-neutral-400">
          {event.description ?? "No additional details yet. Check back soon!"}
        </p>

        <div className="mt-auto flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-2">
            <svg
              aria-hidden="true"
              className="h-4 w-4 text-amber-500 transition group-hover:text-amber-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {event.event_location ?? "Location TBA"}
          </span>
          <span className="font-medium text-amber-600 transition group-hover:text-amber-500 dark:text-amber-300">
            View details &gt;
          </span>
        </div>
      </article>
    </Link>
  );
}
