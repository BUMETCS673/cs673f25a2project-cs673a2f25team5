/*
AI-generated code: 100%

Human code: 0%

Framework-generated code: 0%

*/
import { renderHook, act } from "@testing-library/react";
import { useEventsBrowserState } from "./hooks/useEventsBrowserState";
import * as eventsSvc from "@/services/events";
import { EventListResponse } from "@/services/events";

jest.mock("@/services/events", () => ({
  ...jest.requireActual("@/services/events"),
  getEvents: jest.fn(),
}));
const getEventsMock = jest.mocked(eventsSvc.getEvents);

describe("useEventsBrowserState", () => {
  const initial = {
    items: [
      {
        event_id: "00000000-0000-0000-0000-000000000001",
        event_name: "A",
        event_datetime: "2025-10-01T10:00:00Z",
        event_endtime: "2025-10-01T12:00:00Z",
        event_location: "X",
        description: null,
        picture_url: null,
        capacity: null,
        price_field: null,
        user_id: "00000000-0000-0000-0000-000000000000",
        category_id: "00000000-0000-0000-0000-000000000000",
      },
    ],
    total: 20,
    offset: 0,
    limit: 5,
  } as EventListResponse;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    getEventsMock.mockReset();
  });

  test("initial pagination derived from initial result", () => {
    const { result } = renderHook(() =>
      useEventsBrowserState(initial as EventListResponse),
    );
    expect(result.current.pagination.totalPages).toBe(4);
    expect(result.current.pagination.currentPage).toBe(1);
    expect(result.current.eventsToRender.length).toBe(1);
    expect(result.current.showEmptyState).toBe(false);
  });

  test("next page loads base list", async () => {
    getEventsMock.mockResolvedValue({ ...initial, items: [], offset: 5 });
    const { result } = renderHook(() =>
      useEventsBrowserState(initial as EventListResponse),
    );
    await act(async () => {
      result.current.handleNextPage();
    });
    expect(eventsSvc.getEvents).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 5, limit: 5 }),
    );
  });

  test("remote search triggers when no base matches", async () => {
    getEventsMock.mockResolvedValue({
      ...initial,
      items: [],
      total: 0,
      offset: 0,
    });
    const { result } = renderHook(() =>
      useEventsBrowserState(initial as EventListResponse),
    );
    await act(async () => {
      result.current.setQuery("zzz");
    });
    expect(result.current.shouldFetchRemoteSearch).toBe(true);
  });
});
