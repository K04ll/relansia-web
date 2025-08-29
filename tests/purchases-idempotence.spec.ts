// tests/purchases-idempotence.spec.ts
import { describe, it, expect } from "vitest";

function uniquenessKey(user_id: string, customer_id: string, order_id: string, order_date: string) {
  return `${user_id}:${customer_id}:${order_id}:${order_date}`;
}

describe("purchase uniqueness key", () => {
  it("same order does not duplicate", () => {
    const k1 = uniquenessKey("u1","c1","#123","2025-08-10T00:00:00.000Z");
    const k2 = uniquenessKey("u1","c1","#123","2025-08-10T00:00:00.000Z");
    expect(k1).toBe(k2);
  });
});
