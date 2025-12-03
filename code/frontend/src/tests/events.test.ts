/*

AI-generated code: 80%

Human code: 20%

Framework-generated code: 0%

*/

import { getEvents, createEvent, EventCreatePayload } from "@/services/events";
import { API_BASE_URL } from "@/services/config";
import { auth } from "@clerk/nextjs/server";

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;

beforeEach(() => {
  jest.resetAllMocks();
  mockAuth.mockResolvedValue({
    getToken: jest.fn().mockResolvedValue("test-token"),
  } as never);
});

test("getEvents builds query string correctly and parses response", async () => {
  const mute = jest.spyOn(console, "log").mockImplementation(() => {});
  const json = jest.fn().mockResolvedValue({
    items: [],
    total: 0,
    offset: 0,
    limit: 10,
  });

  (globalThis as unknown as { fetch: jest.Mock }).fetch = jest
    .fn()
    .mockResolvedValue({
      ok: true,
      status: 200,
      json,
    } as unknown as Response);

  const res = await getEvents({
    filters: ["event_name:ilike:%rock%"],
    offset: 20,
    limit: 10,
  });

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining(
      new URL(
        "/events?filter_expression=event_name%3Ailike%3A%25rock%25&offset=20&limit=10",
        API_BASE_URL,
      ).toString(),
    ),
    expect.objectContaining({
      method: "GET",
      headers: expect.objectContaining({
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      }),
    }),
  );
  expect(res.total).toBe(0);
  mute.mockRestore();
});

test("createEvent posts payload and returns parsed event", async () => {
  const payload = {
    event_name: "Show",
    event_datetime: "2025-10-01T10:00:00Z",
    event_endtime: "2025-10-01T12:00:00Z",
    event_location: "X",
    description: null,
    picture_url: null,
    capacity: 10,
    price_field: 0,
    user_id: "00000000-0000-0000-0000-000000000000",
    category_id: "00000000-0000-0000-0000-000000000000",
  };

  const json = jest.fn().mockResolvedValue({
    ...payload,
    event_id: "00000000-0000-0000-0000-000000000000",
  });

  (globalThis as unknown as { fetch: jest.Mock }).fetch = jest
    .fn()
    .mockResolvedValue({
      ok: true,
      status: 200,
      json,
    } as unknown as Response);

  const res = await createEvent(payload as EventCreatePayload);
  expect(res.event_name).toBe("Show");
  expect(fetch).toHaveBeenCalledWith(
    `${API_BASE_URL}/events`,
    expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      }),
    }),
  );
});
