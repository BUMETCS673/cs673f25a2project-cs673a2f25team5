import type { EventResponse } from "@/services/events";

import { EventCard } from "./EventCard";
import { EventsPaginationBanner } from "./EventsPaginationBanner";
import type { PaginationState } from "./hooks/useEventsBrowserState";

type EventsResultsProps = {
  events: EventResponse[];
  hasQuery: boolean;
  trimmedQuery: string;
  shouldFetchRemoteSearch: boolean;
  showEmptyState: boolean;
  remoteError: string | null;
  baseError: string | null;
  isRemoteLoading: boolean;
  isBaseLoading: boolean;
  pagination: PaginationState;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onRetryBase: () => void;
  onRetryRemote: () => void;
};

export function EventsResults({
  events,
  hasQuery,
  trimmedQuery,
  shouldFetchRemoteSearch,
  showEmptyState,
  remoteError,
  baseError,
  isRemoteLoading,
  isBaseLoading,
  pagination,
  onPreviousPage,
  onNextPage,
  onRetryBase,
  onRetryRemote,
}: EventsResultsProps) {
  if (shouldFetchRemoteSearch && remoteError) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/70 px-8 py-8 text-center text-rose-900 dark:border-rose-500/30 dark:bg-rose-900/40 dark:text-rose-100">
        <h3 className="text-lg font-semibold">
          We couldn&apos;t fetch more events
        </h3>
        <p className="mt-2 text-sm opacity-80">{remoteError}</p>
        <button
          type="button"
          onClick={onRetryRemote}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
        >
          Try again
        </button>
      </div>
    );
  }

  if (shouldFetchRemoteSearch && isRemoteLoading) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white/80 px-8 py-16 text-center shadow-sm dark:border-white/10 dark:bg-neutral-900/60">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Searching our library for &ldquo;{trimmedQuery}&rdquo;&hellip;
        </p>
      </div>
    );
  }

  if (!shouldFetchRemoteSearch && baseError) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50/70 px-8 py-8 text-center text-amber-900 dark:border-amber-300/40 dark:bg-amber-950/50 dark:text-amber-200">
        <h3 className="text-lg font-semibold">
          We couldn&apos;t load more events
        </h3>
        <p className="mt-2 text-sm opacity-80">{baseError}</p>
        <button
          type="button"
          onClick={onRetryBase}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!shouldFetchRemoteSearch && isBaseLoading && events.length === 0) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white/80 px-8 py-16 text-center shadow-sm dark:border-white/10 dark:bg-neutral-900/60">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Loading events&hellip;
        </p>
      </div>
    );
  }

  if (showEmptyState) {
    const emptyTitle = hasQuery
      ? `No events match "${trimmedQuery}"`
      : "No events available just yet";
    const emptyDescription = hasQuery
      ? "Try a different search term, or explore our upcoming experiences below."
      : "Check back soon or create your own gathering to kick things off.";

    return (
      <div className="rounded-3xl border border-dashed border-amber-300/60 bg-white/70 px-8 py-16 text-center shadow-inner shadow-amber-100/50 dark:border-amber-400/40 dark:bg-neutral-900/60 dark:text-neutral-300">
        <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
          {emptyTitle}
        </h3>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <>
      {pagination.show && (
        <EventsPaginationBanner
          rangeStart={pagination.rangeStart}
          rangeEnd={pagination.rangeEnd}
          totalCount={pagination.totalCount}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          disablePrevious={pagination.disablePrevious}
          disableNext={pagination.disableNext}
          onPrevious={onPreviousPage}
          onNext={onNextPage}
        />
      )}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <EventCard
            key={event.event_id}
            event={event}
            href={`/events/${event.event_id}`}
          />
        ))}
      </div>
    </>
  );
}
