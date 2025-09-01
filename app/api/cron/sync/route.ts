// app/api/cron/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseAdmin";
import { syncCsvUrl } from "@/lib/import/syncCsvUrl";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

/** Health */
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/cron/sync", v: "v3" });
}

/** Orchestrateur: boucle sur data_sources.active=true et lance syncCsvUrl */
export async function POST(req: NextRequest) {
  const qsSecret = new URL(req.url).searchParams.get("secret");
  const headerAuth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!CRON_SECRET || (qsSecret !== CRON_SECRET && headerAuth !== CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sb = createClient();

    const { data: sources, error } = await sb
      .from("data_sources")
      .select("id,user_id,url,mapping,active")
      .eq("active", true);

    if (error) {
      return NextResponse.json(
        { error: "List sources failed", detail: error.message, v: "v3" },
        { status: 500 }
      );
    }

    let totalRows = 0;
    let customersUpserted = 0;
    let purchasesUpserted = 0;
    let remindersCreated = 0;

    const results: Array<{
      id: number | string;
      ok: boolean;
      count?: number;
      customersUpserted?: number;
      purchasesUpserted?: number;
      remindersCreated?: number;
      error?: string;
    }> = [];

    for (const s of sources ?? []) {
      try {
        const res = await syncCsvUrl({
          url: String(s.url),
          userId: String(s.user_id),
          mapping: (s as any).mapping ?? undefined,
        });
        totalRows += res.count ?? 0;
        customersUpserted += res.customersUpserted ?? 0;
        purchasesUpserted += res.purchasesUpserted ?? 0;
        remindersCreated += res.remindersCreated ?? 0;

        results.push({
          id: (s as any).id,
          ok: true,
          count: res.count ?? 0,
          customersUpserted: res.customersUpserted ?? 0,
          purchasesUpserted: res.purchasesUpserted ?? 0,
          remindersCreated: res.remindersCreated ?? 0,
        });
      } catch (e: any) {
        console.error("syncCsvUrl error for source", (s as any).id, e?.message || e);
        results.push({ id: (s as any).id, ok: false, error: e?.message || "unknown_error" });
      }
    }

    return NextResponse.json({
      ok: true,
      v: "v3",
      sources: (sources ?? []).length,
      totalRows,
      customersUpserted,
      purchasesUpserted,
      remindersCreated,
      results,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Sync failed", detail: e?.message, v: "v3" },
      { status: 500 }
    );
  }
}

/*
Assumptions:
- Alias "@/..." est résolu (tsconfig paths). Sinon, remplace les imports par:
  import { createClient } from "../../../../lib/supabaseAdmin";
  import { syncCsvUrl } from "../../../../lib/import/syncCsvUrl";
*/
