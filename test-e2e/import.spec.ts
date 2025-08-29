import { test, expect, request } from "@playwright/test";

test("CSV upload creates reminders", async ({ request }) => {
  const csv = `email,orderId,orderDate,phone,country
john@example.com,ORD-1,2025-08-20T10:00:00Z,0612345678,FR
`;
  const res = await request.post("/api/import/upload", {
    data: csv,
    headers: { "content-type": "text/csv", "x-workspace-id": "ws_demo" }
  });
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.purchasesUpserted).toBeGreaterThan(0);
  expect(json.remindersCreated).toBeGreaterThan(0);
});
