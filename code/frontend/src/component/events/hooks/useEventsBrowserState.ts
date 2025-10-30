/*

 AI-generated code: 100% (tool: Codex - GPT-5, modified and adapted, functions: sortEventsByDate, PaginationState, EventsBrowserState, useEventsBrowserState, REMOTE_SEARCH_PAGE_SIZE) 

 Human code: 0% 
 
 No framework-generated code.

*/

import { useEffect, useMemo, useRef, useState } from "react";

import {
  getEvents,
  type EventListResponse,
  type EventResponse,
} from "@/services/events";
import { decodeEventLocation } from "@/helpers/locationCodec";

const REMOTE_SEARCH_PAGE_SIZE = 9;

function sortEventsByDate(events: EventResponse[]): EventResponse[] {
  return [...events].sort((a, b) => {
    const startA = new Date(a.event_datetime).getTime();
    const startB = new Date(b.event_datetime).getTime();

    if (Number.isNaN(startA) && Number.isNaN(startB)) {
      return 0;
    }
    if (Number.isNaN(startA)) {
      return 1;
    }
    if (Number.isNaN(startB)) {
      return -1;
    }

    return startA - startB;
  });
}

export type PaginationState = {
  show: boolean;
  rangeStart: number;
  rangeEnd: number;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  disablePrevious: boolean;
  disableNext: boolean;
};

export type EventsBrowserState = {
  query: string;
  setQuery: (value: string) => void;
  trimmedQuery: string;
  hasQuery: boolean;
  shouldFetchRemoteSearch: boolean;
  eventsToRender: EventResponse[];
  isRemoteLoading: boolean;
  isBaseLoading: boolean;
  baseError: string | null;
  remoteError: string | null;
  showEmptyState: boolean;
  pagination: PaginationState;
  handlePreviousPage: () => void;
  handleNextPage: () => void;
  handleBaseRetry: () => void;
  handleRemoteRetry: () => void;
};

