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
  } = useEventsBrowserState(initialResult);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex w-full flex-col gap-4 lg:max-w-[640px] lg:flex-row lg:items-end">
          <div className="w-full lg:max-w-[360px]">
            <EventSearchField
              query={query}
              onQueryChange={(value) => setQuery(value)}
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 lg:max-w-[640px] lg:items-end">
          <MapDiscoveryModalTrigger initialEvents={initialResult.items} />
          <CategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
          />
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
