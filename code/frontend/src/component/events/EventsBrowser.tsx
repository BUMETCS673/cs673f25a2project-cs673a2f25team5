/*

AI-generated code: 65% (functions: filteredEvents calculation, sortedEvents calculation, EventDateConditionPicker integration, responsive popover styling, state management for calendar and sort)
 AI-generated code: 65% (tool: Codex - GPT-5, query, setQuery, trimmedQuery, hasQuery, shouldFetchRemoteSearch, eventsToRender, isRemoteLoading, isBaseLoading, baseError, remoteError, showEmptyState, pagination, handlePreviousPage, handleNextPage, handleBaseRetry, handleRemoteRetry)

Human code: 35% (event browser logic: search field, map modal trigger, EventsResults rendering, pagination handling, Tailwind layout structure)

 No framework-generated code.
*/

"use client";

import { useState, useMemo } from "react";
import type { EventListResponse } from "@/types/eventTypes";
import { FaCalendarDays } from "react-icons/fa6";
import { EventDateConditionPicker } from "./EventDateConditionPicker";
import type { DateConditionValue } from "./EventDateConditionPicker";
import type { CategoryResponse } from "@/types/categoryTypes";
import { EventSearchField } from "./EventSearchField";
import { EventsResults } from "./EventsResults";
import { useEventsBrowserState } from "./hooks/useEventsBrowserState";
import { MapDiscoveryModalTrigger } from "./MapDiscoveryModal";
import { CategoryFilter } from "./CategoryFilter";
import { PriceFilter } from "./PriceFilter";
import { EventSort } from "./EventSort";

type EventsBrowserProps = {
  initialResult: EventListResponse;
  categories: CategoryResponse[];
};

export function EventsBrowser({
  initialResult,
  categories,
}: EventsBrowserProps) {
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
    selectedCategoryId,
    handleSelectCategory,
    selectedMinPrice,
    selectedMaxPrice,
    handleSelectPriceRange,
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
        case "Date": {
          const timeA = new Date(a.event_datetime).getTime();
          const timeB = new Date(b.event_datetime).getTime();
          if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0;
          if (Number.isNaN(timeA)) return 1;
          if (Number.isNaN(timeB)) return -1;
          return timeA - timeB;
        }
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

        <EventSort value={sort} onChange={setSort} />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid w-full grid-cols-1 gap-4 lg:max-w-3xl lg:grid-cols-1 flex-col">
          <div className="flex gap-4">
            <EventSearchField
              query={query}
              onQueryChange={(value) => setQuery(value)}
            />
          </div>
          <div className="flex gap-4 items-center justify-end">
            <CategoryFilter
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
            />
            <PriceFilter
              selectedMinPrice={selectedMinPrice}
              selectedMaxPrice={selectedMaxPrice}
              onSelectPriceRange={handleSelectPriceRange}
            />
            <MapDiscoveryModalTrigger initialEvents={initialResult.items} />
          </div>
        </div>
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
