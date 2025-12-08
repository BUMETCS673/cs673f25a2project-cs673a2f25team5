/*

AI-generated code: 0%

Human code: 10%

Framework-generated code: 90%

*/

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
      on("task", {
        log(message) {
          console.log(message);
          return null;
        },
      });
      return config;
    },
  },
});
