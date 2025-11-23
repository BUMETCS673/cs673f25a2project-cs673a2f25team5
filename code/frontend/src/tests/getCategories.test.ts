/*

 AI-generated code: 0%
 
 Human code: 100% (getCategories)
 
 No framework-generated code.

*/

import { getCategories } from "@/services/categories";
import type { CategoryListResponse } from "@/types/categoryTypes";
import { auth } from "@clerk/nextjs/server";

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockFetch = jest.fn();
const originalFetch = globalThis.fetch;

describe("getCategories", () => {
  beforeAll(() => {
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requests categories with filters, offset, and limit and returns parsed data", async () => {
    const responsePayload: CategoryListResponse = {
      items: [
        {
          category_id: "9d7f9e90-4b45-45b0-9d99-53809e0d1c29",
          category_name: "Concerts",
          description: null,
        },
      ],
      total: 1,
      offset: 0,
      limit: 10,
    };

    const mockGetToken = jest.fn().mockResolvedValue("token-123");
    mockAuth.mockResolvedValue({ getToken: mockGetToken });

    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(responsePayload),
    });

    const result = await getCategories({
      filters: ["category_name:eq:Concerts", "location:eq:Boston"],
      offset: 2,
      limit: 5,
    });

    expect(mockAuth).toHaveBeenCalledTimes(1);
    expect(mockGetToken).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/categories?filter_expression=category_name%3Aeq%3AConcerts&filter_expression=location%3Aeq%3ABoston&offset=2&limit=5",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer token-123",
          "Content-Type": "application/json",
        }),
      }),
    );
    expect(result).toEqual(responsePayload);
  });

  it("throws when the API responds with a non-OK status", async () => {
    const mockGetToken = jest.fn().mockResolvedValue("token-456");
    mockAuth.mockResolvedValue({ getToken: mockGetToken });

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn(),
    });

    await expect(getCategories()).rejects.toThrow(
      "Request failed with status 500",
    );
  });

  it("propagates schema validation errors for malformed payloads", async () => {
    const mockGetToken = jest.fn().mockResolvedValue("token-789");
    mockAuth.mockResolvedValue({ getToken: mockGetToken });

    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        items: [
          {
            category_id: "not-a-uuid",
            category_name: "Workshops",
            description: "All things workshops",
          },
        ],
        total: 1,
        offset: 0,
        limit: 10,
      }),
    });

    await expect(getCategories()).rejects.toThrow("Invalid UUID");
  });
});
