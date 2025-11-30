/*

 AI-generated code: 0%

 Human code: 100% (tests: createInviteAction, createResolveInviteeAction)

 Framework-generated code: 0%

*/

import {
  createInviteAction,
  createResolveInviteeAction,
} from "@/services/invite-action";
import { createAttendee } from "@/services/attendees";
import { getUsers } from "@/services/users";
import { currentUser } from "@clerk/nextjs/server";

jest.mock("@/services/attendees", () => ({
  createAttendee: jest.fn(),
}));

jest.mock("@/services/users", () => ({
  getUsers: jest.fn(),
}));

jest.mock("@clerk/nextjs/server", () => ({
  currentUser: jest.fn(),
}));

const mockCreateAttendee = createAttendee as jest.MockedFunction<
  typeof createAttendee
>;
const mockGetUsers = getUsers as jest.MockedFunction<typeof getUsers>;
const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;

const HOST_ID = "host-1";
const EVENT_ID = "event-1";

describe("createInviteAction", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    mockCurrentUser.mockResolvedValueOnce(null as never);
    const invite = await createInviteAction({
      eventId: EVENT_ID,
      hostUserId: HOST_ID,
    });
    const result = await invite("test@example.com");
    expect(result.success).toBe(false);
    expect(result.code).toBe("unauthenticated");
  });

  it("rejects non-host users", async () => {
    mockCurrentUser.mockResolvedValueOnce({
      externalId: "someone-else",
    } as never);
    const invite = await createInviteAction({
      eventId: EVENT_ID,
      hostUserId: HOST_ID,
    });
    const result = await invite("test@example.com");
    expect(result.success).toBe(false);
    expect(result.code).toBe("forbidden");
  });

  it("rejects inviting self", async () => {
    mockCurrentUser.mockResolvedValueOnce({ externalId: HOST_ID } as never);
    const invite = await createInviteAction({
      eventId: EVENT_ID,
      hostUserId: HOST_ID,
    });
    const result = await invite(HOST_ID);
    expect(result.success).toBe(false);
    expect(result.code).toBe("self");
  });

  it("invites selected user id", async () => {
    mockCurrentUser.mockResolvedValueOnce({ externalId: HOST_ID } as never);
    mockGetUsers.mockResolvedValueOnce({
      items: [
        {
          user_id: "user-123",
          email: "pick@example.com",
          first_name: "Pick",
          last_name: "Me",
          date_of_birth: "2000-01-01",
          color: null,
          profile_picture_url: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ],
      total: 1,
      offset: 0,
      limit: 1,
    });
    mockCreateAttendee.mockResolvedValueOnce(undefined as never);

    const invite = await createInviteAction({
      eventId: EVENT_ID,
      hostUserId: HOST_ID,
    });
    const result = await invite("pick@example.com", "user-123");

    expect(result.success).toBe(true);
    expect(mockCreateAttendee).toHaveBeenCalledWith({
      event_id: EVENT_ID,
      user_id: "user-123",
      status: null,
    });
  });

  it("returns duplicate code on conflict", async () => {
    mockCurrentUser.mockResolvedValueOnce({ externalId: HOST_ID } as never);
    mockGetUsers.mockResolvedValue({
      items: [
        {
          user_id: "user-123",
          email: "pick@example.com",
          first_name: "Pick",
          last_name: "Me",
          date_of_birth: "2000-01-01",
          color: null,
          profile_picture_url: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ],
      total: 1,
      offset: 0,
      limit: 1,
    });
    mockCreateAttendee.mockRejectedValueOnce(new Error("status 409 conflict"));

    const invite = await createInviteAction({
      eventId: EVENT_ID,
      hostUserId: HOST_ID,
    });
    const result = await invite("pick@example.com");

    expect(result.success).toBe(false);
    expect(result.code).toBe("duplicate");
  });
});

describe("createResolveInviteeAction", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns unauthorized when not signed in", async () => {
    mockCurrentUser.mockResolvedValueOnce(null as never);
    const resolve = await createResolveInviteeAction({ hostUserId: HOST_ID });
    const result = await resolve("test");
    expect(result.success).toBe(false);
    expect(result.code).toBe("unauthenticated");
  });

  it("returns candidates when host is signed in", async () => {
    mockCurrentUser.mockResolvedValueOnce({ externalId: HOST_ID } as never);
    mockGetUsers.mockResolvedValue({
      items: [
        {
          user_id: "user-1",
          email: "one@example.com",
          first_name: "One",
          last_name: "Alpha",
          date_of_birth: "2000-01-01",
          color: null,
          profile_picture_url: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ],
      total: 1,
      offset: 0,
      limit: 1,
    });

    const resolve = await createResolveInviteeAction({ hostUserId: HOST_ID });
    const result = await resolve("one");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.users[0]?.user_id).toBe("user-1");
    }
  });
});
