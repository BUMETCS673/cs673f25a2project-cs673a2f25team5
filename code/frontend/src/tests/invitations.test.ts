/*

 AI-generated code: 0%

 Human code: 100% (tests: fetchPendingInvitations filters past events and decodes locations)

 Framework-generated code: 0%

*/

import { fetchPendingInvitations } from "@/services/invitations";
import { getAttendees } from "@/services/attendees";
import { getEvents } from "@/services/events";
import { encodeEventLocation } from "@/helpers/locationCodec";

jest.mock("@/services/attendees", () => ({
  getAttendees: jest.fn(),
}));

jest.mock("@/services/events", () => ({
  getEvents: jest.fn(),
}));

const mockGetAttendees = getAttendees as jest.MockedFunction<
  typeof getAttendees
>;
const mockGetEvents = getEvents as jest.MockedFunction<typeof getEvents>;

describe("fetchPendingInvitations", () => {
  const now = new Date("2025-01-01T12:00:00Z").getTime();

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(now);
  });

  afterEach(() => {
    (Date.now as jest.Mock)?.mockRestore?.();
  });

  it("filters out past events and decodes encoded locations", async () => {
    mockGetAttendees.mockResolvedValueOnce({
      items: [
        {
          attendee_id: "a1",
          event_id: "future-event",
          user_id: "user-1",
          status: null,
          created_at: "2024-12-30T00:00:00Z",
          updated_at: "2024-12-30T00:00:00Z",
        },
        {
          attendee_id: "a2",
          event_id: "past-event",
          user_id: "user-1",
          status: null,
          created_at: "2024-12-20T00:00:00Z",
          updated_at: "2024-12-20T00:00:00Z",
        },
      ],
      total: 2,
      offset: 0,
      limit: 50,
    });

    const encodedLocation = encodeEventLocation({
      address: "123 Main St",
      latitude: 1,
      longitude: 2,
    });

    mockGetEvents.mockImplementation(async ({ filters }) => {
      const filter = filters?.[0] ?? "";
      if (filter.includes("future-event")) {
        return {
          items: [
            {
              event_id: "future-event",
              event_name: "Future",
              event_datetime: "2025-01-02T10:00:00Z",
              event_endtime: "2025-01-02T12:00:00Z",
              event_location: encodedLocation,
              description: null,
              picture_url: null,
              capacity: null,
              price_field: 0,
              user_id: "host",
              category_id: "cat",
              created_at: "2024-12-01T00:00:00Z",
              updated_at: "2024-12-01T00:00:00Z",
            },
          ],
          total: 1,
          offset: 0,
          limit: 1,
        };
      }
      if (filter.includes("past-event")) {
        return {
          items: [
            {
              event_id: "past-event",
              event_name: "Past",
              event_datetime: "2024-12-01T10:00:00Z",
              event_endtime: "2024-12-01T12:00:00Z",
              event_location: "raw location",
              description: null,
              picture_url: null,
              capacity: null,
              price_field: 0,
              user_id: "host",
              category_id: "cat",
              created_at: "2024-10-01T00:00:00Z",
              updated_at: "2024-10-01T00:00:00Z",
            },
          ],
          total: 1,
          offset: 0,
          limit: 1,
        };
      }
      return { items: [], total: 0, offset: 0, limit: 1 };
    });

    const result = await fetchPendingInvitations("user-1");

    expect(result).toHaveLength(1);
    expect(result[0]?.eventId).toBe("future-event");
    expect(result[0]?.eventLocation).toBe("123 Main St");
  });
});
