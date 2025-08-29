import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseAdmin";
import { syncCsvUrl } from "@/lib/import/syncCsvUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: Request) {
  const cronHeader = req.headers.get("x-vercel-cron");
  const auth = req.headers.get("authorization");
  const bearerOk =
    !!auth &&
    auth.startsWith("Bearer ") &&
    auth.slice(7) === process.env.CRON_SECRET;

  return Boolean(cronHeader) || bearerOk;
}

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const sb = createClient();
    const { data: sources, error } = await sb
      .from("data_sources")
      .select("user_id, url")
      .match({ type: "csv_url", active: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!sources?.length) {
      return NextResponse.json({
        ok: true,
        results: [],
        total: { workspaces: 0, rows: 0 },
      });
    }

    const results: Array<Record<string, unknown>> = [];
    let totalRows = 0;

    for (const s of sources) {
      const startedAt = new Date().toISOString();
      try {
        const stats = await syncCsvUrl(String(s.user_id), String(s.url));
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

        totalRows += stats.count;
        results.push({ userId: s.user_id, ok: true, url: s.url, ...stats });
      } catch (e) {
        const err = e as Error;
        await sb.from("sync_runs").insert({
          user_id: s.user_id,
          source_url: s.url,
          started_at: startedAt,
          ended_at: new Date().toISOString(),
          status: "failed",
          error: (err?.message ?? "unknown").slice(0, 500),
        });
        results.push({
          userId: s.user_id,
          ok: false,
          url: s.url,
          error: err?.message,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      total: { workspaces: sources.length, rows: totalRows },
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
