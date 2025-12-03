/*

 AI-generated code: 65% (tool: Codex - GPT-5, query, setQuery, trimmedQuery, hasQuery, shouldFetchRemoteSearch, eventsToRender, isRemoteLoading, isBaseLoading, baseError, remoteError, showEmptyState, pagination, handlePreviousPage, handleNextPage, handleBaseRetry, handleRemoteRetry)

 Human code: 35% (functions: EventsBrowser)

 No framework-generated code.

*/

"use client";
import { useState, useMemo } from "react";
import type { EventListResponse } from "@/types/eventTypes";
import { EventSort } from "./EventSort";
import type { CategoryResponse } from "@/types/categoryTypes";
import { EventSearchField } from "./EventSearchField";
import { EventsResults } from "./EventsResults";
import { useEventsBrowserState } from "./hooks/useEventsBrowserState";
import { MapDiscoveryModalTrigger } from "./MapDiscoveryModal";
import { CategoryFilter } from "./CategoryFilter";
import { PriceFilter } from "./PriceFilter";

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

  const sortedEvents = useMemo(() => {
    return [...eventsToRender].sort((a, b) => {
      switch (sort) {
        case "Date":
          const timeA = new Date(a.event_datetime).getTime();
          const timeB = new Date(b.event_datetime).getTime();
          if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0;
          if (Number.isNaN(timeA)) return 1;
          if (Number.isNaN(timeB)) return -1;
          return timeA - timeB;
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
  }, [eventsToRender, sort]);

  return (
    <div className="space-y-8">
      <div>
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
