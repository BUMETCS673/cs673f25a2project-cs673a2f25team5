/*

AI-generated code: 100%

Human code: 0%

Framework-generated code: 0%

*/

import { getUser } from "./users";
import { API_BASE_URL } from "./config";

describe("users.getUser", () => {
  const base = API_BASE_URL;

  beforeEach(() => {
    jest.restoreAllMocks();
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
