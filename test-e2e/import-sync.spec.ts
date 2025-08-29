import { test, expect, request } from "@playwright/test";

const CRON_SECRET = process.env.CRON_SECRET;

test.skip(!CRON_SECRET, "CRON_SECRET missing; skip in CI");

test("sync-now endpoint responds with stats", async ({ baseURL }) => {
  const api = await request.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${CRON_SECRET}` }
  });
  const res = await api.get(`${baseURL}/api/data-sources/sync-now`);
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json).toHaveProperty("ok", true);
  expect(json).toHaveProperty("total");
});
