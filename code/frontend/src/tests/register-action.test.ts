import {
  createRegisterAction,
  HOST_REGISTRATION_MESSAGE,
} from "@/services/register-action";
import {
  SUCCESS_MESSAGE_BY_STATUS,
  type AttendeeStatus,
} from "@/types/registerTypes";
import {
  createAttendee,
  getAttendees,
  patchAttendees,
} from "@/services/attendees";
import { currentUser } from "@clerk/nextjs/server";

jest.mock("@/services/attendees", () => ({
  createAttendee: jest.fn(),
  getAttendees: jest.fn(),
  patchAttendees: jest.fn(),
}));

jest.mock("@clerk/nextjs/server", () => ({
  currentUser: jest.fn(),
}));

const mockCreateAttendee = createAttendee as jest.MockedFunction<
  typeof createAttendee
>;
const mockGetAttendees = getAttendees as jest.MockedFunction<
  typeof getAttendees
>;
const mockPatchAttendees = patchAttendees as jest.MockedFunction<
  typeof patchAttendees
>;
const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;

beforeEach(() => {
  jest.resetAllMocks();
});

const HOST_ID = "host-123";
const EVENT_ID = "11111111-1111-1111-1111-111111111111";
const VIEWER_ID = "88888888-8888-8888-8888-888888888888";

const baseAction = () =>
  createRegisterAction({
    hostMessage: HOST_REGISTRATION_MESSAGE,
    hostUserId: HOST_ID,
    successMessages: SUCCESS_MESSAGE_BY_STATUS,
  });

const attendeeFactory = (
  overrides: Partial<{
    attendee_id: string;
    event_id: string;
    user_id: string;
    status: AttendeeStatus;
  }> = {},
) => ({
  attendee_id: "55555555-5555-5555-5555-555555555555",
  event_id: EVENT_ID,
  user_id: VIEWER_ID,
  status: "Maybe" as AttendeeStatus,
  created_at: "2025-09-10T00:00:00Z",
  updated_at: "2025-09-10T00:00:00Z",
  ...overrides,
});

describe("createRegisterAction", () => {
  it("returns an unauthenticated error when there is no current user", async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const onRegister = baseAction();

    const result = await onRegister(EVENT_ID, "RSVPed");

    expect(result.success).toBe(false);
    expect(result.code).toBe("unauthenticated");
    expect(mockCreateAttendee).not.toHaveBeenCalled();
  });

  it("returns a host error when the viewer is the event host", async () => {
    mockCurrentUser.mockResolvedValueOnce({
      externalId: HOST_ID,
    } as never);

    const onRegister = baseAction();
    const result = await onRegister(EVENT_ID, "RSVPed");

    expect(result.success).toBe(false);
    expect(result.code).toBe("host");
    expect(result.message).toBe(HOST_REGISTRATION_MESSAGE);
    expect(mockCreateAttendee).not.toHaveBeenCalled();
  });

  it("leads to a success response when the attendee is created", async () => {
    mockCurrentUser.mockResolvedValueOnce({
      externalId: VIEWER_ID,
    } as never);
    mockCreateAttendee.mockResolvedValueOnce(undefined as never);

    const onRegister = baseAction();
    const result = await onRegister(EVENT_ID, "RSVPed");

    expect(mockCreateAttendee).toHaveBeenCalledWith({
      event_id: EVENT_ID,
      user_id: VIEWER_ID,
      status: "RSVPed",
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe("RSVPed");
    expect(result.message).toBe(SUCCESS_MESSAGE_BY_STATUS.RSVPed);
  });

  it("returns success without patching when the status already matches", async () => {
    mockCurrentUser.mockResolvedValueOnce({
      externalId: VIEWER_ID,
    } as never);
    mockCreateAttendee.mockRejectedValueOnce(new Error("status 409 conflict"));
    mockGetAttendees.mockResolvedValueOnce({
      items: [
        attendeeFactory({
          attendee_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          status: "Maybe",
        }),
      ],
      total: 1,
      offset: 0,
      limit: 1,
    });

    const onRegister = baseAction();
    const result = await onRegister(EVENT_ID, "Maybe");

    expect(result.success).toBe(true);
    expect(result.status).toBe("Maybe");
    expect(result.message).toMatch(/already registered with this status/i);
    expect(mockPatchAttendees).not.toHaveBeenCalled();
  });

  it("patches the attendee when the status changes", async () => {
    mockCurrentUser.mockResolvedValueOnce({
      externalId: VIEWER_ID,
    } as never);
    mockCreateAttendee.mockRejectedValueOnce(new Error("status 409 conflict"));
    mockGetAttendees.mockResolvedValueOnce({
      items: [
        attendeeFactory({
          attendee_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          status: "Maybe",
        }),
      ],
      total: 1,
      offset: 0,
      limit: 1,
    });
    mockPatchAttendees.mockResolvedValueOnce({
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb": {
        status: "RSVPed",
      },
    });

    const onRegister = baseAction();
    const result = await onRegister(EVENT_ID, "RSVPed");

    expect(mockPatchAttendees).toHaveBeenCalledWith({
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb": {
        op: "replace",
        path: "/status",
        value: "RSVPed",
      },
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe("RSVPed");
    expect(result.message).toBe(SUCCESS_MESSAGE_BY_STATUS.RSVPed);
  });

  it("returns an unknown error when patching fails", async () => {
    const mute = jest.spyOn(console, "error").mockImplementation(() => {});
    mockCurrentUser.mockResolvedValueOnce({
      externalId: VIEWER_ID,
    } as never);
    mockCreateAttendee.mockRejectedValueOnce(new Error("status 409 conflict"));
    mockGetAttendees.mockResolvedValueOnce({
      items: [
        attendeeFactory({
          attendee_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
          status: "Maybe",
        }),
      ],
      total: 1,
      offset: 0,
      limit: 1,
    });
    mockPatchAttendees.mockRejectedValueOnce(new Error("patch failed"));

    const onRegister = baseAction();
    const result = await onRegister(EVENT_ID, "RSVPed");

    expect(result.success).toBe(false);
    expect(result.code).toBe("unknown");
    expect(result.status).toBe("Maybe");
    expect(result.message).toMatch(
      /couldn't update your registration right now/i,
    );
    mute.mockRestore();
  });
});
