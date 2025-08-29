// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  // ✅ e2e isolés dans tests/e2e
  testDir: "tests/e2e",
  testMatch: /.*\.spec\.ts$/,
  // ignore tous les unit tests Vitest
  testIgnore: ["**/*.test.ts", "**/*.test.tsx"],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    headless: true,
  },
  // Décommente si tu veux que Playwright lance l'app automatiquement :
  // webServer: {
  //   command: "npm run dev",
  //   port: 3000,
  //   reuseExistingServer: true,
  // },
});
