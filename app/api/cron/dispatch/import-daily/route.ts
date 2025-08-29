import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseAdmin";
import { syncCsvUrl } from "@/lib/import/syncCsvUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = createClient();
  const { data: sources, error } = await sb
    .from("data_sources")
    .select("user_id, url")
    .match({ type: "csv_url", active: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: Array<Record<string, unknown>> = [];
  for (const s of sources ?? []) {
    const startedAt = new Date().toISOString();
    try {
      const stats = await syncCsvUrl(s.user_id as string, s.url as string);
      const endedAt = new Date().toISOString();

      await sb.from("sync_runs").insert({
        user_id: s.user_id,
        source_url: s.url,
        started_at: startedAt,
        ended_at: endedAt,
        rows_in: stats.count,
        customers_upserted: stats.customersUpserted,
        purchases_upserted: stats.purchasesUpserted,
        reminders_created: stats.remindersCreated,
        status: "success",
      });

      results.push({ userId: s.user_id, ok: true, url: s.url, ...stats });
    } catch (e: any) {
      await sb.from("sync_runs").insert({
        user_id: s.user_id,
        source_url: s.url,
        started_at: startedAt,
        ended_at: new Date().toISOString(),
        status: "failed",
        error: (e?.message ?? "unknown").slice(0, 500),
      });
      results.push({ userId: s.user_id, ok: false, url: s.url, error: e?.message });
    }
  }

  return NextResponse.json({ ok: true, results });
}