export function useEventsBrowserState(
  initialResult: EventListResponse,
): EventsBrowserState {
  const sortedInitialResult = useMemo(
    () => ({
      ...initialResult,
      items: sortEventsByDate(initialResult.items),
    }),
    [initialResult],
  );

  const initialPageSize = sortedInitialResult.limit ?? 5;
  const initialPageIndex = Math.floor(
    sortedInitialResult.offset / Math.max(initialPageSize, 1),
  );

  const baseCacheRef = useRef<Map<number, EventListResponse>>(
    new Map([[initialPageIndex, sortedInitialResult]]),
  );
  const baseControllerRef = useRef<AbortController | null>(null);

  const [baseResult, setBaseResult] = useState(sortedInitialResult);
  const [pageIndex, setPageIndex] = useState(initialPageIndex);
  const [isBaseLoading, setIsBaseLoading] = useState(false);
  const [baseError, setBaseError] = useState<string | null>(null);
  const [pendingBaseIndex, setPendingBaseIndex] = useState<number | null>(null);

  useEffect(() => {
    baseCacheRef.current = new Map([[initialPageIndex, sortedInitialResult]]);
    setBaseResult(sortedInitialResult);
    setPageIndex(initialPageIndex);
    setBaseError(null);
    setIsBaseLoading(false);
    setPendingBaseIndex(null);
  }, [initialPageIndex, sortedInitialResult]);

  useEffect(
    () => () => {
      baseControllerRef.current?.abort();
    },
    [],
  );

  const basePageSize = baseResult.limit ?? initialPageSize;
  const currentBasePageIndex = Math.floor(
    baseResult.offset / Math.max(basePageSize, 1),
  );

  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();

  const baseEvents = baseResult.items;
  const filteredBaseEvents = useMemo(() => {
    if (!normalizedQuery) {
      return baseEvents;
    }

    return baseEvents.filter((event) => {
      const decodedLocation = decodeEventLocation(event.event_location);
      const haystack = [
        event.event_name,
        decodedLocation?.address ?? "",
        event.description ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [baseEvents, normalizedQuery]);

  const hasQuery = Boolean(trimmedQuery);
  const shouldFetchRemoteSearch = hasQuery && filteredBaseEvents.length === 0;

  const [remoteResult, setRemoteResult] = useState<EventListResponse | null>(
    null,
  );
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const [remoteFetchNonce, setRemoteFetchNonce] = useState(0);

  const remoteOffset = pageIndex * REMOTE_SEARCH_PAGE_SIZE;

  useEffect(() => {
    setPageIndex(0);
  }, [normalizedQuery]);

  useEffect(() => {
    if (!shouldFetchRemoteSearch) {
      baseControllerRef.current?.abort();
      setRemoteResult(null);
      setRemoteError(null);
      setIsRemoteLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    setIsRemoteLoading(true);
    setRemoteError(null);

    async function fetchRemoteEvents() {
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
          limit: REMOTE_SEARCH_PAGE_SIZE,
          signal: controller.signal,
        });

        if (!isMounted) {
          return;
        }

        setRemoteResult({
          ...result,
          items: sortEventsByDate(result.items),
        });
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
  }, [remoteFetchNonce, remoteOffset, shouldFetchRemoteSearch, trimmedQuery]);

  const loadBasePage = async (nextIndex: number) => {
    const pageSize = baseResult.limit ?? initialPageSize;

    if (pageSize <= 0) {
      return;
    }

    if (baseCacheRef.current.has(nextIndex)) {
      const cached = baseCacheRef.current.get(nextIndex)!;
      setBaseResult(cached);
      setPageIndex(nextIndex);
      setBaseError(null);
      setIsBaseLoading(false);
      setPendingBaseIndex(null);
      return;
    }

    baseControllerRef.current?.abort();

    const controller = new AbortController();
    baseControllerRef.current = controller;

    setIsBaseLoading(true);
    setBaseError(null);
    setPendingBaseIndex(nextIndex);

    try {
      const result = await getEvents({
        offset: nextIndex * pageSize,
        limit: pageSize,
        signal: controller.signal,
      });

      const sortedResult = {
        ...result,
        items: sortEventsByDate(result.items),
      };

      baseCacheRef.current.set(nextIndex, sortedResult);
      setBaseResult(sortedResult);
      setPageIndex(nextIndex);
      setPendingBaseIndex(null);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "We ran into an issue while loading events.";
      setBaseError(message);
    } finally {
      if (baseControllerRef.current === controller) {
        baseControllerRef.current = null;
      }
      setIsBaseLoading(false);
    }
  };

  const handleBaseRetry = () => {
    const targetIndex =
      pendingBaseIndex ?? Math.floor(baseResult.offset / basePageSize);
    void loadBasePage(targetIndex);
  };

  const handlePreviousPage = () => {
    if (shouldFetchRemoteSearch) {
      setPageIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    const previousIndex = Math.max(currentBasePageIndex - 1, 0);
    if (previousIndex === currentBasePageIndex) {
      return;
    }

    void loadBasePage(previousIndex);
  };

  const handleNextPage = () => {
    if (shouldFetchRemoteSearch) {
      if (remoteResult) {
        const maxPageIndex = Math.max(
          Math.ceil(remoteResult.total / REMOTE_SEARCH_PAGE_SIZE) - 1,
          0,
        );
        setPageIndex((prev) => Math.min(prev + 1, maxPageIndex));
      } else {
        setPageIndex((prev) => prev + 1);
      }
      return;
    }

    if (baseResult.total === 0) {
      return;
    }

    const maxPageIndex = Math.max(
      Math.ceil(baseResult.total / basePageSize) - 1,
      0,
    );
    const nextIndex = Math.min(currentBasePageIndex + 1, maxPageIndex);

    if (nextIndex === currentBasePageIndex) {
      return;
    }

    void loadBasePage(nextIndex);
  };

  const handleRemoteRetry = () => {
    setRemoteFetchNonce((prev) => prev + 1);
  };

  const totalRemote = remoteResult?.total ?? 0;
  const remoteEvents = remoteResult?.items ?? [];
  const totalRemotePages =
    totalRemote > 0 ? Math.ceil(totalRemote / REMOTE_SEARCH_PAGE_SIZE) : 0;
  const currentRemotePage = remoteResult
    ? Math.floor(remoteResult.offset / REMOTE_SEARCH_PAGE_SIZE) + 1
    : pageIndex + 1;

  const baseTotal = baseResult.total;
  const totalBasePages =
    baseTotal > 0 ? Math.ceil(baseTotal / basePageSize) : 0;
  const currentBasePage = baseTotal > 0 ? currentBasePageIndex + 1 : 0;
  const baseStart = baseTotal > 0 ? baseResult.offset + 1 : 0;
  const baseEnd = baseResult.offset + baseEvents.length;

  const eventsToRender = shouldFetchRemoteSearch
    ? remoteEvents
    : filteredBaseEvents;

  const showEmptyState =
    !isRemoteLoading &&
    !isBaseLoading &&
    !remoteError &&
    !baseError &&
    eventsToRender.length === 0;

  const isRemoteResult = shouldFetchRemoteSearch && Boolean(remoteResult);

  const pagination: PaginationState = {
    show: false,
    rangeStart: 0,
    rangeEnd: 0,
    totalCount: 0,
    currentPage: 0,
    totalPages: 0,
    disablePrevious: true,
    disableNext: true,
  };

  if (isRemoteResult && remoteResult) {
    pagination.show = totalRemotePages > 1;
    pagination.rangeStart = remoteResult.offset + 1;
    pagination.rangeEnd = remoteResult.offset + remoteEvents.length;
    pagination.totalCount = totalRemote;
    pagination.currentPage = currentRemotePage;
    pagination.totalPages = totalRemotePages;
    pagination.disablePrevious = pageIndex === 0 || isRemoteLoading;
    pagination.disableNext =
      currentRemotePage >= totalRemotePages || isRemoteLoading;
  } else if (!shouldFetchRemoteSearch) {
    pagination.show = totalBasePages > 1;
    pagination.rangeStart = baseStart;
    pagination.rangeEnd = baseEnd;
    pagination.totalCount = baseTotal;
    pagination.currentPage = currentBasePage;
    pagination.totalPages = totalBasePages;
    pagination.disablePrevious =
      currentBasePage <= 1 || isBaseLoading || baseTotal === 0;
    pagination.disableNext =
      currentBasePage >= totalBasePages || isBaseLoading || baseTotal === 0;
  }

  return {
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
  };
}
