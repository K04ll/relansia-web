// app/api/reminders/logs/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

function err(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}
async function getUserIdOrDev() {
  return process.env.DEV_USER_ID || "00000000-0000-0000-0000-000000000000";
}

export async function GET(req: Request) {
  const userId = await getUserIdOrDev();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

  const { data, error } = await supabaseServer
    .from("dispatch_logs")
    .select("channel,status,provider_id,error_detail,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return err("db_logs_failed", error.message, 500);
  return NextResponse.json({ logs: data || [] });
}
