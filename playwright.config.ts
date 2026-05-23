import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "src/__tests__/playwright",
  timeout: 30 * 1000,
  use: {
    headless: true,
  },
  expect: {
    timeout: 5000,
  },
});
