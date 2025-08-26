// app/api/reminders/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { errorJSON } from "@/lib/logging";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ---------- Schemas ----------
const ChannelEnum = z.enum(["email", "sms", "whatsapp"]);

const CreateReminderBody = z.object({
  user_id: z.string().uuid(),
  client_id: z.string().uuid(),
  channel: ChannelEnum,
  message: z.string().max(10_000).nullable().optional(),
  /** ISO date string. If omitted, uses now + delay_minutes (or now). */
  scheduled_at: z.string().datetime().optional(),
  /** If scheduled_at is not given, delay in minutes from now (default 0). */
  delay_minutes: z.number().int().min(0).max(7 * 24 * 60).optional(),
});

type CreateReminderInput = z.infer<typeof CreateReminderBody>;

// ---------- GET /api/reminders ----------
// Query params:
//   userId (required) | status=scheduled,sending,sent,failed,canceled | channel=email,sms,whatsapp
//   q=search (on message) | limit=number | offset=number | orderBy=created_at|scheduled_at | order=asc|desc
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(errorJSON("missing_user_id", "userId is required"), { status: 400 });
  }

  const statusParam = url.searchParams.get("status");
  const channelParam = url.searchParams.get("channel");
  const q = url.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25", 10), 100);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);
  const orderBy = (url.searchParams.get("orderBy") || "created_at") as "created_at" | "scheduled_at";
  const order = (url.searchParams.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  try {
    let query = supabase
      .from("reminders")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    if (statusParam) {
      const statuses = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (statuses.length) query = query.in("status", statuses);
    }
    if (channelParam) {
      const channels = channelParam.split(",").map((c) => c.trim()).filter(Boolean);
      if (channels.length) query = query.in("channel", channels);
    }
    if (q) {
      // recherche simple sur le message (pas de join)
      query = query.ilike("message", `%${q}%`);
    }

    query = query.order(orderBy, { ascending: order === "asc" }).range(offset, offset + limit - 1);

    const { data: rows, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      rows: rows ?? [],
      total: count ?? 0,
      limit,
      offset,
      orderBy,
      order,
    });
  } catch (e: any) {
    return NextResponse.json(errorJSON("reminders_list_failed", e?.message || "Unknown error"), { status: 500 });
  }
}

// ---------- POST /api/reminders ----------
// Body: { user_id, client_id, channel, message?, scheduled_at? | delay_minutes? }
export async function POST(req: NextRequest) {
  let body: CreateReminderInput;
  try {
    const json = await req.json();
    body = CreateReminderBody.parse(json);
  } catch (e: any) {
    return NextResponse.json(errorJSON("invalid_body", e?.message || "Invalid JSON body"), { status: 400 });
  }

  try {
    const now = Date.now();
    const scheduledAt =
      body.scheduled_at ??
      new Date(now + (body.delay_minutes ? body.delay_minutes * 60_000 : 0)).toISOString();

    // Sprint 8: création en "scheduled" + next_attempt_at initial = scheduledAt
    const toInsert = {
      user_id: body.user_id,
      client_id: body.client_id,
      channel: body.channel,
      message: body.message ?? null,
      status: "scheduled",
      scheduled_at: scheduledAt,
      next_attempt_at: scheduledAt,
      retry_count: 0,
      last_attempt_at: null,
      last_error_code: null,
      last_error: null,
      sent_at: null,
    };

    const { data, error } = await supabase.from("reminders").insert(toInsert).select("*").single();
    if (error) throw error;

    return NextResponse.json({ ok: true, reminder: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(errorJSON("reminder_create_failed", e?.message || "Unknown error"), { status: 500 });
  }
}
