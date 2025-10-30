/*

AI-generated code: 100%

Human code: 0%

Framework-generated code: 0%

*/

describe("API_BASE_URL", () => {
  const ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ENV };
  });

  afterEach(() => {
    process.env = ENV;
  });

  test("trims trailing slash", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:8000/";
    const { API_BASE_URL } = await import("../src/services/config");
    expect(API_BASE_URL).toBe("http://localhost:8000");
  });

  test("falls back to default", async () => {
    delete process.env.NEXT_PUBLIC_BACKEND_URL;
    const { API_BASE_URL } = await import("../src/services/config");
    expect(API_BASE_URL).toBe("http://localhost:8000");
  });
});
