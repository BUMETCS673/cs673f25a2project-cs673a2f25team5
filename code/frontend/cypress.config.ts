import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    env: {
      NEXT_PUBLIC_E2E: "1",
      BACKEND_URL: "http://localhost:8000",
      NEXT_PUBLIC_MAP_BOX_TOKEN: process.env.NEXT_PUBLIC_MAP_BOX_TOKEN,
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
