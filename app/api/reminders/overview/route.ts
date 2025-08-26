import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

function err(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}
async function getUserIdOrDev() {
  return process.env.DEV_USER_ID || "11111111-1111-1111-1111-111111111111";
}

export async function GET(req: Request) {
  const userId = await getUserIdOrDev();
  const { searchParams } = new URL(req.url);

  const statusParams = searchParams.getAll("status[]");
  const channelParams = searchParams.getAll("channel[]");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabaseServer.from("reminders").select("status", { count: "exact" }).eq("user_id", userId);
  if (statusParams.length) query = query.in("status", statusParams);
  if (channelParams.length) query = query.in("channel", channelParams);
  if (from) query = query.gte("scheduled_at", from);
  if (to) query = query.lte("scheduled_at", to);

  const { data, error } = await query;
  if (error) return err("db_overview_failed", error.message, 500);

  const counts = { sent: 0, failed: 0, scheduled: 0, canceled: 0 };
  for (const r of data || []) {
    if (r.status in counts) (counts as any)[r.status] += 1;
  }
  return NextResponse.json(counts);
}
