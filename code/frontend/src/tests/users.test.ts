/*

AI-generated code: 100%

Human code: 0%

Framework-generated code: 0%

*/

import { getUser } from "@/services/users";
import { API_BASE_URL } from "@/services/config";
import { getUsers } from "@/services/users";
import { auth } from "@clerk/nextjs/server";

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe("users.getUser", () => {
  const base = API_BASE_URL;

  beforeEach(() => {
    jest.restoreAllMocks();
    mockAuth.mockResolvedValue({
      getToken: jest.fn().mockResolvedValue("test-token"),
    } as never);
  });

  test("returns first user when backend responds OK", async () => {
    const payload = {
      items: [
        {
          user_id: "00000000-0000-0000-0000-000000000000",
          first_name: "Ada",
          last_name: "Lovelace",
          email: "ada@example.com",
          date_of_birth: "1815-12-10",
          color: null,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        },
      ],
      total: 1,
      offset: 0,
      limit: 1,
    };
    (globalThis as unknown as { fetch: jest.Mock }).fetch = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(payload),
      });

    const res = await getUser("00000000-0000-0000-0000-000000000000");
    expect(res.email).toBe("ada@example.com");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(new URL("/users", base).toString()),
      expect.any(Object),
    );
  });

  test("throws when no users found", async () => {
    (globalThis as unknown as { fetch: jest.Mock }).fetch = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ items: [], total: 0, offset: 0, limit: 1 }),
      });
    await expect(
      getUser("00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow("User not found");
  });

  test("validates UUID", async () => {
    await expect(getUser("not-a-uuid")).rejects.toBeTruthy();
  });
});

describe("users.getUsers", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockAuth.mockResolvedValue({
      getToken: jest.fn().mockResolvedValue("test-token"),
    } as never);
  });

  test("builds query with filters and pagination", async () => {
    const json = jest.fn().mockResolvedValue({
      items: [],
      total: 0,
      offset: 10,
      limit: 5,
    });

    (globalThis as unknown as { fetch: jest.Mock }).fetch = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        json,
      } as unknown as Response);

    await getUsers({
      filters: ["email:eq:test@example.com", "first_name:ilike:Ann%"],
      offset: 10,
      limit: 5,
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "filter_expression=email%3Aeq%3Atest%40example.com&filter_expression=first_name%3Ailike%3AAnn%25&offset=10&limit=5",
      ),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });

  test("passes abort signal through to fetch", async () => {
    const controller = new AbortController();
    const json = jest.fn().mockResolvedValue({
      items: [],
      total: 0,
      offset: 0,
      limit: 1,
    });

    (globalThis as unknown as { fetch: jest.Mock }).fetch = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        json,
      } as unknown as Response);

    await getUsers({ signal: controller.signal });

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});
