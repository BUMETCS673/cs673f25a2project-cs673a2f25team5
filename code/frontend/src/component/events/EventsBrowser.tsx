/*

 AI-generated code: 65% (tool: Codex - GPT-5, query, setQuery, trimmedQuery, hasQuery, shouldFetchRemoteSearch, eventsToRender, isRemoteLoading, isBaseLoading, baseError, remoteError, showEmptyState, pagination, handlePreviousPage, handleNextPage, handleBaseRetry, handleRemoteRetry, useEventsBrowserState, initialResult) 
 
 Human code: 35% (functions: EventsBrowser, EventsBrowserProps, useEventsBrowserState) 

 No framework-generated code.

*/

"use client";

import type { EventListResponse } from "@/types/eventTypes";

import { EventSearchField } from "./EventSearchField";
import { EventsResults } from "./EventsResults";
import { useEventsBrowserState } from "./hooks/useEventsBrowserState";
import { MapDiscoveryModalTrigger } from "./MapDiscoveryModal";

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full lg:max-w-[540px]">
          <EventSearchField
            query={query}
            onQueryChange={(value) => setQuery(value)}
          />
        </div>

        <MapDiscoveryModalTrigger initialEvents={initialResult.items} />
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
