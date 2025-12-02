/*

AI-generated code: 65% (functions: filteredEvents calculation, sortedEvents calculation, EventDateConditionPicker integration, responsive popover styling, state management for calendar and sort)

Human code: 35% (event browser logic: search field, map modal trigger, EventsResults rendering, pagination handling, Tailwind layout structure)

No framework-generated code.

*/

"use client";

import { useState, useMemo } from "react";
import type { EventListResponse } from "@/types/eventTypes";
import { EventFilter } from "@/component/events/EventFilter";
import { EventSearchField } from "./EventSearchField";
import { EventsResults } from "./EventsResults";
import { useEventsBrowserState } from "./hooks/useEventsBrowserState";
import { MapDiscoveryModalTrigger } from "./MapDiscoveryModal";
import { FaCalendarDays } from "react-icons/fa6";
import {
  EventDateConditionPicker,
  DateConditionValue,
} from "./EventDateConditionPicker";

type EventsBrowserProps = {
  initialResult: EventListResponse;
};

export function EventsBrowser({ initialResult }: EventsBrowserProps) {
  const {
    query,
    setQuery,
    trimmedQuery,
    hasQuery,
    shouldFetchRemoteSearch,
    eventsToRender,
    isRemoteLoading,
    isBaseLoading,
    baseError,
    remoteError,
    showEmptyState,
    pagination,
    handlePreviousPage,
    handleNextPage,
    handleBaseRetry,
    handleRemoteRetry,
  } = useEventsBrowserState(initialResult);

  const [sort, setSort] = useState("Date");
  const [calendarValue, setCalendarValue] = useState<DateConditionValue | null>(
    null,
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    if (!calendarValue) return eventsToRender;

    return eventsToRender.filter((event) => {
      const eventDate = new Date(event.event_datetime).getTime();
      switch (calendarValue.type) {
        case "before":
          return eventDate <= new Date(calendarValue.date).getTime();
        case "after":
          return eventDate >= new Date(calendarValue.date).getTime();
        case "between":
          const start = new Date(calendarValue.start).getTime();
          const end = new Date(calendarValue.end).getTime();
          return eventDate >= start && eventDate <= end;
        default:
          return true;
      }
    });
  }, [eventsToRender, calendarValue]);

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      switch (sort) {
        case "Date":
          return (
            new Date(a.event_datetime).getTime() -
            new Date(b.event_datetime).getTime()
          );
        case "Distance":
          return a.distance - b.distance;
        case "Price":
          return (a.price_field ?? 0) - (b.price_field ?? 0);
        case "Capacity":
          return (a.capacity ?? 0) - (b.capacity ?? 0);
        case "A to Z":
          return a.event_name.localeCompare(b.event_name);
        case "Z to A":
          return b.event_name.localeCompare(a.event_name);
        default:
          return 0;
      }
    });
  }, [filteredEvents, sort]);

  return (
    <div className="space-y-8 relative">
      <div className="flex justify-end items-center gap-2">
        <div className="relative">
          <button
            type="button"
            className="p-2 rounded-xl text-amber-300 cursor-pointer"
            onClick={() => setIsCalendarOpen((prev) => !prev)}
          >
            <FaCalendarDays className="h-6 w-6" />
          </button>

          {isCalendarOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-[min(90vw,400px)] lg:w-[min(90vw,800px)]">
              <EventDateConditionPicker
                value={calendarValue}
                onChange={setCalendarValue}
              />
            </div>
          )}
        </div>

        <EventFilter value={sort} onChange={setSort} />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full lg:max-w-[540px]">
          <EventSearchField query={query} onQueryChange={setQuery} />
        </div>

        <MapDiscoveryModalTrigger initialEvents={initialResult.items} />
      </div>

      <EventsResults
        events={sortedEvents}
        hasQuery={hasQuery}
        trimmedQuery={trimmedQuery}
        shouldFetchRemoteSearch={shouldFetchRemoteSearch}
        showEmptyState={showEmptyState}
        remoteError={remoteError}
        baseError={baseError}
        isRemoteLoading={isRemoteLoading}
        isBaseLoading={isBaseLoading}
        pagination={pagination}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        onRetryBase={handleBaseRetry}
        onRetryRemote={handleRemoteRetry}
      />
    </div>
  );
}
