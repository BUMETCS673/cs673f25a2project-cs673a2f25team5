/*

 AI-generated code: 65% (tool: Codex - GPT-5, query, setQuery, trimmedQuery, hasQuery, shouldFetchRemoteSearch, eventsToRender, isRemoteLoading, isBaseLoading, baseError, remoteError, showEmptyState, pagination, handlePreviousPage, handleNextPage, handleBaseRetry, handleRemoteRetry, useEventsBrowserState, initialResult) 
 
 Human code: 35% (functions: EventsBrowser, EventsBrowserProps, useEventsBrowserState) 

 No framework-generated code.

*/

"use client";

import type { EventListResponse } from "@/types/eventTypes";

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

  return (
    <div className="space-y-8">
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
        events={eventsToRender}
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
