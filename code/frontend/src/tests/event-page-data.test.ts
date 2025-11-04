import {
  fetchEventDetailData,
  fetchInitialAttendeeStatus,
} from "@/app/events/[id]/event-page-data";
import type { EventResponse } from "@/types/eventTypes";
import type { AttendeeStatusType } from "@/types/registerTypes";
import type { UserResponse } from "@/types/userTypes";
import { getAttendees } from "@/services/attendees";
import { getEvents } from "@/services/events";
import { getUser } from "@/services/users";

jest.mock("@/services/events", () => ({
  getEvents: jest.fn(),
}));

jest.mock("@/services/attendees", () => ({
  getAttendees: jest.fn(),
}));

jest.mock("@/services/users", () => ({
  getUser: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const { notFound: mockNotFound } = jest.requireMock("next/navigation") as {
  notFound: jest.Mock;
};

const mockGetEvents = getEvents as jest.MockedFunction<typeof getEvents>;
const mockGetAttendees = getAttendees as jest.MockedFunction<
  typeof getAttendees
>;
const mockGetUser = getUser as jest.MockedFunction<typeof getUser>;

const baseEvent: EventResponse = {
  event_id: "11111111-1111-1111-1111-111111111111",
  event_name: "Frontend Guild",
  event_datetime: "2025-10-01T10:00:00Z",
  event_endtime: "2025-10-01T12:00:00Z",
  event_location: "Boston",
  description: "Weekly sync",
  picture_url: null,
  capacity: 25,
  price_field: 0,
  user_id: "22222222-2222-2222-2222-222222222222",
  category_id: "33333333-3333-3333-3333-333333333333",
  created_at: "2025-09-01T00:00:00Z",
  updated_at: "2025-09-05T00:00:00Z",
  attendee_count: 5,
};

const mockHost: UserResponse = {
  user_id: baseEvent.user_id,
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@example.com",
  date_of_birth: "1815-12-10",
  color: "blue",
  created_at: "2025-08-01T00:00:00Z",
  updated_at: "2025-08-01T00:00:00Z",
};

beforeEach(() => {
  jest.resetAllMocks();
  mockNotFound.mockClear();
  mockNotFound.mockImplementation(() => {
    throw new Error("NEXT_NOT_FOUND");
  });
});

describe("fetchEventDetailData", () => {
  it("returns combined event detail data when upstream calls succeed", async () => {
    mockGetEvents.mockResolvedValueOnce({
      items: [baseEvent],
      total: 1,
      offset: 0,
      limit: 1,
    });

    const hostEvent: EventResponse = {
      ...baseEvent,
      event_id: "44444444-4444-4444-4444-444444444444",
      event_name: "Backend Guild",
    };

    mockGetEvents.mockResolvedValueOnce({
      items: [hostEvent],
      total: 1,
      offset: 0,
      limit: 6,
    });

    mockGetAttendees.mockResolvedValueOnce({
      items: [],
      total: 7,
      offset: 0,
      limit: 1,
    });

    mockGetUser.mockResolvedValueOnce(mockHost);

    const result = await fetchEventDetailData(baseEvent.event_id);

    expect(result.event).toBe(baseEvent);
    expect(result.host).toEqual(mockHost);
    expect(result.hostEvents).toEqual([hostEvent]);
    expect(result.attendeeCount).toBe(7);
  });

  it("calls notFound when no event is returned", async () => {
    mockGetEvents.mockResolvedValueOnce({
      items: [],
      total: 0,
      offset: 0,
      limit: 1,
    });

    await expect(fetchEventDetailData(baseEvent.event_id)).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("calls notFound when the events service rejects with a 404", async () => {
    mockGetEvents.mockRejectedValueOnce(
      new Error("Request failed with status 404"),
    );

    await expect(fetchEventDetailData(baseEvent.event_id)).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });
});

describe("fetchInitialAttendeeStatus", () => {
  it("returns null when there is no viewer id", async () => {
    const status = await fetchInitialAttendeeStatus({
      attendeeExternalId: null,
      eventId: baseEvent.event_id,
      isHostUser: false,
    });

    expect(status).toBeNull();
    expect(mockGetAttendees).not.toHaveBeenCalled();
  });

  it("returns null when the viewer is the host", async () => {
    const status = await fetchInitialAttendeeStatus({
      attendeeExternalId: baseEvent.user_id,
      eventId: baseEvent.event_id,
      isHostUser: true,
    });

    expect(status).toBeNull();
    expect(mockGetAttendees).not.toHaveBeenCalled();
  });

  it("returns the attendee status when found", async () => {
    const attendeeStatus: AttendeeStatusType = "Maybe";

    mockGetAttendees.mockResolvedValueOnce({
      items: [
        {
          attendee_id: "55555555-5555-5555-5555-555555555555",
          event_id: baseEvent.event_id,
          user_id: "77777777-7777-7777-7777-777777777777",
          status: attendeeStatus,
          created_at: "2025-09-10T00:00:00Z",
          updated_at: "2025-09-10T00:00:00Z",
        },
      ],
      total: 1,
      offset: 0,
      limit: 1,
    });

    const status = await fetchInitialAttendeeStatus({
      attendeeExternalId: "77777777-7777-7777-7777-777777777777",
      eventId: baseEvent.event_id,
      isHostUser: false,
    });

    expect(status).toBe(attendeeStatus);
  });

  it("returns null when fetching attendees fails", async () => {
    const mute = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetAttendees.mockRejectedValueOnce(new Error("boom"));

    const status = await fetchInitialAttendeeStatus({
      attendeeExternalId: "77777777-7777-7777-7777-777777777777",
      eventId: baseEvent.event_id,
      isHostUser: false,
    });

    expect(status).toBeNull();
    mute.mockRestore();
  });
});
