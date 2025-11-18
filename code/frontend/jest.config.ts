/*

AI-generated code: 0%

Human code: 0%

Framework-generated code: 100%

*/

import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^.+\\.(css|sass|scss)$": "identity-obj-proxy",
    "^.+\\.(svg|png|jpg|gif)$": "<rootDir>/__mocks__/fileMock.js",
  },
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  testMatch: [
    "<rootDir>/src/**/*.test.(ts|tsx)",
    "<rootDir>/tests/**/*.test.(ts|tsx)",
  ],
  clearMocks: true,
};

export default createJestConfig(config);
