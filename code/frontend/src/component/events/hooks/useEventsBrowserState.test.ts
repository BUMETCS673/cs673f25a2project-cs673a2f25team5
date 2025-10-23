import { renderHook, act, waitFor } from "@testing-library/react";
import { useEventsBrowserState } from "./useEventsBrowserState";
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
      price_field: null,
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
      price_field: null,
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
