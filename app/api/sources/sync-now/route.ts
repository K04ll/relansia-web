import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseAdmin";
import { syncCsvUrl } from "@/lib/import/syncCsvUrl";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { userId, sourceUrl } = await req.json() as { userId: string; sourceUrl?: string };
    if (!userId) {
      return NextResponse.json({ error: "missing userId" }, { status: 400 });
    }

    const sb = createClient();

    let sources: string[] = [];
    if (sourceUrl) {
      sources = [sourceUrl];
    } else {
      const { data, error } = await sb
        .from("data_sources")
        .select("url")
        .eq("user_id", userId)
        .eq("active", true);
      if (error) throw error;
      sources = (data ?? []).map(x => x.url).filter(Boolean);
    }

    if (sources.length === 0) {
      return NextResponse.json({ ok: true, sources: 0, stats: [] });
    }

    const stats: Array<{
      url: string;
      count: number;
      customersUpserted: number;
      purchasesUpserted: number;
      remindersCreated: number;
    }> = [];

    for (const url of sources) {
      const res = await syncCsvUrl(userId, url);
      stats.push({ url, ...res });

      await sb.from("data_sources")
        .update({ /* si tu ajoutes last_synced_at plus tard */ })
        .eq("user_id", userId)
        .eq("url", url);
    }

    return NextResponse.json({ ok: true, sources: sources.length, stats });
  } catch (e: any) {
    console.error("sync-now error:", e);
    return NextResponse.json({ error: e?.message ?? "sync_failed" }, { status: 500 });
  }
}
