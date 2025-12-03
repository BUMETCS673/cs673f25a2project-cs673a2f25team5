/*
AI-generated code: 100%

Human code: 0%

Framework-generated code: 0%

*/
import { renderHook, act, waitFor } from "@testing-library/react";
import { useEventsBrowserState } from "../component/events/hooks/useEventsBrowserState";
import { getEvents } from "@/services/events";
import type { EventListResponse } from "@/services/events";

jest.mock("@/services/events", () => {
  const mod = jest.requireActual("@/services/events");
  return {
    ...mod,
    getEvents: jest.fn().mockResolvedValue({
      items: [
        {
          event_id: "remote-1",
          event_name: "Remote Match",
          event_datetime: "2025-10-01T10:00:00Z",
          event_endtime: "2025-10-01T12:00:00Z",
          event_location: "Remote",
          description: null,
          picture_url: null,
          capacity: null,
          price_field: null,
          user_id: "user-1",
          category_id: "category-1",
          created_at: "2025-09-01T00:00:00Z",
          updated_at: "2025-09-01T00:00:00Z",
        },
      ],
      total: 1,
      offset: 0,
      limit: 9,
    } as EventListResponse),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

const base: EventListResponse = {
  items: [
    {
      event_id: "base-1",
      event_name: "A old",
      event_datetime: "2025-10-02T10:00:00Z",
      event_endtime: "2025-10-02T12:00:00Z",
      event_location: "Base",
      description: null,
      picture_url: null,
      capacity: null,
      price_field: 0,
      user_id: "user-2",
      category_id: "category-2",
      created_at: "2025-09-01T00:00:00Z",
      updated_at: "2025-09-01T00:00:00Z",
    },
    {
      event_id: "base-2",
      event_name: "B new",
      event_datetime: "2025-10-01T10:00:00Z",
      event_endtime: "2025-10-01T12:00:00Z",
      event_location: "Base",
      description: null,
      picture_url: null,
      capacity: null,
      price_field: 3000,
      user_id: "user-3",
      category_id: "category-3",
      created_at: "2025-09-01T00:00:00Z",
      updated_at: "2025-09-01T00:00:00Z",
    },
  ],
  total: 2,
  offset: 0,
  limit: 5,
};

test("sorts base items and toggles remote search when no local matches", async () => {
  const { result } = renderHook(() => useEventsBrowserState(base));

  expect(result.current.eventsToRender[0].event_name).toBe("B new");

  act(() => result.current.setQuery("remote"));
  expect(result.current.shouldFetchRemoteSearch).toBe(true);

  await waitFor(() => {
    expect(result.current.isRemoteLoading).toBe(false);
    expect(result.current.eventsToRender[0].event_name).toBe("Remote Match");
  });
});

test("filters events when selecting a category", async () => {
  const { result } = renderHook(() => useEventsBrowserState(base));

  act(() => result.current.handleSelectCategory("category-123"));

  await waitFor(() => {
    expect(getEvents).toHaveBeenCalledWith({
      filters: ["category_id:eq:category-123"],
      offset: 0,
      limit: base.limit,
    });
  });

  await waitFor(() => {
    expect(result.current.eventsToRender[0].event_id).toBe("remote-1");
  });
});

test("filters events locally when selecting a price range without hitting backend", async () => {
  const { result } = renderHook(() => useEventsBrowserState(base));
  jest.mocked(getEvents).mockClear();

  act(() => result.current.handleSelectPriceRange(10, 50));

  expect(getEvents).not.toHaveBeenCalled();
  expect(result.current.eventsToRender).toHaveLength(1);
  expect(result.current.eventsToRender[0].event_id).toBe("base-2");
});
