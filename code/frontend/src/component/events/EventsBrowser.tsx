"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  getEvents,
  type EventListResponse,
  type EventResponse,
} from "@/services/events";

import { EventCard } from "./EventCard";

type EventsBrowserProps = {
  events: EventResponse[];
};

const REMOTE_PAGE_SIZE = 9;

export function EventsBrowser({ events }: EventsBrowserProps) {
  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [remoteResult, setRemoteResult] = useState<EventListResponse | null>(
    null,
  );
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const [fetchNonce, setFetchNonce] = useState(0);

  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();

  const filteredEvents = useMemo(() => {
    if (!normalizedQuery) {
      return events;
    }

    return events.filter((event) => {
      const haystack = [
        event.event_name,
        event.event_location ?? "",
        event.description ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [events, query]);

  const hasQuery = Boolean(trimmedQuery);
  const shouldFetchRemote = hasQuery && filteredEvents.length === 0;
  const remoteOffset = pageIndex * REMOTE_PAGE_SIZE;

  useEffect(() => {
    setPageIndex(0);
  }, [normalizedQuery]);

  useEffect(() => {
    if (!shouldFetchRemote) {
      setRemoteResult(null);
      setRemoteError(null);
      setIsRemoteLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function fetchRemoteEvents() {
      setIsRemoteLoading(true);
      setRemoteError(null);
      try {
        const sanitizedFilterTerm = trimmedQuery.replace(/:/g, " ").trim();
        const escapedFilterTerm = sanitizedFilterTerm.replace(
          /[%_\\]/g,
          (char) => `\\${char}`,
        );
        const ilikeValue = `%${escapedFilterTerm}%`;
        const result = await getEvents({
          filters: [`event_name:ilike:${ilikeValue}`],
          offset: remoteOffset,
          limit: REMOTE_PAGE_SIZE,
          signal: controller.signal,
        });

        if (!isMounted) {
          return;
        }

        setRemoteResult(result);
      } catch (error) {
        if (
          !isMounted ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "We ran into an issue while searching for more events.";
        setRemoteError(message);
        setRemoteResult(null);
      } finally {
        if (isMounted) {
          setIsRemoteLoading(false);
        }
      }
    }

    fetchRemoteEvents();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [fetchNonce, remoteOffset, shouldFetchRemote, trimmedQuery]);

  const remoteEvents = remoteResult?.items ?? [];
  const totalRemote = remoteResult?.total ?? 0;
  const totalRemotePages =
    totalRemote > 0 ? Math.ceil(totalRemote / REMOTE_PAGE_SIZE) : 0;
  const currentRemotePage = remoteResult
    ? Math.floor(remoteResult.offset / REMOTE_PAGE_SIZE) + 1
    : pageIndex + 1;

  const eventsToRender = shouldFetchRemote ? remoteEvents : filteredEvents;
  const showEmptyState = !isRemoteLoading && eventsToRender.length === 0;

  const handlePreviousPage = () => {
    setPageIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    if (remoteResult) {
      const maxPageIndex = Math.max(
        Math.ceil(remoteResult.total / REMOTE_PAGE_SIZE) - 1,
        0,
      );
      setPageIndex((prev) => Math.min(prev + 1, maxPageIndex));
      return;
    }
    setPageIndex((prev) => prev + 1);
  };

  const handleRetry = () => {
    setFetchNonce((prev) => prev + 1);
  };

  let resultsContent: ReactNode;

  if (remoteError) {
    resultsContent = (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/70 px-8 py-8 text-center text-rose-900 dark:border-rose-500/30 dark:bg-rose-900/40 dark:text-rose-100">
        <h3 className="text-lg font-semibold">
          We couldn&apos;t fetch more events
        </h3>
        <p className="mt-2 text-sm opacity-80">{remoteError}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
        >
          Try again
        </button>
      </div>
    );
  } else if (isRemoteLoading && shouldFetchRemote) {
    resultsContent = (
      <div className="rounded-3xl border border-neutral-200 bg-white/80 px-8 py-16 text-center shadow-sm dark:border-white/10 dark:bg-neutral-900/60">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Searching our library for &ldquo;{trimmedQuery}&rdquo;&hellip;
        </p>
      </div>
    );
  } else if (showEmptyState) {
    const emptyTitle = hasQuery
      ? `No events match "${trimmedQuery}"`
      : "No events available just yet";
    const emptyDescription = hasQuery
      ? "Try a different search term, or explore our upcoming experiences below."
      : "Check back soon or create your own gathering to kick things off.";

    resultsContent = (
      <div className="rounded-3xl border border-dashed border-amber-300/60 bg-white/70 px-8 py-16 text-center shadow-inner shadow-amber-100/50 dark:border-amber-400/40 dark:bg-neutral-900/60 dark:text-neutral-300">
        <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
          {emptyTitle}
        </h3>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {emptyDescription}
        </p>
      </div>
    );
  } else {
    resultsContent = (
      <>
        {shouldFetchRemote && remoteResult && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/70 px-6 py-4 text-sm text-amber-900 shadow-sm dark:border-amber-300/40 dark:bg-amber-950/50 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">
              Showing {remoteResult.offset + 1}–
              {remoteResult.offset + remoteEvents.length} of {totalRemote}{" "}
              events
            </p>
            {totalRemotePages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={pageIndex === 0 || isRemoteLoading}
                  className="inline-flex items-center justify-center rounded-full border border-amber-400/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900 transition disabled:cursor-not-allowed disabled:border-amber-200/50 disabled:text-amber-300 dark:text-amber-200"
                >
                  Previous
                </button>
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                  Page {currentRemotePage} of {totalRemotePages}
                </span>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={
                    currentRemotePage >= totalRemotePages || isRemoteLoading
                  }
                  className="inline-flex items-center justify-center rounded-full border border-amber-400/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900 transition disabled:cursor-not-allowed disabled:border-amber-200/50 disabled:text-amber-300 dark:text-amber-200"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {eventsToRender.map((event) => (
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

  return (
    <div className="space-y-8">
      <div>
        <label
          htmlFor="event-search"
          className="text-sm font-semibold text-neutral-600 dark:text-neutral-300"
        >
          Search events
        </label>
        <div className="mt-2">
          <div className="relative">
            <input
              id="event-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, location, or keywords..."
              className="w-full rounded-2xl border border-neutral-200 bg-white/80 px-5 py-3 text-sm text-neutral-800 shadow-sm shadow-amber-100/40 transition focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-200/40 dark:border-white/10 dark:bg-neutral-900/70 dark:text-neutral-100 dark:shadow-neutral-900/40 dark:focus:border-amber-400/60 dark:focus:ring-amber-400/20"
              type="search"
              autoComplete="off"
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-medium text-neutral-400 dark:text-neutral-500">
              Ctrl+K
            </span>
          </div>
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            Filter by event name, location, or descriptive keywords to find the
            experience that fits your vibe.
          </p>
        </div>
      </div>

      {resultsContent}
    </div>
  );
}
