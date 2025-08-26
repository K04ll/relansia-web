// app/api/reminders/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

type Status = "draft" | "scheduled" | "sending" | "sent" | "failed" | "canceled";
type Channel = "email" | "sms" | "whatsapp";

function err(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

async function getUserIdOrDev() {
  return process.env.DEV_USER_ID || "11111111-1111-1111-1111-111111111111";
}

export async function GET(req: Request) {
  const userId = await getUserIdOrDev();
  const { searchParams } = new URL(req.url);

  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "50", 10), 1), 200);

  const statusParams = searchParams.getAll("status[]") as Status[];
  const channelParams = searchParams.getAll("channel[]") as Channel[];
  const q = (searchParams.get("q") || "").trim();
  const from = searchParams.get("from"); // ISO
  const to = searchParams.get("to");     // ISO

  // Si recherche texte, on récupère d'abord les clients correspondants
  let clientFilterIds: string[] | null = null;
  if (q) {
    const { data: clients, error: cliErr } = await supabaseServer
      .from("clients")
      .select("id")
      .eq("user_id", userId)
      .or(`email.ilike.%${q}%,phone.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
    if (cliErr) return err("clients_search_failed", cliErr.message, 500);
    clientFilterIds = (clients || []).map((c) => c.id);
    if (clientFilterIds.length === 0) {
      return NextResponse.json({ rows: [], total: 0 }); // rien ne matche
    }
  }

  // Requête principale avec comptage
  let query = supabaseServer
    .from("reminders")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (statusParams.length) query = query.in("status", statusParams);
  if (channelParams.length) query = query.in("channel", channelParams);
  if (clientFilterIds) query = query.in("client_id", clientFilterIds);
  if (from) query = query.gte("scheduled_at", from);
  if (to) query = query.lte("scheduled_at", to);

  // Pagination
  const fromIdx = (page - 1) * pageSize;
  const toIdx = fromIdx + pageSize - 1;
  query = query.order("scheduled_at", { ascending: true }).range(fromIdx, toIdx);

  const { data, error, count } = await query;
  if (error) return err("db_list_failed", error.message, 500);

  const rows = data || [];

  // Enrichir avec infos client (email/phone/nom)
  const clientIds = Array.from(new Set(rows.map((r: any) => r.client_id))).filter(Boolean);
  let clientMap: Record<string, any> = {};
  if (clientIds.length) {
    const { data: clients2, error: cli2Err } = await supabaseServer
      .from("clients")
      .select("id,email,phone,first_name,last_name")
      .eq("user_id", userId)
      .in("id", clientIds as string[]);
    if (cli2Err) return err("clients_fetch_failed", cli2Err.message, 500);
    clientMap = Object.fromEntries((clients2 || []).map((c) => [c.id, c]));
  }

  const enriched = rows.map((r: any) => {
    const c = clientMap[r.client_id] || {};
    return {
      ...r,
      client_email: c.email ?? null,
      client_phone: c.phone ?? null,
      client_first_name: c.first_name ?? null,
      client_last_name: c.last_name ?? null,
    };
  });

  return NextResponse.json({ rows: enriched, total: count ?? 0 });
}
