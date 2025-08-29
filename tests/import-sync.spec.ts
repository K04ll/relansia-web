import { describe, it, expect } from "vitest";
import { syncCsvUrl } from "@/lib/import/syncCsvUrl";

const CSV = `email,first_name,last_name,phone,country,order_id,order_date,order_total,currency,store_name
alice@example.com,Alice,Martin,0612345678,FR,ORD-1,2025-08-10,49.90,EUR,MaBoutique
alice@example.com,Alice,Martin,0612345678,FR,ORD-1,2025-08-10,49.90,EUR,MaBoutique
bob@example.com,Bob,Dupont,,FR,ORD-2,10/08/2025,89.00,EUR,MaBoutique
`;

function okFetch(body: string) {
  return async (_: string) => new Response(body, { status: 200 });
}

describe("syncCsvUrl end-to-end (mocked Supabase)", () => {
  it("upserts and plans reminders (idempotent)", async () => {
    const userId = "user-1";
    const r1 = await syncCsvUrl(userId, "https://example.com/data.csv", okFetch(CSV));
    expect(r1.count).toBe(3);
    expect(r1.purchasesUpserted).toBe(2);
    expect(r1.customersUpserted).toBe(2);
    expect(r1.remindersCreated).toBe(6);

    const r2 = await syncCsvUrl(userId, "https://example.com/data.csv", okFetch(CSV));
    expect(r2.remindersCreated).toBe(0);
  });
});
